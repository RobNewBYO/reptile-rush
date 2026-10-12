import Phaser from 'phaser';
import type { EnemyConfig } from '../config/enemies';
import { Sfx } from '../systems/Sfx';

type BossState = 'walk' | 'telegraph' | 'charge' | 'recover' | 'pound';

/** How long the boss may be wedged against a platform before it stops trying and ground-pounds. */
const STUCK_LIMIT_MS = 1000;
/** Wind-up before a pound lands (the boss rears and flashes yellow). */
const POUND_WINDUP_MS = 800;
/** Minimum time between pounds. */
const POUND_COOLDOWN_MS = 5000;

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly cfg: EnemyConfig;
  hp: number;
  defeated = false;
  /** Boss only: asleep until the player gets close. */
  awake: boolean;
  private dir = -1;
  private homeX: number;
  private homeY: number;
  private patrol: number;
  private mode: BossState = 'walk';
  private stateUntil = 0;
  private invulnUntil = 0;
  private statusFx?: Phaser.GameObjects.Text;
  private afraidUntil = 0;
  private knockUntil = 0;
  private lastTick = 0;
  /** ms spent pushing against a non-level-edge obstacle (e.g. the edge of a low platform). */
  private stuckMs = 0;
  private poundQueued = false;
  private poundReadyAt = 0;
  /** Water level: no gravity, bobbing movement, and bosses that charge in any direction. */
  private water: boolean;
  private swimPhase: number;
  /** Direction of the current charge in water (unit vector). */
  private vec = { x: -1, y: 0 };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    cfg: EnemyConfig,
    patrol = 150,
    water = false,
  ) {
    super(scene, x, y, cfg.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.homeX = x;
    this.homeY = y;
    this.patrol = patrol;
    this.awake = !cfg.boss;
    this.water = water;
    this.swimPhase = (x % 97) / 97 * Math.PI * 2;
    this.setCollideWorldBounds(true);
    if (water) (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  /** True while touching this enemy would not hurt the player. */
  get harmless(): boolean {
    return (
      this.defeated ||
      this.afraid ||
      (this.cfg.boss === true && (!this.awake || this.mode === 'recover'))
    );
  }

  /** Frozen with fear (lizard's mean look): can't move or hurt anyone. */
  get afraid(): boolean {
    return this.scene.time.now < this.afraidUntil;
  }

  /** Bosses only take damage while dizzy after a charge; everything else is always hittable. */
  get vulnerable(): boolean {
    if (this.defeated) return false;
    return !this.cfg.boss || (this.awake && this.mode === 'recover');
  }

  tick(time: number, playerX: number, playerY = this.y) {
    if (this.defeated) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = this.lastTick ? time - this.lastTick : 0;
    this.lastTick = time;

    if (time < this.afraidUntil) {
      this.setVelocityX(0);
      if (this.water) this.setVelocityY(0);
      // A scared boss's attack pattern pauses too, instead of running out while it's frozen.
      if (this.cfg.boss) this.stateUntil += dt;
      this.updateStatusFx();
      return;
    }
    if (time < this.knockUntil) {
      this.updateStatusFx();
      return;
    }

    if (!this.cfg.boss) {
      if (this.x < this.homeX - this.patrol || body.blocked.left) this.dir = 1;
      else if (this.x > this.homeX + this.patrol || body.blocked.right) this.dir = -1;
      this.setVelocityX(this.dir * this.cfg.speed);
      if (this.water) {
        // Bob gently around the spawn height (or hold still if this animal doesn't swim).
        const sw = this.cfg.swim;
        if (sw) {
          const w = (Math.PI * 2) / sw.periodSec;
          this.setVelocityY(sw.amp * w * Math.cos(w * (time / 1000) + this.swimPhase));
        } else {
          this.setVelocityY(0);
        }
      }
      this.setFlipX(this.dir > 0);
      return;
    }

    if (!this.awake) {
      this.setVelocityX(0);
      if (this.water) this.setVelocityY(0);
      return;
    }

    if (this.water) {
      this.tickWaterBoss(time, playerX, playerY, body);
      this.setFlipX(this.dir > 0);
      this.updateStatusFx();
      return;
    }

    const toPlayer = playerX < this.x ? -1 : 1;
    switch (this.mode) {
      case 'walk':
        this.dir = toPlayer;
        this.setVelocityX(this.dir * this.cfg.speed);
        if (this.poundQueued && time >= this.poundReadyAt) {
          this.poundQueued = false;
          this.stuckMs = 0;
          this.setVelocityY(-260); // rears up
          this.enter('pound', time, POUND_WINDUP_MS);
        } else if (time > this.stateUntil) {
          this.enter('telegraph', time, 700);
        }
        break;
      case 'telegraph':
        // Wind-up: stop, flash red so a 7-year-old can see the charge coming.
        this.setVelocityX(0);
        this.dir = toPlayer;
        this.setTint(Math.floor(time / 90) % 2 ? 0xff6666 : 0xffffff);
        if (time > this.stateUntil) this.enter('charge', time, 900);
        break;
      case 'charge':
        this.clearTint();
        this.setVelocityX(this.dir * (this.cfg.chargeSpeed ?? 300));
        if (this.hitLevelEdge(body)) {
          // Slammed into the end of the level: that's a real crash, so it's dizzy.
          this.enter('recover', time, this.cfg.dizzyMs ?? 1400);
        } else if (body.blocked.left || body.blocked.right || this.obstacleAhead(body)) {
          // Stopped by a platform. If it had already run past the player, the player dodged it, so
          // that's earned. If it was stopped short of the player (hiding under a ledge), it's not.
          const passedPlayer = this.dir < 0 ? this.x <= playerX : this.x >= playerX;
          if (passedPlayer) {
            this.enter('recover', time, this.cfg.dizzyMs ?? 1400);
          } else {
            this.setVelocityX(-this.dir * 140);
            this.enter('walk', time, 1200);
          }
        } else if (time > this.stateUntil) {
          // Ran its whole charge across open ground (the player dodged it): dizzy.
          this.enter('recover', time, this.cfg.dizzyMs ?? 1400);
        }
        break;
      case 'pound':
        // Rear up and flash yellow, then slam: shockwaves run along the floor (see LevelScene).
        this.setVelocityX(0);
        this.setTint(Math.floor(time / 70) % 2 ? 0xffd54f : 0xffffff);
        if (time > this.stateUntil) {
          this.clearTint();
          this.poundReadyAt = time + POUND_COOLDOWN_MS;
          this.emit('pound', this.x, this.y + this.displayHeight / 2);
          // Not dizzy afterwards: camping must never turn into a free-hit window.
          this.enter('walk', time, 1800);
        }
        break;
      case 'recover':
        this.setVelocityX(0);
        this.setAlpha(Math.floor(time / 200) % 2 ? 0.7 : 1); // dizzy wobble
        if (time > this.stateUntil) {
          this.setAlpha(1);
          this.enter('walk', time, 2000);
        }
        break;
    }
    this.trackStuck(body, dt);
    this.setFlipX(this.dir > 0);
    this.updateStatusFx();
  }

  /** Water bosses swim straight at the player and charge along any direction, not just sideways. */
  private tickWaterBoss(time: number, px: number, py: number, body: Phaser.Physics.Arcade.Body) {
    const dx = px - this.x;
    const dy = py - this.y;
    const len = Math.hypot(dx, dy) || 1;
    switch (this.mode) {
      case 'walk':
      case 'pound': {
        const sp = this.cfg.speed;
        this.setVelocity((dx / len) * sp, (dy / len) * sp);
        this.dir = dx < 0 ? -1 : 1;
        if (time > this.stateUntil) this.enter('telegraph', time, 700);
        break;
      }
      case 'telegraph':
        // Wind-up: hold still and flash red; the charge heads where the player was at the end of it.
        this.setVelocity(0, 0);
        this.dir = dx < 0 ? -1 : 1;
        this.setTint(Math.floor(time / 90) % 2 ? 0xff6666 : 0xffffff);
        if (time > this.stateUntil) {
          this.vec = { x: dx / len, y: dy / len };
          this.enter('charge', time, 900);
        }
        break;
      case 'charge': {
        this.clearTint();
        const cs = this.cfg.chargeSpeed ?? 300;
        this.setVelocity(this.vec.x * cs, this.vec.y * cs);
        const side = body.blocked.left || body.blocked.right;
        // Boss arenas are open water (checked by `npm run check:levels`), so a side block away from the
        // end of the level is just a catch on the seabed's tile seams, not an obstacle: keep charging.
        // Resting on the seabed while charging sideways isn't a crash; driving into it is.
        const crashed =
          (body.blocked.down && this.vec.y > 0.3) ||
          (body.blocked.up && this.vec.y < -0.3) ||
          (side && this.hitLevelEdge(body));
        if (crashed) {
          this.enter('recover', time, this.cfg.dizzyMs ?? 1400);
        } else if (time > this.stateUntil) {
          // Swam its whole charge through open water (the player dodged it): dizzy.
          this.enter('recover', time, this.cfg.dizzyMs ?? 1400);
        }
        break;
      }
      case 'recover':
        this.setVelocity(0, 0);
        this.setAlpha(Math.floor(time / 200) % 2 ? 0.7 : 1);
        if (time > this.stateUntil) {
          this.setAlpha(1);
          this.enter('walk', time, 2000);
        }
        break;
    }
  }

  /** A solid thing (platform) right in front of the boss, even if it hasn't touched it yet. */
  private obstacleAhead(body: Phaser.Physics.Arcade.Body): boolean {
    const x = this.dir > 0 ? body.right + 1 : body.left - 29;
    // Sampled above the floor line, so the ground itself never counts.
    return this.scene.physics.overlapRect(x, body.top + 4, 28, body.height - 14, false, true).length > 0;
  }

  /** Against the left/right end of the level (as opposed to a platform edge). */
  private hitLevelEdge(body: Phaser.Physics.Arcade.Body): boolean {
    const wb = this.scene.physics.world.bounds;
    return (
      (body.blocked.left || body.blocked.right) && (body.left <= wb.x + 2 || body.right >= wb.right - 2)
    );
  }

  /**
   * If the boss keeps getting wedged against something it can't pass (typically a player hiding
   * under a low platform), it gives up walking and ground-pounds instead.
   */
  private trackStuck(body: Phaser.Physics.Arcade.Body, dt: number) {
    if (this.water) return; // no ground to pound in the water
    const wedged =
      (this.mode === 'walk' || this.mode === 'charge') &&
      (body.blocked.left || body.blocked.right) &&
      !this.hitLevelEdge(body);
    // Only a boss that's moving freely clears the count; standing still in a wind-up keeps it, so
    // the walk -> telegraph -> charge cycle can't reset it every time.
    const movingFree = !body.blocked.left && !body.blocked.right && Math.abs(body.velocity.x) > 30;
    if (wedged) this.stuckMs += dt;
    else if (movingFree) this.stuckMs = Math.max(0, this.stuckMs - dt * 2);
    if (this.stuckMs > STUCK_LIMIT_MS) this.requestPound();
  }

  /** Ask for a ground pound at the next safe moment (used by the level when someone is camping). */
  requestPound() {
    if (this.water) return;
    this.poundQueued = true;
  }

  /** Icon above the head: 💫 while a boss is hittable, 😨 while scared. Readable without text. */
  private updateStatusFx() {
    const emoji =
      this.defeated ? null : this.afraid ? '😨' : this.cfg.boss && this.mode === 'recover' ? '💫' : null;
    if (emoji && !this.statusFx) {
      this.statusFx = this.scene.add.text(0, 0, emoji, { fontSize: '72px' }).setOrigin(0.5).setDepth(60);
    }
    if (this.statusFx) {
      if (emoji) this.statusFx.setText(emoji);
      this.statusFx.setVisible(!!emoji);
      this.statusFx.setPosition(this.x, this.y - this.displayHeight / 2 - 16);
      this.statusFx.angle = Math.sin(this.scene.time.now / 120) * 12;
      this.statusFx.setFontSize(emoji === '😨' ? 44 : 72);
    }
  }

  /** Freeze with fear. Bosses only flinch briefly. */
  scare(now: number, ms: number) {
    if (this.defeated) return;
    this.afraidUntil = now + (this.cfg.boss ? Math.min(ms, 1200) : ms);
    this.setVelocityX(0);
  }

  /** Brief push-back (water gun, wave, splash). Ignored by bosses. */
  knock(now: number, ms: number, vx: number, vy = 0) {
    if (this.defeated || this.cfg.boss) return;
    this.knockUntil = now + ms;
    this.setVelocityX(vx);
    if (this.water) this.setVelocityY(vy);
  }

  /** Back to the spawn point (used if an enemy ever leaves the level). */
  respawn() {
    // body.reset (not setPosition) so the physics step doesn't see a huge jump and fling it away.
    (this.body as Phaser.Physics.Arcade.Body).reset(this.homeX, this.homeY);
  }

  private enter(next: BossState, time: number, duration: number) {
    if (next === 'telegraph') Sfx.play('telegraph');
    if (next === 'recover') Sfx.play('dizzy');
    this.mode = next;
    this.stateUntil = time + duration;
  }

  /** Fresh fight: full health, asleep at its spawn point. Used when the player loses to the boss. */
  resetFight() {
    this.hp = this.cfg.hp;
    this.awake = false;
    this.mode = 'walk';
    this.stateUntil = 0;
    this.invulnUntil = 0;
    this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    this.setAlpha(1);
    this.afraidUntil = 0;
    this.knockUntil = 0;
    this.stuckMs = 0;
    this.poundQueued = false;
    this.poundReadyAt = 0;
    this.respawn();
    this.updateStatusFx();
  }

  /**
   * Returns true if the hit landed. `damage` is how many hit points it removes. `sweep` (px) makes a
   * defeated enemy be carried that far instead of floating up: the turtle's wave and the toad's splash.
   */
  hit(time: number, damage = 1, sweep?: { x: number; y: number }): boolean {
    if (!this.vulnerable || time < this.invulnUntil) return false;
    this.hp -= damage;
    this.invulnUntil = time + (this.cfg.boss ? 900 : 0);
    if (this.hp <= 0) {
      this.defeat(sweep);
    } else {
      this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(120, () => {
        if (this.active) this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      });
    }
    return true;
  }

  private defeat(sweep?: { x: number; y: number }) {
    this.defeated = true;
    this.statusFx?.destroy();
    this.statusFx = undefined;
    Sfx.play(this.cfg.boss ? 'bossDefeat' : 'squeak');
    this.clearTint();
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    const star = this.scene.add
      .text(this.x, this.y - this.displayHeight / 2, '⭐', { fontSize: '40px' })
      .setOrigin(0.5);
    this.scene.tweens.add({ targets: star, y: star.y - 70, alpha: 0, duration: 800 });
    this.scene.tweens.add({
      targets: this,
      angle: sweep ? 540 : 360,
      x: sweep ? this.x + sweep.x : this.x,
      y: sweep ? this.y + sweep.y : this.y - 60,
      alpha: 0,
      duration: this.cfg.boss ? 1200 : sweep ? 750 : 600,
      onComplete: () => {
        this.emit('gone');
        this.destroy();
      },
    });
  }
}

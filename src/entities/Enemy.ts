import Phaser from 'phaser';
import type { EnemyConfig } from '../config/enemies';
import { Sfx } from '../systems/Sfx';

type BossState = 'walk' | 'telegraph' | 'charge' | 'recover';

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

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: EnemyConfig, patrol = 150) {
    super(scene, x, y, cfg.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.cfg = cfg;
    this.hp = cfg.hp;
    this.homeX = x;
    this.homeY = y;
    this.patrol = patrol;
    this.awake = !cfg.boss;
    this.setCollideWorldBounds(true);
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

  tick(time: number, playerX: number) {
    if (this.defeated) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = this.lastTick ? time - this.lastTick : 0;
    this.lastTick = time;

    if (time < this.afraidUntil) {
      this.setVelocityX(0);
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
      this.setFlipX(this.dir > 0);
      return;
    }

    if (!this.awake) {
      this.setVelocityX(0);
      return;
    }

    const toPlayer = playerX < this.x ? -1 : 1;
    switch (this.mode) {
      case 'walk':
        this.dir = toPlayer;
        this.setVelocityX(this.dir * this.cfg.speed);
        if (time > this.stateUntil) this.enter('telegraph', time, 700);
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
        if (time > this.stateUntil || body.blocked.left || body.blocked.right) {
          this.enter('recover', time, this.cfg.dizzyMs ?? 1400);
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
    this.setFlipX(this.dir > 0);
    this.updateStatusFx();
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

  /** Brief push-back (water gun). Ignored by bosses. */
  knock(now: number, ms: number, vx: number) {
    if (this.defeated || this.cfg.boss) return;
    this.knockUntil = now + ms;
    this.setVelocityX(vx);
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
    this.respawn();
    this.updateStatusFx();
  }

  /** Returns true if the hit landed. `damage` is how many hit points it removes. */
  hit(time: number, damage = 1): boolean {
    if (!this.vulnerable || time < this.invulnUntil) return false;
    this.hp -= damage;
    this.invulnUntil = time + (this.cfg.boss ? 900 : 0);
    if (this.hp <= 0) {
      this.defeat();
    } else {
      this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(120, () => {
        if (this.active) this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      });
    }
    return true;
  }

  private defeat() {
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
      angle: 360,
      y: this.y - 60,
      alpha: 0,
      duration: this.cfg.boss ? 1200 : 600,
      onComplete: () => {
        this.emit('gone');
        this.destroy();
      },
    });
  }
}

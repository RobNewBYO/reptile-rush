import Phaser from 'phaser';
import type { EnemyConfig } from '../config/enemies';

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
    return this.defeated || (this.cfg.boss === true && (!this.awake || this.mode === 'recover'));
  }

  tick(time: number, playerX: number) {
    if (this.defeated) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

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
          this.enter('recover', time, 1400);
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
  }

  /** Back to the spawn point (used if an enemy ever leaves the level). */
  respawn() {
    // body.reset (not setPosition) so the physics step doesn't see a huge jump and fling it away.
    (this.body as Phaser.Physics.Arcade.Body).reset(this.homeX, this.homeY);
  }

  private enter(next: BossState, time: number, duration: number) {
    this.mode = next;
    this.stateUntil = time + duration;
  }

  /** Returns true if the hit landed. */
  hit(time: number): boolean {
    if (this.defeated || time < this.invulnUntil) return false;
    this.hp -= 1;
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

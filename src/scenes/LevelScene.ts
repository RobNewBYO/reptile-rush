import Phaser from 'phaser';
import { ENEMIES } from '../config/enemies';
import { getForm, type FormConfig } from '../config/forms';
import type { LevelConfig } from '../config/levels';
import { Enemy } from '../entities/Enemy';
import { Controls } from '../systems/Controls';
import { Save } from '../systems/Save';

const MAX_HEARTS = 3;
const BOSS_BAR_W = 300;

export class LevelScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Phaser.Physics.Arcade.Sprite;
  private form!: FormConfig;
  private level!: LevelConfig;
  private enemies!: Phaser.Physics.Arcade.Group;
  private boss!: Enemy;

  private hearts = MAX_HEARTS;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private hurtCount = 0;
  private facing = 1;
  private invulnUntil = 0;
  private bonkUntil = 0;
  private bonkReadyAt = 0;
  private clinkReadyAt = 0;
  private finished = false;
  /** Hearts hit zero; waiting out the 💔 beat before restarting the level or boss fight. */
  private dying = false;

  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossIcon!: Phaser.GameObjects.Text;

  constructor() {
    super('Level');
  }

  init(data: { levelId: string; formId: string; hurt?: number }) {
    this.level = this.cache.json.get(data.levelId) as LevelConfig;
    this.form = getForm(data.formId, Save.species);
    this.hearts = MAX_HEARTS;
    // Hurts carry across level restarts, so a restart shows up in the final stars.
    this.hurtCount = data.hurt ?? 0;
    this.finished = false;
    this.dying = false;
    this.clinkReadyAt = 0;
    this.invulnUntil = this.bonkUntil = this.bonkReadyAt = 0;
    this.heartIcons = [];
  }

  create() {
    const { width, height } = this.level;
    this.cameras.main.setBackgroundColor('#8ed1fc').fadeIn(300);
    this.physics.world.setBounds(0, 0, width, height + 200);

    const solids = this.physics.add.staticGroup();
    for (let x = 0; x < width; x += 64) solids.create(x + 32, height - 32, 'ground');
    for (const p of this.level.platforms) {
      const plat = solids.create(p.x, p.y, 'platform') as Phaser.Physics.Arcade.Sprite;
      plat.setDisplaySize(p.w, 24).refreshBody();
    }

    // Spawn in the gap between the left and right touch buttons, not underneath one.
    this.player = this.physics.add.sprite(360, height - 140, this.form.texture);
    this.player.setCollideWorldBounds(true).setDragX(900);
    this.player.setScale(this.form.scale);
    const tex = this.player.frame;
    const { w, h } = this.form.body;
    this.player.setSize(w, h).setOffset((tex.width - w) / 2, tex.height - h);
    this.physics.add.collider(this.player, solids);

    // Enemies
    // Group defaults override per-sprite settings, so world-bounds collision must be set here.
    this.enemies = this.physics.add.group({ collideWorldBounds: true });
    for (const e of this.level.enemies) {
      const en = new Enemy(this, e.x, height - 120, ENEMIES[e.type], e.patrol);
      this.enemies.add(en);
    }
    this.boss = new Enemy(this, this.level.boss.x, height - 140, ENEMIES[this.level.boss.type]);
    this.enemies.add(this.boss);
    this.boss.once('gone', () => this.completeLevel());
    this.physics.add.collider(this.enemies, solids);
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.onContact(e as unknown as Enemy));

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.controls = new Controls(this);
    this.buildHud();

    // Home button (top-right) back to level select.
    const home = this.add
      .circle(this.scale.width - 48, 48, 36, 0x000000, 0.4)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();
    this.add.text(this.scale.width - 48, 48, '⌂', { fontSize: '44px' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    home.on('pointerdown', () => this.scene.start('LevelSelect'));
  }

  private buildHud() {
    for (let i = 0; i < MAX_HEARTS; i++) {
      this.heartIcons.push(
        this.add.image(36 + i * 44, 34, 'heart').setScrollFactor(0).setDepth(100).setScale(1.2),
      );
    }
    const cx = this.scale.width / 2;
    this.bossBarBg = this.add
      .rectangle(cx + 20, 34, BOSS_BAR_W + 8, 26, 0x000000, 0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    this.bossBar = this.add
      .rectangle(cx + 20 - BOSS_BAR_W / 2, 34, BOSS_BAR_W, 18, 0xe53935)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);
    this.bossIcon = this.add
      .text(cx - BOSS_BAR_W / 2 - 24, 34, this.boss.cfg.icon ?? '👹', { fontSize: '36px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
  }

  private onContact(enemy: Enemy) {
    if (enemy.defeated || this.finished || this.dying) return;
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    const eBody = enemy.body as Phaser.Physics.Arcade.Body;
    const now = this.time.now;

    const stomp = !enemy.cfg.spiky && pBody.velocity.y > 0 && pBody.bottom <= eBody.top + 28;
    const bonking = now < this.bonkUntil;

    if (stomp || bonking) {
      // A boss that isn't dizzy shrugs hits off: bounce away, no damage either way.
      if (enemy.cfg.boss && !enemy.vulnerable) {
        this.clink(enemy, now, stomp, bonking);
        return;
      }
      if (enemy.hit(now)) {
        if (stomp) this.player.setVelocityY(-380);
        if (bonking) this.onBonkLanded(now);
      }
      return;
    }
    if (enemy.harmless || now < this.invulnUntil) return;
    this.hurt(enemy.x);
  }

  /** A landed bonk ends the dash (no ploughing through a crowd) and refunds the cooldown. */
  private onBonkLanded(now: number) {
    this.bonkUntil = now;
    this.player.setVelocityX(0);
    this.bonkReadyAt = now + this.form.attack.cooldown;
    // Grace for other mammals overlapping this same frame, so ending the dash isn't unfair.
    this.invulnUntil = Math.max(this.invulnUntil, now + 300);
  }

  private clink(enemy: Enemy, now: number, stomp: boolean, bonking: boolean) {
    if (now < this.clinkReadyAt) return;
    this.clinkReadyAt = now + 250;
    if (stomp) this.player.setVelocityY(-380);
    if (bonking) {
      this.bonkUntil = now;
      this.bonkReadyAt = now + this.form.attack.missCooldown;
      this.player.setVelocity(-this.facing * 280, -220);
      this.invulnUntil = Math.max(this.invulnUntil, now + 400);
    }
    const fx = this.add.text(enemy.x, enemy.y - enemy.displayHeight / 2, '🛡️', { fontSize: '44px' }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: fx, y: fx.y - 40, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
  }

  private hurt(fromX: number) {
    if (this.dying) return;
    const now = this.time.now;
    this.hearts -= 1;
    this.hurtCount += 1;
    this.invulnUntil = now + 1500;
    this.cameras.main.shake(120, 0.006);
    this.player.setVelocity(this.player.x < fromX ? -320 : 320, -300);
    this.refreshHearts();

    if (this.hearts <= 0) this.lose();
  }

  /**
   * Out of hearts. Fighting the boss -> restart the fight (boss back to full health, asleep);
   * anywhere else -> restart the whole level.
   */
  private lose() {
    this.dying = true;
    const bossFight = this.boss.awake && !this.boss.defeated;
    const { width, height } = this.scale;

    const icon = this.add
      .text(width / 2, height / 2, '💔', { fontSize: '140px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setScale(0);
    this.tweens.add({ targets: icon, scale: 1, duration: 300, ease: 'Back.Out' });

    this.time.delayedCall(1000, () => this.cameras.main.fadeOut(300));
    this.time.delayedCall(1350, () => {
      if (!bossFight) {
        this.scene.restart({ levelId: this.level.id, formId: this.form.id, hurt: this.hurtCount });
        return;
      }
      icon.destroy();
      this.boss.resetFight();
      this.bossBarBg.setVisible(false);
      this.bossBar.setVisible(false);
      this.bossIcon.setVisible(false);
      this.hearts = MAX_HEARTS;
      this.refreshHearts();
      // Just outside the arena, so the player walks in and wakes the boss on their own terms.
      (this.player.body as Phaser.Physics.Arcade.Body).reset(
        this.level.boss.wakeX - 60,
        this.level.height - 140,
      );
      this.facing = 1;
      this.invulnUntil = this.time.now + 1500;
      this.bonkUntil = this.bonkReadyAt = 0;
      this.dying = false;
      this.cameras.main.fadeIn(300);
    });
  }

  private showAttackFx() {
    const fx = this.add
      .text(this.player.x + this.facing * 46, this.player.y - 6, this.form.attack.icon, {
        fontSize: '40px',
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: fx,
      x: fx.x + this.facing * 40,
      alpha: 0,
      scale: 1.5,
      duration: 260,
      onComplete: () => fx.destroy(),
    });
  }

  private refreshHearts() {
    this.heartIcons.forEach((h, i) => h.setAlpha(i < this.hearts ? 1 : 0.2));
  }

  private completeLevel() {
    if (this.finished) return;
    this.finished = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(550, () =>
      this.scene.start('Results', {
        levelId: this.level.id,
        formId: this.form.id,
        hurt: this.hurtCount,
      }),
    );
  }

  update(time: number) {
    this.controls.update();
    const c = this.controls.state;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    if (!this.finished && !this.dying) {
      if (c.left) {
        this.player.setVelocityX(-this.form.speed);
        this.facing = -1;
      } else if (c.right) {
        this.player.setVelocityX(this.form.speed);
        this.facing = 1;
      }
      if (c.jump && body.blocked.down) this.player.setVelocityY(-this.form.jumpVelocity);

      // Bonk: a short dash that defeats mammals it touches.
      if (c.action && time >= this.bonkReadyAt) {
        this.bonkUntil = time + this.form.attack.duration;
        // Assume a whiff; onBonkLanded() shortens this if it connects.
        this.bonkReadyAt = time + this.form.attack.duration + this.form.attack.missCooldown;
        this.showAttackFx();
      }
      if (time < this.bonkUntil) {
        this.player.setVelocityX(this.facing * this.form.attack.speed);
        this.player.setTint(0xffe066);
      } else {
        this.player.clearTint();
      }
    }

    this.player.setFlipX(!this.form.rolls && this.facing < 0);

    // Blink while invulnerable.
    this.player.setAlpha(time < this.invulnUntil && Math.floor(time / 100) % 2 ? 0.3 : 1);

    if (this.form.rolls) this.player.angle += body.velocity.x * 0.02;

    this.controls.actionReady = time >= this.bonkReadyAt;

    // Boss wakes when the player gets close.
    if (!this.boss.awake && this.player.x > this.level.boss.wakeX) {
      this.boss.awake = true;
      this.bossBarBg.setVisible(true);
      this.bossBar.setVisible(true);
      this.bossIcon.setVisible(true);
    }
    if (this.boss.active) {
      this.bossBar.width = BOSS_BAR_W * Math.max(0, this.boss.hp / this.boss.cfg.hp);
    }

    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      en.tick(time, this.player.x);
      // Safety net: if anything ever ends up outside the level, put it back rather than lose it.
      if (!en.defeated && (en.y > this.level.height + 50 || en.x < 0 || en.x > this.level.width)) {
        en.respawn();
      }
    });
  }
}

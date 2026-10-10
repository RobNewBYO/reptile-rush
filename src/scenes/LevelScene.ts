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
  private checkpointX = 100;
  private finished = false;

  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossIcon!: Phaser.GameObjects.Text;

  constructor() {
    super('Level');
  }

  init(data: { levelId: string; formId: string }) {
    this.level = this.cache.json.get(data.levelId) as LevelConfig;
    this.form = getForm(data.formId, Save.species);
    this.hearts = MAX_HEARTS;
    this.hurtCount = 0;
    this.checkpointX = 100;
    this.finished = false;
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

    this.player = this.physics.add.sprite(100, height - 140, this.form.texture);
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
      .circle(this.scale.width - 40, 40, 26, 0x000000, 0.35)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();
    this.add.text(this.scale.width - 40, 40, '⌂', { fontSize: '34px' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
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
    if (enemy.defeated || this.finished) return;
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    const eBody = enemy.body as Phaser.Physics.Arcade.Body;
    const now = this.time.now;

    const stomp = !enemy.cfg.spiky && pBody.velocity.y > 0 && pBody.bottom <= eBody.top + 28;
    const bonking = now < this.bonkUntil;

    if (stomp || bonking) {
      if (enemy.hit(now) && stomp) this.player.setVelocityY(-380);
      return;
    }
    if (enemy.harmless || now < this.invulnUntil) return;
    this.hurt(enemy.x);
  }

  private hurt(fromX: number) {
    const now = this.time.now;
    this.hearts -= 1;
    this.hurtCount += 1;
    this.invulnUntil = now + 1500;
    this.cameras.main.shake(120, 0.006);
    this.player.setVelocity(this.player.x < fromX ? -320 : 320, -300);
    this.refreshHearts();

    if (this.hearts <= 0) {
      // No hard game-over: back to the last checkpoint with full hearts.
      this.time.delayedCall(350, () => {
        this.hearts = MAX_HEARTS;
        (this.player.body as Phaser.Physics.Arcade.Body).reset(this.checkpointX, this.level.height - 140);
        this.invulnUntil = this.time.now + 2000;
        this.refreshHearts();
      });
    }
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

    if (!this.finished) {
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
        this.bonkReadyAt = time + this.form.attack.cooldown;
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

    // Checkpoints every 1000px.
    this.checkpointX = Math.max(this.checkpointX, Math.floor(this.player.x / 1000) * 1000 + 100);

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

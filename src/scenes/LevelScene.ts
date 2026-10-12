import Phaser from 'phaser';
import type { Ability } from '../config/characters';
import { ENEMIES } from '../config/enemies';
import { getForm, type FormConfig } from '../config/forms';
import type { LevelConfig } from '../config/levels';
import { THEMES } from '../config/themes';
import { Enemy } from '../entities/Enemy';
import { Controls } from '../systems/Controls';
import { Save } from '../systems/Save';
import { findHidingSpots } from '../systems/levelRules';
import { Sfx } from '../systems/Sfx';
import { addMuteButton } from './ui';

const EGG_HEARTS = 3;
const BOSS_BAR_W = 220;
const STOMP_BOUNCE = -380;
/** Default trampoline launch speed: apex about 300px up, enough to clear every arena platform. */
const TRAMPOLINE_POWER = 860;

export class LevelScene extends Phaser.Scene {
  private controls!: Controls;
  private player!: Phaser.Physics.Arcade.Sprite;
  private form!: FormConfig;
  private level!: LevelConfig;
  private enemies!: Phaser.Physics.Arcade.Group;
  private shots!: Phaser.Physics.Arcade.Group;
  private waves!: Phaser.Physics.Arcade.Group;
  private padReadyAt = 0;
  private pickups!: Phaser.Physics.Arcade.Group;
  private bugText!: Phaser.GameObjects.Text;
  /** The final boss (ends the level). */
  private boss!: Enemy;
  /** Long levels have a checkpoint flag in the middle: reaching it refills hearts and saves your place. */
  private checkpointReached = false;
  private flag?: Phaser.GameObjects.Text;
  private water = false;
  /** Pale silhouette behind the player on dark levels. */
  private halo?: Phaser.GameObjects.Sprite;

  private maxHearts = EGG_HEARTS;
  private hearts = EGG_HEARTS;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private hurtCount = 0;
  private facing = 1;
  private invulnUntil = 0;
  /** Egg dash: contact defeats mammals until this time. */
  private bonkUntil = 0;
  /** When the action button can be used again (egg dash or character ability). */
  private actionReadyAt = 0;
  private clinkReadyAt = 0;
  private finished = false;
  /** Hearts hit zero; waiting out the 💔 beat before restarting the level or boss fight. */
  private dying = false;

  private jumpsLeft = 0;
  private prevJump = false;
  private slamming = false;
  private slamStart = 0;
  /** ms the player has been standing on a platform while the boss is awake. */
  private campMs = 0;
  private lastUpdate = 0;

  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossIcon!: Phaser.GameObjects.Text;
  private badge?: Phaser.GameObjects.Image;

  constructor() {
    super('Level');
  }

  init(data: { levelId: string; formId: string; hurt?: number; checkpoint?: boolean }) {
    this.level = this.cache.json.get(data.levelId) as LevelConfig;
    this.water = !!this.level.water;
    // Coming back after a loss past the checkpoint: start from the flag, not the beginning.
    this.checkpointReached = !!data.checkpoint && !!this.level.checkpoint;
    this.flag = undefined;
    this.form = this.currentForm(data.formId);
    this.maxHearts = this.form.character?.maxHearts ?? EGG_HEARTS;
    this.hearts = this.maxHearts;
    // Hurts carry across level restarts, so a restart shows up in the final stars.
    this.hurtCount = data.hurt ?? 0;
    this.finished = false;
    this.dying = false;
    this.clinkReadyAt = 0;
    this.invulnUntil = this.bonkUntil = this.actionReadyAt = 0;
    this.jumpsLeft = 0;
    this.prevJump = false;
    this.slamming = false;
    this.campMs = 0;
    this.lastUpdate = 0;
    this.padReadyAt = 0;
    this.heartIcons = [];
    this.badge = undefined;
  }

  create() {
    const { width, height } = this.level;
    const theme = THEMES[this.level.theme ?? 'meadow'] ?? THEMES.meadow;
    this.cameras.main.setBackgroundColor(theme.sky).fadeIn(300);
    // Water levels fill the screen top to bottom, so the world is exactly one screen tall.
    this.physics.world.setBounds(0, 0, width, this.water ? height : height + 200);

    // The floor and the ledges are separate groups: projectiles are stopped by ledges and gates but
    // pass over the floor, so a tall wave fired along the seabed isn't destroyed by the sand.
    const floor = this.physics.add.staticGroup();
    const solids = this.physics.add.staticGroup();
    for (let x = 0; x < width; x += 64) floor.create(x + 32, height - 32, theme.ground);
    for (const p of this.level.platforms) {
      const plat = solids.create(p.x, p.y, 'platform') as Phaser.Physics.Arcade.Sprite;
      plat.setDisplaySize(p.w, 24).refreshBody();
      if (this.water) plat.setTint(0xffb3a0); // coral ledge
    }

    // Spawn in the gap between the left and right touch buttons, not underneath one.
    const cp = this.level.checkpoint;
    const startX = this.checkpointReached && cp ? cp.x : 360;
    this.player = this.physics.add.sprite(startX, this.water ? height / 2 : height - 140, this.form.texture);
    this.player.setCollideWorldBounds(true);
    if (this.water) (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    else this.player.setDragX(900);
    this.applyFormToPlayer();
    this.physics.add.collider(this.player, solids);
    this.physics.add.collider(this.player, floor);

    // Dark backdrop (the deep water): a slightly larger, pale, see-through copy behind the player.
    this.halo = undefined;
    if (theme.glow) {
      this.halo = this.add.sprite(0, 0, this.form.texture).setDepth(this.player.depth - 1);
      this.halo.setTint(0xcfefff).setTintMode(Phaser.TintModes.FILL);
    }

    // Group defaults override per-sprite settings, so world-bounds collision and gravity are set here.
    this.enemies = this.physics.add.group({ collideWorldBounds: true, allowGravity: !this.water });
    for (const e of this.level.enemies) {
      if (this.checkpointReached && cp && e.x < cp.x) continue; // already passed: resuming from the flag
      const y = this.water ? (e.y ?? height / 2) : height - 120;
      this.enemies.add(new Enemy(this, e.x, y, ENEMIES[e.type], e.patrol, this.water));
    }
    const bossY = this.water ? height / 2 : height - 140;
    this.boss = new Enemy(this, this.level.boss.x, bossY, ENEMIES[this.level.boss.type], 150, this.water);
    this.enemies.add(this.boss);
    this.boss.once('gone', () => this.completeLevel());
    // Resuming from the flag: a moment of grace, since something may be swimming right beside it.
    if (this.checkpointReached) this.invulnUntil = this.time.now + 2000;
    this.physics.add.collider(this.enemies, solids);
    this.physics.add.collider(this.enemies, floor);
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.onContact(e as unknown as Enemy));

    // Projectiles (venom, water).
    this.shots = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.shots, this.enemies, (s, e) =>
      this.onShotHit(s as Phaser.Physics.Arcade.Sprite, e as unknown as Enemy),
    );
    this.physics.add.collider(this.shots, solids, (s) => (s as Phaser.GameObjects.GameObject).destroy());

    // Trampolines: walk onto one for a big assisted jump.
    // Dynamic-but-immovable bodies, not static ones: bosses probe for static obstacles ahead of them,
    // and a spring pad on the floor must never read as a wall.
    const pads = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const t of this.level.trampolines ?? []) {
      const pad = pads.create(t.x, LevelScene.FLOOR_TOP - 14, 'trampoline') as Phaser.Physics.Arcade.Sprite;
      pad.setDepth(5).setData('power', t.power ?? TRAMPOLINE_POWER);
      (pad.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true);
    }
    this.physics.add.overlap(this.player, pads, (_p, pad) => this.onPad(pad as Phaser.Physics.Arcade.Sprite));

    // Collectibles (bugs 1 point, grubs 3). Ones already collected in an earlier run don't come back.
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const c of this.level.collectibles ?? []) {
      if (Save.isCollected(this.level.id, c.id)) continue;
      const item = this.pickups.create(c.x, c.y, c.type) as Phaser.Physics.Arcade.Sprite;
      item.setDepth(8).setData('id', c.id).setData('value', c.type === 'grub' ? 3 : 1);
      (item.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.tweens.add({
        targets: item,
        y: c.y - 8,
        duration: 700 + (c.x % 5) * 60,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    this.physics.add.overlap(this.player, this.pickups, (_p, it) =>
      this.collect(it as Phaser.Physics.Arcade.Sprite),
    );

    // Boss ground-pound shockwaves: run along the floor, jump over them.
    this.waves = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.waves, (_p, w) => this.onWaveHit(w as Phaser.GameObjects.GameObject));
    this.boss.on('pound', (x: number, floorY: number) => this.onBossPound(x, floorY));

    // The checkpoint flag: a banner planted on the floor.
    if (cp) {
      this.flag = this.add
        .text(cp.x, height - 64, '🚩', { fontSize: '88px' })
        .setOrigin(0.5, 1)
        .setDepth(7)
        .setAlpha(this.checkpointReached ? 1 : 0.7);
    }

    // Dev-time guard: warn if a level reintroduces a platform the boss can't walk under.
    if (import.meta.env.DEV && !this.water) {
      const bad = findHidingSpots(this.level, this.boss.displayHeight);
      if (bad.length) console.warn(`[${this.level.id}] boss arena hiding spots:`, bad);
    }

    if (this.water) this.addBubbles(theme);

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.controls = new Controls(this, { water: this.water });
    this.controls.setActionIcon(this.actionIcon());
    this.buildHud();

    const w = this.scale.width;
    const home = this.add
      .circle(w - 48, 48, 36, 0x000000, 0.4)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive();
    this.add.text(w - 48, 48, '⌂', { fontSize: '44px' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    home.on('pointerdown', () => this.scene.start('LevelSelect'));
    addMuteButton(this, w - 132, 48);

    // Come back from the character picker (the level is paused underneath it).
    const onResume = () => this.applyCharacter();
    this.events.on(Phaser.Scenes.Events.RESUME, onResume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.RESUME, onResume));
  }

  /** The boss, while it's being fought (awake and alive). */
  private activeBoss(): Enemy | undefined {
    const b = this.boss;
    return b && b.active && !b.defeated && b.awake ? b : undefined;
  }

  /** Drifting bubbles for atmosphere (scenery only). */
  private addBubbles(theme: { sky: string }) {
    void theme;
    const { width, height } = this.level;
    for (let i = 0; i < Math.floor(width / 140); i++) {
      const x = (i * 140 + ((i * 53) % 90)) % width;
      const y = (i * 97) % height;
      const b = this.add.image(x, y, 'bubble').setAlpha(0.45).setDepth(2).setScale(0.6 + ((i * 7) % 5) * 0.2);
      this.tweens.add({
        targets: b,
        y: y - 140 - ((i * 11) % 80),
        duration: 4500 + ((i * 331) % 3500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  /** The power the action button fires: the animal's water power in water levels. */
  private currentAbility(): Ability {
    const ch = this.form.character!;
    return this.water ? ch.waterAbility : ch.ability;
  }

  /** The form for the chosen character, with that animal's upgrades applied. */
  private currentForm(formId: string): FormConfig {
    const c = Save.character;
    return getForm(formId, c, c ? Save.upgradesFor(c) : undefined);
  }

  private actionIcon(): string {
    if (this.form.character) return this.currentAbility().icon;
    return this.form.attack?.icon ?? '💥';
  }

  /** Texture, scale and hitbox for the current form (used at start and on a character switch). */
  private applyFormToPlayer() {
    this.player.setTexture(this.form.texture);
    this.player.setScale(this.form.scale);
    const { w, h } = this.form.body;
    const frame = this.player.frame;
    this.player.setSize(w, h).setOffset((frame.width - w) / 2, frame.height - h);
  }

  private buildHud() {
    this.heartIcons.forEach((h) => h.destroy());
    this.heartIcons = [];
    // Upgrades can add up to 10 hearts: past 8 they wrap onto a second row, kept clear of the boss bar.
    const n = this.maxHearts;
    const rows = n > 8 ? 2 : 1;
    const perRow = Math.ceil(n / rows);
    const spacing = Math.min(44, 230 / perRow);
    const scale = rows === 2 ? 0.8 : Math.max(0.85, 1.2 * (spacing / 44));
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow);
      this.heartIcons.push(
        this.add
          .image(36 + (i % perRow) * spacing, 30 + row * 32, 'heart')
          .setScrollFactor(0)
          .setDepth(100)
          .setScale(scale),
      );
    }
    this.refreshHearts();
    // The badge and bug counter sit below the hearts, so drop them when there are two rows.
    const below = rows === 2 ? 20 : 0;

    this.bugText?.destroy();
    this.bugText = this.add
      .text(100, 112 + below, '', { fontSize: '34px', color: '#fff8e1', stroke: '#1d3b2a', strokeThickness: 6 })
      .setScrollFactor(0)
      .setDepth(100)
      .setOrigin(0, 0.5);
    this.refreshBugCounter();

    // Boss bar sits to the left of the mute/home buttons so it never collides with the hearts.
    const barRight = this.scale.width - 190;
    const barCx = barRight - BOSS_BAR_W / 2;
    this.bossBarBg = this.add
      .rectangle(barCx, 34, BOSS_BAR_W + 8, 26, 0x000000, 0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);
    this.bossBar = this.add
      .rectangle(barRight - BOSS_BAR_W, 34, BOSS_BAR_W, 18, 0xe53935)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);
    this.bossIcon = this.add
      .text(barRight - BOSS_BAR_W - 28, 34, '👹', { fontSize: '36px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    // Character badge: tap to switch character at any time (egg has no choice).
    if (this.form.character) {
      const bg = this.add
        .circle(48, 112 + below, 40, 0x000000, 0.4)
        .setStrokeStyle(4, 0xffffff, 0.7)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true });
      this.badge = this.add.image(48, 112 + below, this.form.texture).setScrollFactor(0).setDepth(101);
      this.badge.setScale(Math.min(0.42, 56 / this.badge.width));
      this.add.text(76, 144 + below, '⇄', { fontSize: '26px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
      bg.on('pointerdown', () => this.openPicker());
      this.input.keyboard?.on('keydown-C', () => this.openPicker());
    }
  }

  private openPicker() {
    if (this.finished || this.dying || this.scene.isPaused()) return;
    Sfx.play('ui');
    this.scene.launch('Characters', { overlay: true, canClose: true });
    this.scene.pause();
  }

  /** Called when the picker closes: swap to the chosen character, keeping the same fraction of health. */
  private applyCharacter() {
    this.controls.reset();
    const next = this.currentForm(this.form.id);
    if (!this.form.character || next.character?.id === this.form.character.id) return;

    const frac = this.hearts / this.maxHearts;
    this.form = next;
    this.maxHearts = next.character!.maxHearts;
    // Same fraction of health, so switching can't be used to refill hearts.
    this.hearts = Math.max(1, Math.round(frac * this.maxHearts));
    this.slamming = false;
    this.jumpsLeft = 0;
    this.bonkUntil = 0;

    this.applyFormToPlayer();
    this.badge?.setTexture(next.texture);
    this.badge?.setScale(Math.min(0.42, 56 / this.badge.width));
    this.controls.setActionIcon(this.actionIcon());
    this.buildHud();

    const now = this.time.now;
    this.actionReadyAt = now + 400;
    this.invulnUntil = Math.max(this.invulnUntil, now + 700); // short grace after the swap
    this.puff(this.player.x, this.player.y);
    Sfx.play('switch');
  }

  private puff(x: number, y: number) {
    const p = this.add.text(x, y, '✨', { fontSize: '64px' }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: p, scale: 1.8, alpha: 0, duration: 450, onComplete: () => p.destroy() });
  }

  // ----------------------------------------------------------------- combat

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
        this.clink(enemy.x, enemy.y - enemy.displayHeight / 2, now, stomp, bonking);
        return;
      }
      const dmg = stomp ? (this.form.character?.stompDamage ?? 1) : 1;
      if (enemy.hit(now, dmg)) {
        Sfx.play(stomp ? 'stomp' : 'bite');
        if (stomp) this.player.setVelocityY(STOMP_BOUNCE);
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
    this.actionReadyAt = now + (this.form.attack?.cooldown ?? 500);
    // Grace for other mammals overlapping this same frame, so ending the dash isn't unfair.
    this.invulnUntil = Math.max(this.invulnUntil, now + 300);
  }

  private clink(x: number, y: number, now: number, stomp = false, bonking = false) {
    if (now < this.clinkReadyAt) return;
    this.clinkReadyAt = now + 250;
    Sfx.play('clink');
    if (stomp) this.player.setVelocityY(STOMP_BOUNCE);
    if (bonking) {
      this.bonkUntil = now;
      this.actionReadyAt = now + (this.form.attack?.missCooldown ?? 800);
      this.player.setVelocity(-this.facing * 280, -220);
      this.invulnUntil = Math.max(this.invulnUntil, now + 400);
    }
    const fx = this.add.text(x, y, '🛡️', { fontSize: '44px' }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: fx, y: fx.y - 40, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
  }

  /** Ranged / area damage: bosses only take it while dizzy, otherwise it clinks off. */
  private zapEnemy(enemy: Enemy, now: number, damage = 1): boolean {
    if (enemy.defeated) return false;
    if (enemy.cfg.boss && !enemy.vulnerable) {
      this.clink(enemy.x, enemy.y - enemy.displayHeight / 2, now);
      return false;
    }
    return enemy.hit(now, damage);
  }

  private hurt(fromX: number) {
    if (this.dying) return;
    const now = this.time.now;
    this.hearts -= 1;
    this.hurtCount += 1;
    this.invulnUntil = now + 1500;
    this.slamming = false;
    Sfx.play('hurt');
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
    Sfx.play('lose');
    const fighting = this.activeBoss();
    const bossFight = !!fighting;
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
        this.scene.restart({
          levelId: this.level.id,
          formId: this.form.id,
          hurt: this.hurtCount,
          checkpoint: this.checkpointReached,
        });
        return;
      }
      icon.destroy();
      this.resetBossFight(fighting!);
      this.hearts = this.maxHearts;
      this.refreshHearts();
      // Just outside the arena, so the player walks in and wakes the boss on their own terms.
      (this.player.body as Phaser.Physics.Arcade.Body).reset(
        this.level.boss.wakeX - 60,
        this.water ? this.level.height / 2 : this.level.height - 140,
      );
      this.facing = 1;
      this.invulnUntil = this.time.now + 1500;
      this.bonkUntil = this.actionReadyAt = 0;
      this.slamming = false;
      this.dying = false;
      this.cameras.main.fadeIn(300);
    });
  }

  /** Boss back to full health, asleep at its spawn; its bar hidden until it wakes again. */
  private resetBossFight(b: Enemy) {
    b.resetFight();
    this.refreshBossBar();
  }

  /** Show the bar for whichever boss is being fought, or hide it between fights. */
  private refreshBossBar() {
    const b = this.activeBoss();
    this.bossBarBg.setVisible(!!b);
    this.bossBar.setVisible(!!b);
    this.bossIcon.setVisible(!!b);
    if (b) {
      this.bossIcon.setText(b.cfg.icon ?? '👹');
      this.bossBar.width = BOSS_BAR_W * Math.max(0, b.hp / b.cfg.hp);
    }
  }

  /** Passing the flag: full heal, and a loss from here on restarts from this point. */
  private reachCheckpoint() {
    this.checkpointReached = true;
    Sfx.play('complete');
    this.hearts = this.maxHearts;
    this.refreshHearts();
    const banner = this.add
      .text(this.scale.width / 2, this.scale.height / 2, '🚩', { fontSize: '120px' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(200)
      .setScale(0);
    this.tweens.add({ targets: banner, scale: 1, duration: 300, ease: 'Back.Out' });
    this.tweens.add({ targets: banner, alpha: 0, delay: 1000, duration: 400, onComplete: () => banner.destroy() });
    if (this.flag) {
      this.flag.setAlpha(1);
      this.tweens.add({ targets: this.flag, scale: 1.4, duration: 200, yoyo: true });
    }
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

  // ------------------------------------------------------------ collectibles

  private collect(item: Phaser.Physics.Arcade.Sprite) {
    if (!item.active) return;
    const value = item.getData('value') as number;
    Save.collect(this.level.id, item.getData('id') as string, value);
    Sfx.play(value > 1 ? 'grub' : 'bug');
    const pop = this.add
      .text(item.x, item.y - 20, `+${value}`, { fontSize: '34px', color: '#fff8e1', stroke: '#2a6f3b', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(70);
    this.tweens.add({ targets: pop, y: pop.y - 50, alpha: 0, duration: 650, onComplete: () => pop.destroy() });
    this.tweens.killTweensOf(item);
    item.destroy();
    this.refreshBugCounter(true);
  }

  /** "🐛 12" top-left, with a ⬆ once there's enough for an upgrade. */
  private refreshBugCounter(bump = false) {
    const ready = Save.character && Save.canAffordUpgrade();
    this.bugText.setText(`🐛 ${Save.bank}${ready ? '  ⬆️' : ''}`);
    if (bump) this.tweens.add({ targets: this.bugText, scale: 1.25, duration: 90, yoyo: true });
  }

  // ------------------------------------------------------------ trampolines

  private onPad(pad: Phaser.Physics.Arcade.Sprite) {
    const now = this.time.now;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (now < this.padReadyAt || this.finished || this.dying || body.velocity.y < -50) return;
    this.padReadyAt = now + 350;
    this.player.setVelocityY(-((pad.getData('power') as number) ?? TRAMPOLINE_POWER));
    this.slamming = false;
    // A frog may still double-jump at the top of the bounce.
    this.jumpsLeft = this.form.character?.doubleJump ? 1 : 0;
    Sfx.play('boing');
    this.tweens.add({
      targets: pad,
      scaleY: 0.45,
      duration: 90,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  // ------------------------------------------------------ boss ground pound

  private static readonly FLOOR_TOP = 476;

  /** The boss slams down: a wave runs each way along the floor, and anyone perched on a platform is shaken off. */
  private onBossPound(x: number, floorY: number) {
    if (this.dying || this.finished) return;
    Sfx.play('slam');
    this.cameras.main.shake(260, 0.012);
    for (const dir of [-1, 1]) {
      const wave = this.waves.create(x + dir * 70, floorY - 16, 'shot') as Phaser.Physics.Arcade.Sprite;
      wave.setTint(0xffb74d).setScale(2.2, 1.9).setDepth(40);
      (wave.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      wave.setVelocityX(dir * 360);
      this.time.delayedCall(1700, () => wave.active && wave.destroy());
    }
    // Perched on a platform to avoid the boss? The quake knocks you off, towards the floor.
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (pBody.blocked.down && pBody.bottom < LevelScene.FLOOR_TOP - 30) {
      this.player.setVelocity(Math.sign(this.player.x - x || 1) * 240, -220);
      this.invulnUntil = Math.max(this.invulnUntil, this.time.now + 900);
    }
  }

  private onWaveHit(wave: Phaser.GameObjects.GameObject) {
    if (!wave.active || this.dying || this.finished) return;
    const pBody = this.player.body as Phaser.Physics.Arcade.Body;
    // Jump it: a player whose feet are off the floor passes over.
    if (pBody.bottom < LevelScene.FLOOR_TOP - 28) return;
    if (this.time.now < this.invulnUntil) return;
    this.hurt((wave as Phaser.Physics.Arcade.Sprite).x);
  }

  // -------------------------------------------------------------- abilities

  private useAbility(time: number) {
    const dash = this.form.attack;
    if (dash) {
      // Egg: a short dash that defeats mammals it touches.
      this.bonkUntil = time + dash.duration;
      // Assume a whiff; onBonkLanded() shortens this if it connects.
      this.actionReadyAt = time + dash.duration + dash.missCooldown;
      this.attackFx(dash.icon);
      Sfx.play('bite');
      return;
    }
    const a = this.currentAbility();
    this.actionReadyAt = time + a.cooldown;
    switch (a.kind) {
      case 'venom':
      case 'water':
      case 'spike':
      case 'tornado':
      case 'wave':
        return this.fireShot(a);
      case 'scare':
        return this.scareNearby(a, time);
      case 'thunder':
      case 'zap':
        return this.thunder(a, time);
      case 'slam':
        return this.startSlam(time);
      case 'splash':
        return this.splash(a, time);
      case 'tongue':
        return this.tongue(a, time);
    }
  }

  private attackFx(icon: string) {
    const fx = this.add
      .text(this.player.x + this.facing * 46, this.player.y - 6, icon, { fontSize: '40px' })
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

  /**
   * Land: snake venom / turtle water gun / lizard spike.
   * Water: snake & lizard tornadoes and the turtle's wave (taller and wider, so easier to line up).
   */
  private fireShot(a: Ability) {
    const k = a.kind;
    const spikeLook = k === 'spike' || (k === 'tornado' && a.style === 'spike');
    const venomLook = k === 'venom' || (k === 'tornado' && a.style === 'venom');
    Sfx.play(spikeLook ? 'spike' : venomLook ? 'venom' : 'water');
    const texture = k === 'spike' ? 'spike' : k === 'tornado' ? 'tornado' : k === 'wave' ? 'wave' : 'shot';
    const shot = this.shots.create(
      this.player.x + this.facing * 40,
      this.player.y - (k === 'tornado' || k === 'wave' ? 0 : 4),
      texture,
    ) as Phaser.Physics.Arcade.Sprite;
    shot.setDepth(40);
    if (k === 'spike') {
      shot.setFlipX(this.facing < 0);
    } else if (k === 'tornado') {
      shot.setTint(spikeLook ? 0xffa726 : 0x76ff03).setScale(0.9);
      this.tweens.add({ targets: shot, angle: this.facing * 360, duration: 500, repeat: -1 });
    } else if (k === 'wave') {
      shot.setTint(0x4fc3f7).setFlipX(this.facing < 0);
    } else {
      shot.setTint(venomLook ? 0x76ff03 : 0x4fc3f7).setScale(venomLook ? 1.1 : 0.8);
    }
    shot.setData('kind', k);
    shot.setData('knockback', a.knockback ?? 0);
    shot.setData('knockMs', k === 'wave' ? 900 : 260);
    shot.setData('damage', a.damage ?? 1);
    shot.setData('pierce', a.pierce ?? false);
    (shot.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    shot.setVelocityX(this.facing * (a.speed ?? 500));
    this.time.delayedCall(((a.range ?? 300) / (a.speed ?? 500)) * 1000, () => shot.active && shot.destroy());
  }

  private onShotHit(shot: Phaser.Physics.Arcade.Sprite, enemy: Enemy) {
    if (!shot.active || enemy.defeated) return;
    const now = this.time.now;
    const dir = Math.sign(shot.body!.velocity.x) || 1;
    const kb = (shot.getData('knockback') as number) ?? 0;
    const knockMs = (shot.getData('knockMs') as number) ?? 260;
    const damage = (shot.getData('damage') as number) ?? 1;
    // Piercing shots carry on through small mammals; a boss always stops them.
    const pierces = (shot.getData('pierce') as boolean) && !enemy.cfg.boss;
    if (!pierces) shot.destroy();
    if (this.zapEnemy(enemy, now, damage) || enemy.defeated) return;
    if (kb > 0) enemy.knock(now, knockMs, dir * kb);
  }

  /** Lizard: every nearby mammal freezes with fear. */
  private scareNearby(a: Ability, now: number) {
    Sfx.play('scare');
    const radius = a.radius ?? 300;
    this.ring(this.player.x, this.player.y, radius, 0xb39ddb);
    const face = this.add.text(this.player.x, this.player.y - 70, a.icon, { fontSize: '72px' }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: face, y: face.y - 30, scale: 1.5, alpha: 0, duration: 700, onComplete: () => face.destroy() });
    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      if (Phaser.Math.Distance.Between(en.x, en.y, this.player.x, this.player.y) <= radius) {
        en.scare(now, a.duration ?? 2500);
      }
    });
  }

  /** Axolotl: zap everything around you. */
  private thunder(a: Ability, now: number) {
    const damage = a.damage ?? 1;
    Sfx.play('zap');
    const radius = a.radius ?? 200;
    // In water the current carries the charge: a bigger, bluer ring.
    this.ring(this.player.x, this.player.y, radius, a.kind === 'zap' ? 0x80d8ff : 0xffee58);
    this.cameras.main.flash(120, 255, 255, 200);
    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      if (en.defeated) return;
      if (Phaser.Math.Distance.Between(en.x, en.y, this.player.x, this.player.y) > radius) return;
      const bolt = this.add.text(en.x, en.y - 20, '⚡', { fontSize: '56px' }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: bolt, alpha: 0, scale: 1.6, duration: 380, onComplete: () => bolt.destroy() });
      this.zapEnemy(en, now, damage);
    });
  }

  private ring(x: number, y: number, radius: number, color: number) {
    const r = this.add.circle(x, y, 12, color, 0.25).setStrokeStyle(6, color).setDepth(40);
    this.tweens.add({
      targets: r,
      scale: radius / 12,
      alpha: 0,
      duration: 380,
      onComplete: () => r.destroy(),
    });
  }

  /** Frog: a quick tongue flick straight ahead. */
  private tongue(a: Ability, now: number) {
    Sfx.play('tongue');
    const range = a.range ?? 170;
    const band = a.band ?? 70;
    const y = this.player.y - 8;
    const startX = this.player.x + this.facing * 30;
    const line = this.add
      .rectangle(startX, y, 8, band > 80 ? 18 : 10, 0xff6f91)
      .setOrigin(this.facing > 0 ? 0 : 1, 0.5)
      .setDepth(50);
    this.tweens.add({
      targets: line,
      width: range,
      duration: 90,
      yoyo: true,
      onComplete: () => line.destroy(),
    });
    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      const dx = (en.x - this.player.x) * this.facing;
      if (en.defeated || dx < -10 || dx > range + en.displayWidth / 2) return;
      if (Math.abs(en.y - this.player.y) > band + en.displayHeight / 2) return;
      this.zapEnemy(en, now, a.damage ?? 1);
    });
  }

  /** Toad in water: a mega splash that hits and shoves everything around (but not spiky ones). */
  private splash(a: Ability, now: number) {
    const radius = a.radius ?? 200;
    Sfx.play('slam');
    this.cameras.main.shake(140, 0.007);
    this.ring(this.player.x, this.player.y, radius, 0x4fc3f7);
    const dmg = this.form.character!.stompDamage + (a.damage ? a.damage - 1 : 0);
    const kb = a.knockback ?? 0;
    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      if (en.defeated || en.cfg.spiky) return;
      const dist = Phaser.Math.Distance.Between(en.x, en.y, this.player.x, this.player.y);
      if (dist > radius) return;
      const ang = Math.atan2(en.y - this.player.y, en.x - this.player.x);
      if (!this.zapEnemy(en, now, dmg) && kb > 0) en.knock(now, 500, Math.cos(ang) * kb, Math.sin(ang) * kb);
    });
  }

  /** Toad: leap and dive. Landing sends a shockwave that hits nearby (non-spiky) mammals. */
  private startSlam(now: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.slamming = true;
    this.slamStart = now;
    if (body.blocked.down) this.player.setVelocity(this.facing * 300, -470);
    else this.player.setVelocityY(900);
  }

  private landSlam(now: number) {
    this.slamming = false;
    const a = this.currentAbility();
    const radius = a.radius ?? 120;
    Sfx.play('slam');
    this.cameras.main.shake(140, 0.007);
    this.ring(this.player.x, this.player.y + 20, radius, 0xffab40);
    const dmg = this.form.character!.stompDamage;
    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      if (en.defeated || en.cfg.spiky) return;
      if (Phaser.Math.Distance.Between(en.x, en.y, this.player.x, this.player.y) > radius) return;
      this.zapEnemy(en, now, dmg);
    });
  }

  // ----------------------------------------------------------------- update

  update(time: number) {
    this.controls.update();
    const c = this.controls.state;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const ch = this.form.character;

    if (!this.finished && !this.dying) {
      if (this.water) {
        // Swimming: free movement in all directions with a little glide. The jump stat becomes
        // vertical swim speed, so a bigger jump (or a jump upgrade) swims up and down faster.
        const sp = this.form.speed * 0.95;
        const vsp = this.form.jumpVelocity * 0.5;
        let tx = 0;
        let ty = 0;
        if (c.left) {
          tx = -sp;
          this.facing = -1;
        } else if (c.right) {
          tx = sp;
          this.facing = 1;
        }
        if (c.jump) ty = -vsp;
        else if (c.down) ty = vsp;
        this.player.setVelocity(
          body.velocity.x + (tx - body.velocity.x) * 0.3,
          body.velocity.y + (ty - body.velocity.y) * 0.3,
        );
      } else {
        if (c.left) {
          this.player.setVelocityX(-this.form.speed);
          this.facing = -1;
        } else if (c.right) {
          this.player.setVelocityX(this.form.speed);
          this.facing = 1;
        }

        // Jumping; the frog gets one extra jump while airborne (needs a fresh press).
        if (body.blocked.down) {
          this.jumpsLeft = ch?.doubleJump ? 1 : 0;
          if (c.jump) {
            this.player.setVelocityY(-this.form.jumpVelocity);
            Sfx.play('jump');
          }
        } else if (c.jump && !this.prevJump && this.jumpsLeft > 0) {
          this.jumpsLeft -= 1;
          this.player.setVelocityY(-this.form.jumpVelocity * 0.92);
          Sfx.play('doubleJump');
          this.puff(this.player.x, this.player.y + 10);
        }
      }

      if (c.action && time >= this.actionReadyAt) this.useAbility(time);

      if (time < this.bonkUntil && this.form.attack) {
        this.player.setVelocityX(this.facing * this.form.attack.speed);
        this.player.setTint(0xffe066);
      } else if (this.slamming) {
        this.player.setTint(0xffab40);
        // Past the top of the leap: dive.
        if (body.velocity.y > 0 && body.velocity.y < 900) this.player.setVelocityY(900);
        if (body.blocked.down && time > this.slamStart + 120) this.landSlam(time);
      } else {
        this.player.clearTint();
      }
    }
    this.prevJump = c.jump;

    // Anti-camping: standing on a platform for a few seconds during the fight makes the boss quake.
    const dt = this.lastUpdate ? time - this.lastUpdate : 0;
    this.lastUpdate = time;
    const perched = !this.water && body.blocked.down && body.bottom < LevelScene.FLOOR_TOP - 30;
    const fighting = this.activeBoss();
    this.campMs = fighting && perched ? this.campMs + dt : 0;
    if (this.campMs > 3000 && fighting) {
      this.campMs = 0;
      fighting.requestPound();
    }

    this.player.setFlipX(!this.form.rolls && this.facing < 0);
    // Tilt gently into a climb or a dive.
    if (this.water) this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.04, -18, 18) * this.facing);

    // Blink while invulnerable.
    this.player.setAlpha(time < this.invulnUntil && Math.floor(time / 100) % 2 ? 0.3 : 1);

    if (this.halo) {
      const p = this.player;
      if (this.halo.texture.key !== p.texture.key) this.halo.setTexture(p.texture.key);
      this.halo
        .setPosition(p.x, p.y)
        .setFlipX(p.flipX)
        .setAngle(p.angle)
        .setScale(p.scaleX * 1.1, p.scaleY * 1.18)
        .setAlpha(p.alpha * 0.4);
    }

    if (this.form.rolls) this.player.angle += body.velocity.x * 0.02;

    this.controls.actionReady = time >= this.actionReadyAt;

    const b = this.boss;
    if (b.active && !b.defeated) {
      const arenaStart = this.level.boss.wakeX - 250;
      // Leaving the arena ends the fight: the boss can't be lured out and the fight starts fresh.
      if (b.awake && this.player.x < arenaStart) this.resetBossFight(b);
      // The boss wakes when the player gets close.
      if (!b.awake && this.player.x > this.level.boss.wakeX) {
        b.awake = true;
        this.refreshBossBar();
      }
    }
    const cp = this.level.checkpoint;
    if (cp && !this.checkpointReached && this.player.x > cp.x) this.reachCheckpoint();
    const live = this.activeBoss();
    if (live) this.bossBar.width = BOSS_BAR_W * Math.max(0, live.hp / live.cfg.hp);

    this.enemies.getChildren().forEach((e) => {
      const en = e as unknown as Enemy;
      en.tick(time, this.player.x, this.player.y);
      // Safety net: if anything ever ends up outside the level, put it back rather than lose it.
      if (
        !en.defeated &&
        (en.y > this.level.height + 50 || en.y < -50 || en.x < 0 || en.x > this.level.width)
      ) {
        en.respawn();
      }
    });
  }
}

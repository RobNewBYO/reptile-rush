import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_IDS, type CharacterId } from '../config/characters';
import { MAX_UPGRADE, STAT_ICON, UPGRADE_STATS } from '../config/upgrades';
import { Save } from '../systems/Save';
import { Sfx } from '../systems/Sfx';

/**
 * Spend bugs: first choose the animal, then which of its three powers to strengthen.
 * Icon-only: ❤️ endurance, ⚡ power, ⬆️ jump height, with filled dots showing each level.
 */
export class UpgradeScene extends Phaser.Scene {
  private returnTo = 'LevelSelect';
  private picked: CharacterId | null = null;

  constructor() {
    super('Upgrade');
  }

  init(data: { returnTo?: string }) {
    this.returnTo = data?.returnTo ?? 'LevelSelect';
    this.picked = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(200);
    this.render();
  }

  private render() {
    this.tweens.killAll();
    // Destroy, not just detach: a detached object stays registered with the input system, so its
    // old click handler would keep firing from where it used to be drawn.
    for (const child of [...this.children.list]) child.destroy();
    this.header();
    if (this.picked) this.renderStats(this.picked);
    else this.renderPick();
  }

  private header() {
    const { width } = this.scale;
    const text = { fontSize: '40px', color: '#fff8e1', stroke: '#1d3b2a', strokeThickness: 7 };
    this.add.text(24, 48, `🐛 ${Save.bank}`, text).setOrigin(0, 0.5);
    const cost = Save.nextUpgradeCost;
    const afford = Save.bank >= cost;
    this.add
      .text(width / 2, 48, `⬆️ 🐛 ${cost}`, { ...text, color: afford ? '#fff8e1' : '#ffab91' })
      .setOrigin(0.5)
      .setAlpha(afford ? 1 : 0.8);

    const close = this.add
      .circle(width - 48, 48, 36, 0x000000, 0.45)
      .setStrokeStyle(4, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });
    this.add.text(width - 48, 48, this.picked ? '◀' : '✕', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);
    close.on('pointerdown', () => {
      Sfx.play('ui');
      if (this.picked) {
        this.picked = null;
        this.render();
      } else {
        this.scene.start(this.returnTo);
      }
    });
  }

  /** Step 1: the six animals, each showing how far its powers are upgraded. */
  private renderPick() {
    const { width } = this.scale;
    const cols = 3;
    const gap = 14;
    const cardW = Math.min(230, (width - 40 - gap * (cols - 1)) / cols);
    const cardH = 190;
    const left = width / 2 - ((cols - 1) * (cardW + gap)) / 2;
    const top = 116 + cardH / 2;

    CHARACTER_IDS.forEach((id, i) => {
      const ch = CHARACTERS[id];
      const lv = Save.upgradesFor(id);
      const x = left + (i % cols) * (cardW + gap);
      const y = top + Math.floor(i / cols) * (cardH + 16);
      const current = id === Save.character;

      const card = this.add
        .rectangle(x, y, cardW, cardH, 0xffffff, 0.94)
        .setStrokeStyle(current ? 8 : 4, current ? 0xffb300 : 0x9e9e9e)
        .setInteractive({ useHandCursor: true });
      const pic = this.add.image(x, y - 42, ch.texture);
      pic.setScale(Math.min(0.85, (cardW - 36) / pic.width));

      UPGRADE_STATS.forEach((stat, c) => {
        const cx = x + (c - 1) * 62;
        this.add.text(cx, y + 20, STAT_ICON[stat], { fontSize: '24px' }).setOrigin(0.5);
        this.add
          .text(cx, y + 42, String(lv[stat]), { fontSize: '17px', color: '#33523d', fontStyle: 'bold' })
          .setOrigin(0.5);
        // Little progress bar towards the maximum.
        this.add.rectangle(cx, y + 58, 48, 7, 0xcfd8dc).setStrokeStyle(1, 0x9e9e9e);
        if (lv[stat] > 0) {
          this.add
            .rectangle(cx - 24, y + 58, (48 * lv[stat]) / MAX_UPGRADE, 7, lv[stat] >= MAX_UPGRADE ? 0xffb300 : 0x66bb6a)
            .setOrigin(0, 0.5);
        }
      });
      this.add
        .text(x, y + cardH / 2 - 14, ch.name, { fontSize: '16px', color: '#33523d', fontStyle: 'bold' })
        .setOrigin(0.5);

      card.on('pointerdown', () => {
        Sfx.play('ui');
        this.picked = id;
        this.render();
      });
    });
  }

  /** Step 2: one animal, three big buttons. */
  private renderStats(id: CharacterId) {
    const { width, height } = this.scale;
    const ch = CHARACTERS[id];
    const lv = Save.upgradesFor(id);
    const cost = Save.nextUpgradeCost;
    const afford = Save.bank >= cost;

    const pic = this.add.image(width / 2, 150, ch.texture);
    pic.setScale(Math.min(1.1, 150 / pic.width));
    this.tweens.add({ targets: pic, y: pic.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const spacing = Math.min(210, (width - 60) / 3);
    UPGRADE_STATS.forEach((stat, i) => {
      const x = width / 2 + (i - 1) * spacing;
      const y = height / 2 + 70;
      const level = lv[stat];
      const maxed = level >= MAX_UPGRADE;
      const usable = afford && !maxed;

      const btn = this.add
        .circle(x, y, 74, usable ? 0xffffff : 0xcfd8dc, usable ? 0.96 : 0.6)
        .setStrokeStyle(8, maxed ? 0xffd54f : usable ? 0x66bb6a : 0x78909c)
        .setInteractive({ useHandCursor: true });
      this.add.text(x, y - 4, STAT_ICON[stat], { fontSize: '70px' }).setOrigin(0.5).setAlpha(usable || maxed ? 1 : 0.55);
      this.pips(x, y + 100, level, 7);
      // "4/10" above each button.
      this.add
        .text(x, y - 98, `${level}/${MAX_UPGRADE}`, {
          fontSize: '28px',
          color: maxed ? '#ffd54f' : '#fff8e1',
          stroke: '#1d3b2a',
          strokeThickness: 5,
        })
        .setOrigin(0.5);

      this.add
        .text(x, y + 142, maxed ? '🌟' : `🐛 ${cost}`, {
          fontSize: '28px',
          color: afford || maxed ? '#fff8e1' : '#ffab91',
          stroke: '#1d3b2a',
          strokeThickness: 5,
        })
        .setOrigin(0.5);

      btn.on('pointerdown', () => {
        if (!usable) {
          Sfx.play('clink');
          this.tweens.add({ targets: btn, x: x + 8, duration: 50, yoyo: true, repeat: 3 });
          return;
        }
        if (Save.buyUpgrade(id, stat)) {
          Sfx.play('upgrade');
          this.cameras.main.flash(250, 255, 255, 200);
          this.render();
        }
      });
    });
  }

  /** Dots for upgrade levels bought, in rows of five (10 in total). */
  private pips(cx: number, y: number, level: number, r: number) {
    const gap = r * 2.5;
    const perRow = 5;
    for (let i = 0; i < MAX_UPGRADE; i++) {
      const filled = i < level;
      const row = Math.floor(i / perRow);
      this.add
        .circle(cx + ((i % perRow) - (perRow - 1) / 2) * gap, y + row * (r * 2.5), r, filled ? 0xffb300 : 0xffffff, 1)
        .setStrokeStyle(2, filled ? 0xe65100 : 0x9e9e9e);
    }
  }
}

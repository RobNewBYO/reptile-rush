import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_IDS } from '../config/characters';
import { applyUpgrades } from '../config/upgrades';
import { Save } from '../systems/Save';
import { Sfx } from '../systems/Sfx';

export interface CharacterSceneData {
  /** Draw over a paused level (resume it on exit) instead of as a full screen. */
  overlay: boolean;
  /** Scene to go to when not an overlay. */
  returnTo?: string;
  /** Show a ✕ to leave without choosing. Off for the first-ever pick after hatching. */
  canClose?: boolean;
}

/**
 * Icon-only character picker: portrait, hearts (toughness) and the ability icon.
 * Used after hatching, from the level select, and mid-level over a paused game.
 */
export class CharacterScene extends Phaser.Scene {
  private opts!: Required<CharacterSceneData>;

  constructor() {
    super('Characters');
  }

  init(data: CharacterSceneData) {
    this.opts = { returnTo: 'LevelSelect', canClose: true, ...data };
  }

  create() {
    const { width, height } = this.scale;
    if (this.opts.overlay) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72).setInteractive();
    } else {
      this.cameras.main.setBackgroundColor('#2a6f3b');
    }

    const cols = 3;
    const gap = 14;
    const cardW = Math.min(230, (width - 40 - gap * (cols - 1)) / cols);
    const cardH = 196;
    const left = width / 2 - ((cols - 1) * (cardW + gap)) / 2;
    const top = 112 + cardH / 2;
    const current = Save.character;

    CHARACTER_IDS.forEach((id, i) => {
      const ch = applyUpgrades(CHARACTERS[id], Save.upgradesFor(id));
      const x = left + (i % cols) * (cardW + gap);
      const y = top + Math.floor(i / cols) * (cardH + 16);
      const selected = id === current;

      const card = this.add
        .rectangle(x, y, cardW, cardH, 0xffffff, 0.94)
        .setStrokeStyle(selected ? 10 : 4, selected ? 0xffb300 : 0x9e9e9e)
        .setInteractive({ useHandCursor: true });

      const pic = this.add.image(x, y - 38, ch.texture);
      pic.setScale(Math.min(0.95, (cardW - 36) / pic.width));
      this.tweens.add({ targets: pic, y: pic.y - 6, duration: 600 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

      // Hearts = toughness; ability icon = what the action button does.
      if (ch.maxHearts <= 6) {
        const hs = 21;
        const hx = x - ((ch.maxHearts - 1) * hs) / 2;
        for (let h = 0; h < ch.maxHearts; h++) this.add.image(hx + h * hs, y + 26, 'heart').setScale(0.62);
      } else {
        // Upgraded animals can have lots of hearts: show one heart and the count.
        this.add.image(x - 22, y + 26, 'heart').setScale(0.62);
        this.add.text(x - 6, y + 26, `×${ch.maxHearts}`, { fontSize: '22px', color: '#c62828', fontStyle: 'bold' }).setOrigin(0, 0.5);
      }
      this.add.text(x, y + 62, ch.ability.icon, { fontSize: '40px' }).setOrigin(0.5);
      if (ch.doubleJump) this.add.text(x + cardW / 2 - 26, y - cardH / 2 + 26, '⏫', { fontSize: '30px' }).setOrigin(0.5);
      this.add
        .text(x, y + cardH / 2 - 14, ch.name, { fontSize: '17px', color: '#33523d', fontStyle: 'bold' })
        .setOrigin(0.5);

      card.on('pointerdown', () => this.pick(id));
    });

    this.add.text(width / 2, 52, '🐾', { fontSize: '64px' }).setOrigin(0.5);

    if (this.opts.canClose) {
      const close = this.add
        .circle(width - 48, 48, 36, 0x000000, 0.45)
        .setStrokeStyle(4, 0xffffff, 0.7)
        .setInteractive({ useHandCursor: true });
      this.add.text(width - 48, 48, '✕', { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);
      close.on('pointerdown', () => {
        Sfx.play('ui');
        this.finish();
      });
    }
  }

  private pick(id: keyof typeof CHARACTERS) {
    Sfx.play('switch');
    Save.setCharacter(id);
    this.finish();
  }

  private finish() {
    if (this.opts.overlay) {
      this.scene.stop();
      this.scene.resume('Level');
    } else {
      this.scene.start(this.opts.returnTo);
    }
  }
}

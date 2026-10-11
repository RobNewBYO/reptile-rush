import Phaser from 'phaser';
import { episodeOf } from '../config/episodes';
import { Save } from '../systems/Save';
import { Sfx } from '../systems/Sfx';
import { addMuteButton, roundButton } from './ui';

/** Level-complete screen: stars by how few times you were hurt. No text needed. */
export class ResultsScene extends Phaser.Scene {
  private args!: { levelId: string; formId: string; hurt: number };

  constructor() {
    super('Results');
  }

  init(data: { levelId: string; formId: string; hurt: number }) {
    this.args = data;
  }

  create() {
    const { width } = this.scale;
    const { levelId, formId, hurt } = this.args;
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(300);

    Sfx.play('complete');
    const stars = Math.max(1, 3 - hurt);
    Save.complete(levelId, stars);

    this.add.text(width / 2, 110, '🎉', { fontSize: '110px' }).setOrigin(0.5);
    for (let i = 0; i < 3; i++) {
      const got = i < stars;
      if (got) this.time.delayedCall(500 + i * 250, () => Sfx.play('star'));
      const s = this.add
        .star(width / 2 + (i - 1) * 130, 260, 5, 22, 52, got ? 0xffd54f : 0x555555)
        .setScale(0);
      this.tweens.add({
        targets: s,
        scale: 1,
        angle: got ? 360 : 0,
        duration: 500,
        delay: 300 + i * 250,
        ease: 'Back.Out',
      });
    }

    // Bugs gathered in this level (of those available), and the bank.
    const total = (this.cache.json.get(levelId)?.collectibles ?? []) as { type: string }[];
    const got = Save.levelBugs(levelId);
    this.add
      .text(width / 2, 360, `🐛 ${got.count}/${total.length}     bank 🐛 ${Save.bank}`, {
        fontSize: '38px',
        color: '#fff8e1',
        stroke: '#1d3b2a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    addMuteButton(this, width - 48, 48);
    const ep = episodeOf(levelId);
    const idx = ep.levels.indexOf(levelId);
    const next = () => {
      if (idx < ep.levels.length - 1) {
        this.scene.start('Level', { levelId: ep.levels[idx + 1], formId });
      } else if (!Save.species) {
        this.scene.start('Hatch');
      } else {
        this.scene.start('LevelSelect');
      }
    };

    const y = 450;
    // Upgrades are for the animals, so they open up once the egg has hatched.
    const canUpgrade = Save.character && Save.canAffordUpgrade();
    const gap = canUpgrade ? 130 : 100;
    roundButton(this, width / 2 - gap, y, 52, '↻', () =>
      this.scene.start('Level', { levelId, formId }),
    );
    if (canUpgrade) {
      const up = roundButton(this, width / 2, y, 52, '⬆️', () =>
        this.scene.start('Upgrade', { returnTo: 'LevelSelect' }),
      );
      this.tweens.add({ targets: up, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
    }
    const go = roundButton(this, width / 2 + gap, y, 52, '▶', next);
    this.tweens.add({ targets: go, scale: 1.1, duration: 600, yoyo: true, repeat: -1 });
    this.input.keyboard?.once('keydown-SPACE', next);
  }
}

import Phaser from 'phaser';
import { episodeOf } from '../config/episodes';
import { Save } from '../systems/Save';
import { roundButton } from './ui';

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

    const stars = Math.max(1, 3 - hurt);
    Save.complete(levelId, stars);

    this.add.text(width / 2, 110, '🎉', { fontSize: '110px' }).setOrigin(0.5);
    for (let i = 0; i < 3; i++) {
      const got = i < stars;
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

    const y = 440;
    roundButton(this, width / 2 - 100, y, 52, '↻', () =>
      this.scene.start('Level', { levelId, formId }),
    );
    const go = roundButton(this, width / 2 + 100, y, 52, '▶', next);
    this.tweens.add({ targets: go, scale: 1.1, duration: 600, yoyo: true, repeat: -1 });
    this.input.keyboard?.once('keydown-SPACE', next);
  }
}

import Phaser from 'phaser';
import { Save, type Species } from '../systems/Save';

/** Shown once, after finishing Episode 1: the egg hatches and the kid picks their reptile. */
export class HatchScene extends Phaser.Scene {
  constructor() {
    super('Hatch');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(300);

    const egg = this.add.image(width / 2, height / 2, 'egg').setScale(2.4);
    this.tweens.add({
      targets: egg,
      angle: { from: -14, to: 14 },
      duration: 120,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        this.cameras.main.flash(300, 255, 255, 255);
        egg.destroy();
        this.showChoices();
      },
    });
  }

  private showChoices() {
    const { width, height } = this.scale;
    this.add.text(width / 2, 80, '🐣 ?', { fontSize: '80px' }).setOrigin(0.5);

    // Cards shrink on narrow (4:3) screens so both always fit with a margin.
    const cardW = Math.min(360, width / 2 - 36);
    const gap = cardW / 2 + 12;
    const picScale = (cardW / 360) * 1.9;
    const options: { key: Species; x: number }[] = [
      { key: 'lizard', x: width / 2 - gap },
      { key: 'snake', x: width / 2 + gap },
    ];
    for (const o of options) {
      const card = this.add
        .rectangle(o.x, height / 2 + 40, cardW, 300, 0xffffff, 0.92)
        .setStrokeStyle(8, 0xffd54f)
        .setInteractive({ useHandCursor: true });
      const pic = this.add.image(o.x, height / 2 + 40, o.key).setScale(picScale);
      this.tweens.add({ targets: pic, y: pic.y - 10, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      card.on('pointerdown', () => this.choose(o.key));
    }
  }

  private choose(species: Species) {
    Save.setSpecies(species);
    this.input.enabled = false;
    this.cameras.main.flash(250, 255, 255, 255);
    this.time.delayedCall(450, () => this.scene.start('LevelSelect'));
  }
}

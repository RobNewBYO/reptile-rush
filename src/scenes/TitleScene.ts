import Phaser from 'phaser';
import { roundButton } from './ui';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(300);

    this.add
      .text(width / 2, 130, 'REPTILE RUSH', {
        fontSize: '84px',
        fontStyle: 'bold',
        color: '#fff8e1',
        stroke: '#1d3b2a',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const egg = this.add.image(width / 2, 270, 'egg').setScale(1.6);
    this.tweens.add({ targets: egg, angle: { from: -8, to: 8 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const play = roundButton(this, width / 2, height - 90, 62, '▶', () => this.scene.start('LevelSelect'));
    this.tweens.add({ targets: play, scale: 1.1, duration: 700, yoyo: true, repeat: -1 });
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('LevelSelect'));
  }
}

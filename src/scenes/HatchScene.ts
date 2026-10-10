import Phaser from 'phaser';
import { Sfx } from '../systems/Sfx';

/** Shown once, after finishing Episode 1: the egg hatches, then the kid picks their character. */
export class HatchScene extends Phaser.Scene {
  constructor() {
    super('Hatch');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2a6f3b').fadeIn(300);

    const egg = this.add.image(width / 2, height / 2, 'egg').setScale(2.4);
    this.time.addEvent({ delay: 240, repeat: 8, callback: () => Sfx.play('crack') });
    this.tweens.add({
      targets: egg,
      angle: { from: -14, to: 14 },
      duration: 120,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        this.cameras.main.flash(300, 255, 255, 255);
        Sfx.play('complete');
        egg.destroy();
        this.add.text(width / 2, height / 2, '🐣', { fontSize: '160px' }).setOrigin(0.5);
        this.time.delayedCall(900, () =>
          this.scene.start('Characters', { overlay: false, returnTo: 'LevelSelect', canClose: false }),
        );
      },
    });
  }
}

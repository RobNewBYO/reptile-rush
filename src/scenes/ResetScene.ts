import Phaser from 'phaser';
import { Save } from '../systems/Save';
import { Sfx } from '../systems/Sfx';

const HOLD_MS = 1600;

/**
 * "Start over" confirmation. Wiping progress must be deliberate, so the red button has to be
 * held down until its bar fills; the big green ✕ backs out.
 */
export class ResetScene extends Phaser.Scene {
  constructor() {
    super('Reset');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#4a2323').fadeIn(200);

    this.add.text(width / 2, 100, '⚠️', { fontSize: '96px' }).setOrigin(0.5);
    this.add.text(width / 2, 190, '🗑️ → 🥚', { fontSize: '56px' }).setOrigin(0.5);

    const y = height / 2 + 90;
    const keep = this.add
      .circle(width / 2 - 140, y, 78, 0x66bb6a, 1)
      .setStrokeStyle(8, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 140, y, '✕', { fontSize: '90px', color: '#fff' }).setOrigin(0.5);
    keep.on('pointerdown', () => {
      Sfx.play('ui');
      this.scene.start('LevelSelect');
    });

    const wipe = this.add
      .circle(width / 2 + 140, y, 78, 0xe53935, 1)
      .setStrokeStyle(8, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 140, y, '🗑️', { fontSize: '80px' }).setOrigin(0.5);

    // Hold-to-confirm progress bar under the red button.
    const barW = 170;
    this.add.rectangle(width / 2 + 140, y + 110, barW, 18, 0x000000, 0.5).setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(width / 2 + 140 - barW / 2, y + 110, barW, 12, 0xffd54f).setOrigin(0, 0.5);
    bar.scaleX = 0;
    let tween: Phaser.Tweens.Tween | undefined;

    const cancel = () => {
      tween?.stop();
      tween = undefined;
      bar.scaleX = 0;
    };
    wipe.on('pointerdown', () => {
      Sfx.play('ui');
      tween = this.tweens.add({
        targets: bar,
        scaleX: 1,
        duration: HOLD_MS,
        ease: 'Linear',
        onComplete: () => this.wipeEverything(),
      });
    });
    wipe.on('pointerup', cancel);
    wipe.on('pointerout', cancel);
  }

  private wipeEverything() {
    Save.reset();
    Sfx.play('lose');
    this.cameras.main.fadeOut(400);
    this.time.delayedCall(450, () => this.scene.start('Title'));
  }
}

import Phaser from 'phaser';
import { Save } from '../systems/Save';
import { Sfx } from '../systems/Sfx';

/** Big round icon button used across menu scenes. */
export function roundButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  label: string,
  onTap: () => void,
  fill = 0xffffff,
) {
  const c = scene.add
    .circle(x, y, radius, fill, 0.92)
    .setStrokeStyle(6, 0xffd54f)
    .setInteractive({ useHandCursor: true });
  scene.add.text(x, y, label, { fontSize: `${Math.round(radius * 1.1)}px`, color: '#2a6f3b' }).setOrigin(0.5);
  c.on('pointerdown', () => {
    Sfx.play('ui');
    onTap();
  });
  return c;
}

/** 🔊 / 🔇 toggle, remembered between sessions. Also on the M key. */
export function addMuteButton(scene: Phaser.Scene, x: number, y: number) {
  const bg = scene.add
    .circle(x, y, 36, 0x000000, 0.4)
    .setScrollFactor(0)
    .setDepth(150)
    .setInteractive({ useHandCursor: true });
  const icon = scene.add
    .text(x, y, '', { fontSize: '40px' })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(151);
  const refresh = () => icon.setText(Save.muted ? '🔇' : '🔊');
  const toggle = () => {
    Sfx.muted = !Save.muted;
    refresh();
    Sfx.play('ui'); // audible confirmation when un-muting
  };
  bg.on('pointerdown', toggle);
  scene.input.keyboard?.on('keydown-M', toggle);
  refresh();
  return bg;
}

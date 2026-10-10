import Phaser from 'phaser';

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
  c.on('pointerdown', onTap);
  return c;
}

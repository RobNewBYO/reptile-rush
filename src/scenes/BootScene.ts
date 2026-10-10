import Phaser from 'phaser';
import { ALL_LEVEL_IDS } from '../config/episodes';

/** Generates placeholder textures. Swap for real art by loading atlases under the same keys. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    for (const id of ALL_LEVEL_IDS) this.load.json(id, `levels/${id}.json`);
  }

  create() {
    const g = this.add.graphics();

    // Egg (placeholder): cream oval with spots so rolling is visible.
    g.fillStyle(0xfff3d6).fillEllipse(32, 40, 52, 68);
    g.fillStyle(0x9ad17a).fillCircle(22, 34, 6).fillCircle(40, 50, 7).fillCircle(34, 24, 4);
    g.generateTexture('egg', 64, 80);
    g.clear();

    // Ground tile
    g.fillStyle(0x6b4a2b).fillRect(0, 0, 64, 64);
    g.fillStyle(0x4caf50).fillRect(0, 0, 64, 12);
    g.generateTexture('ground', 64, 64);
    g.clear();

    // Platform tile
    g.fillStyle(0x8d6e63).fillRoundedRect(0, 0, 64, 24, 8);
    g.generateTexture('platform', 64, 24);

    // Mouse (faces left)
    g.fillStyle(0xb0b0b0).fillEllipse(26, 22, 40, 24);
    g.fillStyle(0xb0b0b0).fillCircle(32, 8, 7);
    g.fillStyle(0xf4a6b8).fillCircle(32, 8, 4);
    g.fillStyle(0xf4a6b8).fillCircle(4, 22, 3);
    g.fillStyle(0x000000).fillCircle(11, 17, 2);
    g.lineStyle(3, 0xf4a6b8).lineBetween(44, 24, 58, 18);
    g.generateTexture('mouse', 60, 36);
    g.clear();

    // Badger boss (faces left)
    g.fillStyle(0x424242).fillEllipse(78, 56, 100, 62);
    g.fillStyle(0x424242).fillCircle(34, 48, 28);
    g.fillStyle(0xffffff).fillEllipse(34, 40, 14, 44);
    g.fillStyle(0x424242).fillCircle(24, 22, 8).fillCircle(46, 22, 8);
    g.fillStyle(0x000000).fillCircle(22, 46, 4).fillCircle(8, 56, 5);
    g.fillStyle(0x222222).fillRect(48, 76, 14, 12).fillRect(94, 76, 14, 12);
    g.generateTexture('badger', 134, 90);
    g.clear();

    // Fox boss (faces left)
    g.fillStyle(0xe8742a).fillEllipse(80, 58, 96, 54);
    g.fillStyle(0xe8742a).fillCircle(34, 46, 24);
    g.fillStyle(0xe8742a).fillTriangle(16, 30, 22, 2, 36, 26).fillTriangle(34, 26, 48, 2, 52, 32);
    g.fillStyle(0xffffff).fillTriangle(10, 54, 36, 70, 40, 46);
    g.fillStyle(0xe8742a).fillEllipse(130, 54, 50, 22);
    g.fillStyle(0xffffff).fillCircle(150, 54, 9);
    g.fillStyle(0x000000).fillCircle(24, 42, 4).fillCircle(6, 52, 4);
    g.fillStyle(0x333333).fillRect(52, 78, 12, 12).fillRect(96, 78, 12, 12);
    g.generateTexture('fox', 160, 90);
    g.clear();

    // Lizard (placeholder, faces right)
    g.fillStyle(0x4caf50).fillEllipse(70, 60, 80, 34);
    g.fillStyle(0x4caf50).fillCircle(116, 52, 18);
    g.fillStyle(0x4caf50).fillTriangle(30, 60, 0, 78, 34, 70);
    g.fillStyle(0x388e3c).fillRect(50, 70, 10, 16).fillRect(86, 70, 10, 16);
    g.fillStyle(0xffffff).fillCircle(122, 46, 6);
    g.fillStyle(0x000000).fillCircle(124, 46, 3);
    g.generateTexture('lizard', 140, 92);
    g.clear();

    // Snake (placeholder, faces right)
    g.fillStyle(0xffb300);
    for (let i = 0; i < 9; i++) g.fillCircle(14 + i * 13, 64 - Math.sin(i * 0.9) * 16, 12 - i * 0.2);
    g.fillStyle(0xffb300).fillCircle(130, 40, 16);
    g.fillStyle(0xffffff).fillCircle(134, 36, 6);
    g.fillStyle(0x000000).fillCircle(136, 36, 3);
    g.lineStyle(3, 0xe53935).lineBetween(144, 44, 156, 44);
    g.generateTexture('snake', 160, 92);
    g.clear();

    // Hedgehog (faces left): spiky back
    g.fillStyle(0x6d4c41);
    for (let i = 0; i < 7; i++) g.fillTriangle(14 + i * 6, 10, 20 + i * 6, -2 + 8, 26 + i * 6, 10);
    g.fillStyle(0x8d6e63).fillEllipse(34, 24, 56, 30);
    g.fillStyle(0x4e342e);
    for (let i = 0; i < 8; i++) g.fillTriangle(10 + i * 6, 18, 16 + i * 6, 2, 22 + i * 6, 18);
    g.fillStyle(0xffccbc).fillCircle(8, 26, 8);
    g.fillStyle(0x000000).fillCircle(6, 24, 2).fillCircle(0, 28, 2);
    g.generateTexture('hedgehog', 66, 44);
    g.clear();

    // Wolf boss (faces left)
    g.fillStyle(0x78909c).fillEllipse(84, 58, 104, 56);
    g.fillStyle(0x78909c).fillCircle(34, 46, 26);
    g.fillStyle(0x78909c).fillTriangle(14, 30, 20, 0, 36, 26).fillTriangle(34, 26, 48, 0, 54, 32);
    g.fillStyle(0xcfd8dc).fillTriangle(8, 52, 36, 72, 42, 44);
    g.fillStyle(0x78909c).fillEllipse(138, 56, 54, 20);
    g.fillStyle(0xffd54f).fillCircle(24, 40, 5);
    g.fillStyle(0x000000).fillCircle(24, 40, 2).fillCircle(6, 50, 4);
    g.fillStyle(0x546e7a).fillRect(54, 78, 12, 12).fillRect(102, 78, 12, 12);
    g.generateTexture('wolf', 166, 90);
    g.clear();

    // Bear boss (faces left): big and round
    g.fillStyle(0x5d4037).fillEllipse(96, 80, 140, 96);
    g.fillStyle(0x5d4037).fillCircle(36, 62, 36);
    g.fillStyle(0x5d4037).fillCircle(14, 30, 12).fillCircle(54, 30, 12);
    g.fillStyle(0xbcaaa4).fillEllipse(22, 72, 28, 22);
    g.fillStyle(0x000000).fillCircle(26, 52, 4).fillCircle(8, 70, 5);
    g.fillStyle(0x3e2723).fillRect(52, 108, 22, 14).fillRect(116, 108, 22, 14);
    g.generateTexture('bear', 180, 124);
    g.clear();

    // Turtle (placeholder, faces right)
    g.fillStyle(0x66bb6a).fillTriangle(16, 64, 2, 74, 26, 74);
    g.fillStyle(0x66bb6a).fillRect(32, 70, 16, 16).fillRect(80, 70, 16, 16);
    g.fillStyle(0x2e7d32).fillEllipse(64, 54, 94, 64);
    g.fillStyle(0x1b5e20).fillEllipse(64, 52, 60, 38);
    g.fillStyle(0xa5d6a7).fillCircle(64, 52, 8).fillCircle(44, 54, 6).fillCircle(84, 54, 6);
    g.fillStyle(0x66bb6a).fillCircle(116, 58, 17);
    g.fillStyle(0xffffff).fillCircle(122, 53, 5);
    g.fillStyle(0x000000).fillCircle(124, 53, 2.5);
    g.generateTexture('turtle', 140, 92);
    g.clear();

    // Toad (placeholder, faces right): warty, round, big yellow eyes
    g.fillStyle(0x6d4c41).fillEllipse(40, 80, 34, 16).fillEllipse(88, 82, 28, 14);
    g.fillStyle(0x8d6e63).fillEllipse(66, 58, 90, 62);
    g.fillStyle(0xbcaaa4).fillEllipse(70, 72, 52, 20);
    g.fillStyle(0x8d6e63).fillCircle(104, 52, 20);
    g.fillStyle(0x6d4c41).fillCircle(48, 46, 5).fillCircle(66, 40, 4).fillCircle(80, 50, 5).fillCircle(42, 64, 4);
    g.fillStyle(0xffe082).fillCircle(98, 32, 9).fillCircle(114, 34, 9);
    g.fillStyle(0x000000).fillCircle(100, 32, 4).fillCircle(116, 34, 4);
    g.lineStyle(3, 0x4e342e).lineBetween(96, 62, 124, 60);
    g.generateTexture('toad', 140, 92);
    g.clear();

    // Axolotl (placeholder, faces right): pink, feathery gills, smile
    g.fillStyle(0xf48fb1).fillTriangle(30, 58, 0, 36, 0, 78);
    g.fillStyle(0xf8bbd0).fillEllipse(72, 58, 96, 34);
    g.fillStyle(0xf48fb1).fillRect(54, 70, 10, 16).fillRect(88, 70, 10, 16);
    g.fillStyle(0xf8bbd0).fillCircle(120, 54, 22);
    g.lineStyle(6, 0xe91e63);
    g.lineBetween(110, 40, 96, 18).lineBetween(118, 34, 114, 10).lineBetween(128, 38, 138, 14);
    g.fillStyle(0xe91e63).fillCircle(96, 18, 5).fillCircle(114, 10, 5).fillCircle(138, 14, 5);
    g.fillStyle(0x000000).fillCircle(128, 50, 3.5);
    g.lineStyle(2.5, 0x880e4f).lineBetween(124, 62, 140, 60);
    g.generateTexture('axolotl', 160, 92);
    g.clear();

    // Frog (placeholder, faces right): long back legs, bulging eyes
    g.fillStyle(0x43a047).fillEllipse(40, 72, 48, 26).fillTriangle(16, 86, 50, 86, 34, 70);
    g.fillStyle(0x66bb6a).fillEllipse(64, 56, 82, 52);
    g.fillStyle(0xdcedc8).fillEllipse(72, 68, 46, 16);
    g.fillStyle(0x66bb6a).fillCircle(100, 48, 22).fillRect(84, 70, 10, 16);
    g.fillStyle(0xffffff).fillCircle(98, 26, 10).fillCircle(114, 28, 10);
    g.fillStyle(0x000000).fillCircle(101, 26, 4).fillCircle(117, 28, 4);
    g.lineStyle(3, 0x2e7d32).lineBetween(100, 58, 122, 54);
    g.generateTexture('frog', 140, 92);
    g.clear();

    // Projectile (tinted per ability)
    g.fillStyle(0xffffff).fillCircle(10, 10, 10);
    g.generateTexture('shot', 20, 20);
    g.clear();

    // Heart
    g.fillStyle(0xe53935).fillCircle(10, 10, 8).fillCircle(22, 10, 8);
    g.fillTriangle(2, 13, 30, 13, 16, 29);
    g.generateTexture('heart', 32, 30);
    g.destroy();

    this.scene.start('Title');
  }
}

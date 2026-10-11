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

    // Trampoline pad: red top, springs, base
    g.fillStyle(0x455a64).fillRoundedRect(8, 22, 80, 6, 3);
    g.lineStyle(4, 0xcfd8dc);
    for (let i = 0; i < 5; i++) g.lineBetween(14 + i * 17, 22, 22 + i * 17, 12);
    for (let i = 0; i < 5; i++) g.lineBetween(22 + i * 17, 12, 30 + i * 17, 22);
    g.fillStyle(0xe53935).fillRoundedRect(0, 0, 96, 12, 6);
    g.fillStyle(0xffcdd2).fillRoundedRect(6, 2, 84, 3, 2);
    g.generateTexture('trampoline', 96, 28);
    g.clear();

    // Bug: a little red beetle with spots (collectible, worth 1)
    g.fillStyle(0x000000).fillCircle(20, 7, 5);
    g.lineStyle(2, 0x000000).lineBetween(8, 6, 12, 12).lineBetween(32, 6, 28, 12);
    g.fillStyle(0xe53935).fillEllipse(20, 18, 24, 20);
    g.lineStyle(2, 0x000000).lineBetween(20, 8, 20, 27);
    g.fillStyle(0x000000).fillCircle(14, 15, 2.5).fillCircle(26, 15, 2.5).fillCircle(15, 22, 2).fillCircle(25, 22, 2);
    g.generateTexture('bug', 40, 30);
    g.clear();

    // Grub: a fat cream larva (collectible, worth 3)
    g.fillStyle(0xfff3c4);
    g.fillEllipse(10, 22, 18, 16).fillEllipse(22, 20, 20, 20).fillEllipse(35, 18, 20, 22).fillEllipse(48, 17, 22, 24);
    g.lineStyle(2, 0xd7c27a).lineBetween(16, 14, 16, 30).lineBetween(28, 11, 28, 30).lineBetween(41, 8, 41, 28);
    g.fillStyle(0xffe082).fillCircle(54, 12, 7);
    g.fillStyle(0x000000).fillCircle(56, 10, 2.5);
    g.generateTexture('grub', 64, 40);
    g.clear();

    // Spike (lizard's shot): a pointed thorn facing right
    g.fillStyle(0x8d6e63).fillTriangle(0, 3, 0, 21, 14, 12);
    g.fillStyle(0xffb300).fillTriangle(8, 0, 8, 24, 34, 12);
    g.fillStyle(0xfff3c4).fillTriangle(12, 8, 12, 12, 30, 12);
    g.generateTexture('spike', 36, 24);
    g.clear();

    // Projectile (tinted per ability)
    g.fillStyle(0xffffff).fillCircle(10, 10, 10);
    g.generateTexture('shot', 20, 20);
    g.clear();

    // ---- Australian wildlife (all face left) ----

    // Bilby: long pink ears, pointed snout, black-and-white tail
    g.fillStyle(0x9e9e9e).fillEllipse(34, 30, 42, 24);
    g.fillStyle(0x9e9e9e).fillCircle(14, 22, 10);
    g.fillStyle(0xbdbdbd).fillEllipse(8, 24, 14, 8);
    g.fillStyle(0x9e9e9e).fillEllipse(14, 6, 7, 20).fillEllipse(23, 7, 7, 20);
    g.fillStyle(0xf8bbd0).fillEllipse(14, 6, 3, 15).fillEllipse(23, 7, 3, 15);
    g.fillStyle(0x424242).fillRect(46, 28, 18, 5);
    g.fillStyle(0xffffff).fillRect(58, 26, 8, 8);
    g.fillStyle(0x000000).fillCircle(11, 20, 2).fillCircle(2, 25, 2);
    g.fillStyle(0x757575).fillRect(24, 40, 7, 8).fillRect(42, 40, 7, 8);
    g.generateTexture('bilby', 68, 48);
    g.clear();

    // Echidna (spiky!): tan spines over a dark body, long thin snout
    g.fillStyle(0x4e342e).fillEllipse(40, 30, 54, 28);
    g.lineStyle(3, 0xd7b98a);
    for (let i = 0; i < 11; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      g.lineBetween(40 + Math.cos(a) * 18, 30 + Math.sin(a) * 11, 40 + Math.cos(a) * 32, 30 + Math.sin(a) * 24);
    }
    g.fillStyle(0x6d4c41).fillCircle(12, 32, 8);
    g.lineStyle(4, 0x3e2723).lineBetween(8, 32, -2, 38);
    g.fillStyle(0x000000).fillCircle(10, 29, 2);
    g.fillStyle(0x3e2723).fillRect(26, 40, 7, 6).fillRect(48, 40, 7, 6);
    g.generateTexture('echidna', 74, 48);
    g.clear();

    // Possum: grey, round ears, pink nose, curled bushy tail
    g.fillStyle(0xa1887f).fillEllipse(34, 30, 44, 26);
    g.fillStyle(0xa1887f).fillCircle(14, 24, 11);
    g.fillStyle(0x6d4c41).fillCircle(8, 12, 6).fillCircle(20, 11, 6);
    g.fillStyle(0xf8bbd0).fillCircle(8, 12, 3).fillCircle(20, 11, 3);
    g.fillStyle(0xf48fb1).fillCircle(3, 28, 3);
    g.fillStyle(0x000000).fillCircle(10, 22, 2);
    g.fillStyle(0x8d6e63).fillEllipse(58, 22, 16, 30);
    g.fillStyle(0x5d4037).fillRect(24, 40, 7, 8).fillRect(42, 40, 7, 8);
    g.generateTexture('possum', 70, 48);
    g.clear();

    // Dingo boss: sandy, pointed ears, bushy tail, white socks
    g.fillStyle(0xd9a05b).fillEllipse(100, 56, 100, 44);
    g.fillStyle(0xd9a05b).fillCircle(40, 46, 24);
    g.fillStyle(0xd9a05b).fillTriangle(24, 28, 30, 2, 44, 24).fillTriangle(40, 24, 54, 2, 60, 30);
    g.fillStyle(0xf3d9a8).fillEllipse(24, 56, 30, 18);
    g.fillStyle(0xd9a05b).fillEllipse(150, 38, 22, 52);
    g.fillStyle(0xffffff).fillCircle(150, 18, 8);
    g.fillStyle(0x000000).fillCircle(30, 42, 4).fillCircle(8, 54, 4);
    g.fillStyle(0xd9a05b).fillRect(62, 70, 12, 18).fillRect(120, 70, 12, 18);
    g.fillStyle(0xffffff).fillRect(62, 82, 12, 8).fillRect(120, 82, 12, 8);
    g.generateTexture('dingo', 172, 90);
    g.clear();

    // Kangaroo boss: tall and upright, big tail, long ears, pouch
    g.fillStyle(0xbf6e3b).fillEllipse(108, 112, 70, 22);
    g.fillStyle(0xbf6e3b).fillEllipse(76, 78, 66, 82);
    g.fillStyle(0xe6a874).fillEllipse(66, 82, 34, 52);
    g.fillStyle(0xbf6e3b).fillCircle(44, 32, 20);
    g.fillStyle(0xbf6e3b).fillEllipse(30, 34, 28, 14);
    g.fillStyle(0xbf6e3b).fillEllipse(40, 4, 8, 26).fillEllipse(54, 6, 8, 26);
    g.fillStyle(0xf8bbd0).fillEllipse(40, 6, 3, 18).fillEllipse(54, 8, 3, 18);
    g.fillStyle(0x000000).fillCircle(38, 28, 3).fillCircle(20, 36, 3);
    g.fillStyle(0xbf6e3b).fillRect(34, 56, 24, 10);
    g.fillStyle(0x8a4b25).fillRect(56, 100, 40, 14).fillRect(36, 112, 34, 14);
    g.generateTexture('kangaroo', 150, 130);
    g.clear();

    // Outback ground: red earth with an ochre top
    g.fillStyle(0xa8421f).fillRect(0, 0, 64, 64);
    g.fillStyle(0xe0954a).fillRect(0, 0, 64, 12);
    g.fillStyle(0x8a3318).fillCircle(14, 34, 4).fillCircle(44, 48, 5).fillCircle(52, 28, 3);
    g.generateTexture('ground-outback', 64, 64);
    g.clear();

    // ---- Water levels ----

    // Seabed tile: pale sand with pebbles
    g.fillStyle(0xc9a85a).fillRect(0, 0, 64, 64);
    g.fillStyle(0xeedc9a).fillRect(0, 0, 64, 12);
    g.fillStyle(0xa8873f).fillCircle(12, 34, 4).fillCircle(42, 46, 5).fillCircle(54, 26, 3);
    g.generateTexture('seabed', 64, 64);
    g.clear();

    // Bubble (scenery)
    g.lineStyle(2, 0xffffff, 0.9).strokeCircle(8, 8, 6);
    g.fillStyle(0xffffff, 0.3).fillCircle(8, 8, 6);
    g.generateTexture('bubble', 16, 16);
    g.clear();

    // Tornado (tinted per animal): a stack of shrinking swirls
    g.fillStyle(0xffffff, 0.92);
    for (let i = 0; i < 6; i++) g.fillEllipse(30, 12 + i * 15, 54 - i * 8, 12);
    g.fillStyle(0xffffff, 0.45).fillEllipse(30, 50, 60, 92);
    g.generateTexture('tornado', 60, 100);
    g.clear();

    // Wave (tinted): a tall breaking crest
    g.fillStyle(0xffffff, 0.85).fillEllipse(40, 60, 60, 116);
    g.fillStyle(0xffffff, 0.5).fillEllipse(28, 60, 36, 90);
    g.lineStyle(4, 0xffffff).strokeEllipse(40, 60, 60, 116);
    g.generateTexture('wave', 80, 120);
    g.clear();

    // Piranha (faces left): steel back, orange belly, teeth
    g.fillStyle(0x546e7a).fillEllipse(36, 22, 52, 30);
    g.fillStyle(0xff7043).fillEllipse(36, 30, 42, 12);
    g.fillStyle(0x546e7a).fillTriangle(58, 22, 70, 6, 70, 38).fillTriangle(30, 8, 46, 8, 38, -2);
    g.fillStyle(0xffffff).fillCircle(14, 18, 5).fillTriangle(4, 26, 12, 26, 8, 33).fillTriangle(14, 28, 21, 28, 17, 34);
    g.fillStyle(0x000000).fillCircle(13, 18, 2.5);
    g.generateTexture('piranha', 72, 44);
    g.clear();

    // Jellyfish: translucent dome and trailing tentacles
    g.fillStyle(0xce93d8, 0.9).fillEllipse(30, 24, 52, 40);
    g.fillStyle(0xe1bee7, 0.8).fillEllipse(30, 18, 30, 16);
    g.lineStyle(4, 0xba68c8);
    for (let i = 0; i < 5; i++) {
      const x = 12 + i * 9;
      g.lineBetween(x, 40, x + (i % 2 ? 4 : -4), 56).lineBetween(x + (i % 2 ? 4 : -4), 56, x, 72);
    }
    g.fillStyle(0x000000).fillCircle(22, 26, 2.5).fillCircle(38, 26, 2.5);
    g.generateTexture('jellyfish', 60, 76);
    g.clear();

    // Pufferfish (spiky!): round yellow body ringed with spines
    g.lineStyle(4, 0xe65100);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.lineBetween(32 + Math.cos(a) * 22, 30 + Math.sin(a) * 22, 32 + Math.cos(a) * 31, 30 + Math.sin(a) * 31);
    }
    g.fillStyle(0xfdd835).fillCircle(32, 30, 23);
    g.fillStyle(0xfff59d).fillEllipse(30, 40, 30, 12);
    g.fillStyle(0xfdd835).fillTriangle(54, 30, 66, 18, 66, 42);
    g.fillStyle(0xffffff).fillCircle(20, 24, 6);
    g.fillStyle(0x000000).fillCircle(19, 24, 3);
    g.fillStyle(0xe65100).fillCircle(9, 34, 3);
    g.generateTexture('pufferfish', 68, 62);
    g.clear();

    // Crab (faces left): red shell, raised claws, eye stalks
    g.lineStyle(4, 0xc62828);
    for (let i = 0; i < 3; i++) g.lineBetween(14 + i * 6, 30, 6 + i * 4, 40).lineBetween(42 - i * 6, 30, 50 - i * 4, 40);
    g.fillStyle(0xe53935).fillEllipse(28, 28, 40, 22);
    g.fillStyle(0xe53935).fillCircle(8, 12, 8).fillCircle(48, 12, 8);
    g.lineStyle(4, 0xe53935).lineBetween(14, 24, 8, 14).lineBetween(42, 24, 48, 14);
    g.fillStyle(0xffffff).fillCircle(21, 18, 4).fillCircle(35, 18, 4);
    g.fillStyle(0x000000).fillCircle(21, 18, 2).fillCircle(35, 18, 2);
    g.generateTexture('crab', 58, 44);
    g.clear();

    // Eel: a long green wave with a yellow belly
    for (let i = 0; i < 10; i++) {
      const x = 14 + i * 9.4;
      const y = 20 + Math.sin(i * 0.95) * 8;
      g.fillStyle(0x558b2f).fillEllipse(x, y, 17, 15 - i * 0.5);
      g.fillStyle(0xdce775).fillEllipse(x, y + 4, 12, 5);
    }
    g.fillStyle(0x558b2f).fillEllipse(10, 24, 20, 17);
    g.fillStyle(0xffffff).fillCircle(7, 21, 4);
    g.fillStyle(0x000000).fillCircle(6, 21, 2);
    g.generateTexture('eel', 112, 40);
    g.clear();

    // Shark boss (faces left): grey back, pale belly, big fin
    g.fillStyle(0x607d8b).fillEllipse(100, 62, 160, 56);
    g.fillStyle(0xeceff1).fillEllipse(96, 76, 130, 24);
    g.fillStyle(0x607d8b).fillTriangle(10, 62, 46, 40, 46, 84);
    g.fillTriangle(84, 36, 120, 0, 130, 36);
    g.fillTriangle(168, 62, 196, 18, 196, 100);
    g.fillTriangle(70, 80, 100, 98, 104, 76);
    g.fillStyle(0xffffff).fillTriangle(14, 66, 22, 66, 18, 76).fillTriangle(26, 70, 34, 70, 30, 80).fillTriangle(38, 72, 46, 72, 42, 82);
    g.fillStyle(0xffffff).fillCircle(48, 54, 7);
    g.fillStyle(0x000000).fillCircle(46, 54, 3.5);
    g.lineStyle(3, 0x455a64).lineBetween(66, 56, 66, 70).lineBetween(74, 56, 74, 70).lineBetween(82, 56, 82, 70);
    g.generateTexture('shark', 200, 104);
    g.clear();

    // Octopus boss: purple dome, big eyes, eight curling arms
    g.lineStyle(11, 0x8e24aa);
    for (let i = 0; i < 8; i++) {
      const x = 26 + i * 14;
      g.lineBetween(x, 78, x + Math.sin(i * 1.3) * 14, 106).lineBetween(x + Math.sin(i * 1.3) * 14, 106, x + Math.cos(i * 1.3) * 18, 126);
    }
    g.fillStyle(0x8e24aa).fillEllipse(75, 50, 100, 84);
    g.fillStyle(0xab47bc).fillEllipse(75, 30, 60, 30);
    g.fillStyle(0xffffff).fillCircle(54, 56, 14).fillCircle(96, 56, 14);
    g.fillStyle(0x000000).fillCircle(52, 58, 7).fillCircle(94, 58, 7);
    g.generateTexture('octopus', 150, 132);
    g.clear();

    // Heart
    g.fillStyle(0xe53935).fillCircle(10, 10, 8).fillCircle(22, 10, 8);
    g.fillTriangle(2, 13, 30, 13, 16, 29);
    g.generateTexture('heart', 32, 30);
    g.destroy();

    this.scene.start('Title');
  }
}

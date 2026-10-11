export interface EnemyConfig {
  id: string;
  texture: string;
  hp: number;
  speed: number;
  /** Boss-only: speed while charging. */
  chargeSpeed?: number;
  boss?: boolean;
  /** Can't be stomped; must be bitten/bonked. */
  spiky?: boolean;
  /** Boss only: sprite height in px (used by the arena rules in levelRules.ts). */
  height?: number;
  /** Boss only: how long it stays dizzy (and hittable) after a charge. Shrinks on later bosses. */
  dizzyMs?: number;
  /** Water levels: gentle vertical bobbing around its spawn height. */
  swim?: { amp: number; periodSec: number };
  /** Emoji shown in the HUD for bosses (no reading needed). */
  icon?: string;
}

export const ENEMIES: Record<string, EnemyConfig> = {
  mouse: { id: 'mouse', texture: 'mouse', hp: 1, speed: 60 },
  hedgehog: { id: 'hedgehog', texture: 'hedgehog', hp: 1, speed: 45, spiky: true },
  // Australian wildlife
  bilby: { id: 'bilby', texture: 'bilby', hp: 1, speed: 75 },
  possum: { id: 'possum', texture: 'possum', hp: 1, speed: 55 },
  echidna: { id: 'echidna', texture: 'echidna', hp: 1, speed: 40, spiky: true },
  badger: {
    id: 'badger',
    height: 90,
    texture: 'badger',
    hp: 3,
    speed: 80,
    chargeSpeed: 340,
    boss: true,
    icon: '🦡',
    dizzyMs: 2400,
  },
  fox: {
    id: 'fox',
    height: 90,
    texture: 'fox',
    hp: 4,
    speed: 100,
    chargeSpeed: 420,
    boss: true,
    icon: '🦊',
    dizzyMs: 2000,
  },
  wolf: {
    id: 'wolf',
    height: 90,
    texture: 'wolf',
    hp: 5,
    speed: 110,
    chargeSpeed: 460,
    boss: true,
    icon: '🐺',
    dizzyMs: 1700,
  },
  bear: {
    id: 'bear',
    height: 124,
    texture: 'bear',
    hp: 6,
    speed: 90,
    chargeSpeed: 400,
    boss: true,
    icon: '🐻',
    dizzyMs: 1500,
  },
  dingo: {
    id: 'dingo',
    height: 90,
    texture: 'dingo',
    hp: 6,
    speed: 130,
    chargeSpeed: 500,
    boss: true,
    icon: '🐕',
    dizzyMs: 1400,
  },
  kangaroo: {
    id: 'kangaroo',
    height: 130,
    texture: 'kangaroo',
    hp: 8,
    speed: 100,
    chargeSpeed: 440,
    boss: true,
    icon: '🦘',
    dizzyMs: 1300,
  },
  // Water animals
  piranha: { id: 'piranha', texture: 'piranha', hp: 1, speed: 110, swim: { amp: 26, periodSec: 1.8 } },
  jellyfish: { id: 'jellyfish', texture: 'jellyfish', hp: 1, speed: 28, swim: { amp: 120, periodSec: 4.2 } },
  pufferfish: { id: 'pufferfish', texture: 'pufferfish', hp: 1, speed: 36, spiky: true, swim: { amp: 55, periodSec: 3.4 } },
  crab: { id: 'crab', texture: 'crab', hp: 1, speed: 55 },
  eel: { id: 'eel', texture: 'eel', hp: 1, speed: 90, swim: { amp: 70, periodSec: 2.4 } },
  shark: {
    id: 'shark',
    height: 100,
    texture: 'shark',
    hp: 7,
    speed: 130,
    chargeSpeed: 500,
    boss: true,
    icon: '🦈',
    dizzyMs: 1500,
  },
  octopus: {
    id: 'octopus',
    height: 130,
    texture: 'octopus',
    hp: 9,
    speed: 110,
    chargeSpeed: 460,
    boss: true,
    icon: '🐙',
    dizzyMs: 1300,
  },
};

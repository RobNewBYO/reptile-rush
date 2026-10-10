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
  /** Boss only: how long it stays dizzy (and hittable) after a charge. Shrinks on later bosses. */
  dizzyMs?: number;
  /** Emoji shown in the HUD for bosses (no reading needed). */
  icon?: string;
}

export const ENEMIES: Record<string, EnemyConfig> = {
  mouse: { id: 'mouse', texture: 'mouse', hp: 1, speed: 60 },
  hedgehog: { id: 'hedgehog', texture: 'hedgehog', hp: 1, speed: 45, spiky: true },
  badger: {
    id: 'badger',
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
    texture: 'bear',
    hp: 6,
    speed: 90,
    chargeSpeed: 400,
    boss: true,
    icon: '🐻',
    dizzyMs: 1500,
  },
};

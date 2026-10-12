export type CharacterId = 'lizard' | 'snake' | 'turtle' | 'toad' | 'axolotl' | 'frog';
export type AbilityKind =
  // on land
  | 'venom' | 'scare' | 'water' | 'spike' | 'slam' | 'thunder' | 'tongue'
  // in water levels (see CharacterConfig.waterAbility)
  | 'tornado' | 'wave' | 'splash' | 'zap';

export interface Ability {
  kind: AbilityKind;
  /** Shown on the on-screen action button and attack effect. */
  icon: string;
  /** ms before it can be used again. */
  cooldown: number;
  /** Projectile speed (venom, water, spike). */
  speed?: number;
  /** Projectile / tongue reach in px. */
  range?: number;
  /** Area radius in px (scare, thunder, slam shockwave). */
  radius?: number;
  /** ms an enemy stays afraid (scare). */
  duration?: number;
  /** Push-back speed on a hit (water). */
  knockback?: number;
  /** Hit points removed per hit; defaults to 1. */
  damage?: number;
  /** Projectile keeps flying through small mammals it defeats (bosses always stop it). */
  pierce?: boolean;
  /** Tornado look: venom (green) or spike (orange). */
  style?: 'venom' | 'spike';
  /** Half-height of the band a tongue / wave reaches vertically, in px. */
  band?: number;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  texture: string;
  /**
   * Real artwork, loaded under the `texture` key at boot (see scripts/build-art.sh). Characters
   * without it use the generated placeholder shape. All art faces right.
   */
  art?: {
    file: string;
    /** Display size per texture pixel: the art is a sharp ~3x texture, shown smaller than that. */
    scale: number;
  };
  /** Hitbox in design pixels (at full size, before the life-stage scale), bottom-centred. */
  body: { w: number; h: number };
  maxHearts: number;
  speed: number;
  jumpVelocity: number;
  /** Can jump again once while already in the air. */
  doubleJump: boolean;
  /** Damage dealt by bouncing on a mammal. */
  stompDamage: number;
  ability: Ability;
  /** What the action button does in water levels. Upgrades apply to it exactly as to `ability`. */
  waterAbility: Ability;
  /** For parents/readers; the picker itself is icon-only. */
  strength: string;
  weakness: string;
}

/**
 * Every character keeps the stomp-bounce; `ability` is what the action button does.
 * Strengths are paid for with a weakness so no character is simply best.
 * Ranged / area abilities (venom, water, spike, thunder, tongue) are safe against spiky mammals;
 * only stomping a spiky mammal hurts.
 */
export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  lizard: {
    id: 'lizard',
    name: 'Lizard',
    texture: 'lizard',
    art: { file: 'art/lizard.png', scale: 0.42 },
    body: { w: 150, h: 46 },
    maxHearts: 3,
    speed: 270,
    jumpVelocity: 540,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'spike', icon: '🌵', cooldown: 900, speed: 520, range: 220, damage: 2 },
    strength: 'Spike shot: hits twice as hard as the water gun, and is safe against spiky mammals. Fast.',
    waterAbility: { kind: 'tornado', style: 'spike', icon: '🌀', cooldown: 900, speed: 480, range: 240, damage: 2 },
    weakness: 'Short range and a slower reload, so you have to get close.',
  },
  snake: {
    id: 'snake',
    name: 'Snake',
    texture: 'snake',
    art: { file: 'art/snake.png', scale: 0.4 },
    body: { w: 156, h: 62 },
    maxHearts: 3,
    speed: 235,
    jumpVelocity: 450,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'venom', icon: '🧪', cooldown: 950, speed: 560, range: 520, pierce: true },
    strength: 'Venom shot: long range, safe against spiky mammals, and flies straight through a line of small mammals.',
    waterAbility: { kind: 'tornado', style: 'venom', icon: '🌪️', cooldown: 950, speed: 520, range: 520, pierce: true },
    weakness: 'Low jumps, and still a slowish reload.',
  },
  turtle: {
    id: 'turtle',
    name: 'Turtle',
    texture: 'turtle',
    art: { file: 'art/turtle.png', scale: 0.4 },
    body: { w: 130, h: 66 },
    maxHearts: 5,
    speed: 170,
    jumpVelocity: 470,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'water', icon: '💧', cooldown: 320, speed: 520, range: 300, knockback: 240 },
    strength: 'Five hearts and a rapid water gun that pushes mammals back.',
    waterAbility: { kind: 'wave', icon: '🌊', cooldown: 700, speed: 420, range: 340, knockback: 420, pierce: true, band: 110 },
    weakness: 'Slow, and the water gun is short range.',
  },
  toad: {
    id: 'toad',
    name: 'Toad',
    texture: 'toad',
    body: { w: 90, h: 62 },
    maxHearts: 4,
    speed: 190,
    jumpVelocity: 640,
    doubleJump: false,
    stompDamage: 2,
    ability: { kind: 'slam', icon: '💥', cooldown: 900, radius: 120 },
    strength: 'Body slam: double damage when bouncing on mammals, with a landing shockwave.',
    waterAbility: { kind: 'splash', icon: '💦', cooldown: 1000, radius: 220, knockback: 320 },
    weakness: 'Slow, and has no ranged attack, so spiky mammals must be avoided.',
  },
  axolotl: {
    id: 'axolotl',
    name: 'Axolotl',
    texture: 'axolotl',
    body: { w: 110, h: 50 },
    maxHearts: 2,
    speed: 255,
    jumpVelocity: 520,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'thunder', icon: '⚡', cooldown: 2200, radius: 200 },
    strength: 'Thunder shock hits every mammal around you at once.',
    waterAbility: { kind: 'zap', icon: '🌩️', cooldown: 2000, radius: 280 },
    weakness: 'Only two hearts and a long recharge.',
  },
  frog: {
    id: 'frog',
    name: 'Frog',
    texture: 'frog',
    body: { w: 100, h: 56 },
    maxHearts: 3,
    speed: 260,
    jumpVelocity: 520,
    doubleJump: true,
    stompDamage: 1,
    ability: { kind: 'tongue', icon: '👅', cooldown: 450, range: 170 },
    strength: 'Double jump: jump again in mid-air. Quick tongue flick.',
    waterAbility: { kind: 'tongue', icon: '👅', cooldown: 550, range: 320, band: 110 },
    weakness: 'The tongue has a short reach and only hits one side.',
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[];

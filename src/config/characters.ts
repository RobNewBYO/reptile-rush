export type CharacterId = 'lizard' | 'snake' | 'turtle' | 'toad' | 'axolotl' | 'frog';
export type AbilityKind = 'venom' | 'scare' | 'water' | 'spike' | 'slam' | 'thunder' | 'tongue';

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
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  texture: string;
  /** Hitbox in texture pixels, bottom-centred. */
  body: { w: number; h: number };
  maxHearts: number;
  speed: number;
  jumpVelocity: number;
  /** Can jump again once while already in the air. */
  doubleJump: boolean;
  /** Damage dealt by bouncing on a mammal. */
  stompDamage: number;
  ability: Ability;
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
    body: { w: 110, h: 60 },
    maxHearts: 3,
    speed: 270,
    jumpVelocity: 540,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'spike', icon: '🌵', cooldown: 900, speed: 520, range: 220, damage: 2 },
    strength: 'Spike shot: hits twice as hard as the water gun, and is safe against spiky mammals. Fast.',
    weakness: 'Short range and a slower reload, so you have to get close.',
  },
  snake: {
    id: 'snake',
    name: 'Snake',
    texture: 'snake',
    body: { w: 120, h: 56 },
    maxHearts: 3,
    speed: 235,
    jumpVelocity: 450,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'venom', icon: '🧪', cooldown: 1200, speed: 560, range: 520 },
    strength: 'Venom shot: long-range, safe against spiky mammals.',
    weakness: 'Low jumps and a slow reload.',
  },
  turtle: {
    id: 'turtle',
    name: 'Turtle',
    texture: 'turtle',
    body: { w: 100, h: 56 },
    maxHearts: 5,
    speed: 170,
    jumpVelocity: 470,
    doubleJump: false,
    stompDamage: 1,
    ability: { kind: 'water', icon: '💧', cooldown: 320, speed: 520, range: 300, knockback: 240 },
    strength: 'Five hearts and a rapid water gun that pushes mammals back.',
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
    weakness: 'The tongue has a short reach and only hits one side.',
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[];

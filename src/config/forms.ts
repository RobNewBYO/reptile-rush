import type { Species } from '../systems/Save';

/** A "form" is the reptile's life stage. Each episode uses one. */
export interface FormConfig {
  id: string;
  texture: string;
  /** Sprite scale applied to the texture. */
  scale: number;
  /** Hitbox in texture pixels, bottom-centred. */
  body: { w: number; h: number };
  speed: number;
  jumpVelocity: number;
  /** Egg rolls; other forms walk/slither. */
  rolls: boolean;
  /**
   * The action button: a short dash that defeats what it touches.
   * `cooldown` applies after a landed hit; `missCooldown` after a whiff, so mashing is slower than aiming.
   */
  attack: { speed: number; duration: number; cooldown: number; missCooldown: number; icon: string };
}

const EGG: FormConfig = {
  id: 'egg',
  texture: 'egg',
  scale: 1,
  body: { w: 44, h: 64 },
  speed: 220,
  jumpVelocity: 520,
  rolls: true,
  attack: { speed: 480, duration: 260, cooldown: 500, missCooldown: 900, icon: '💥' },
};

/** Texture sizes for the placeholder reptiles (see BootScene). */
const SPECIES_BODY: Record<Species, { w: number; h: number }> = {
  lizard: { w: 110, h: 60 },
  snake: { w: 120, h: 56 },
};

const HATCHLING: Omit<FormConfig, 'texture' | 'body'> = {
  id: 'hatchling',
  scale: 0.62,
  speed: 250,
  jumpVelocity: 560,
  rolls: false,
  // Quicker, snappier chomp than the egg's bonk.
  attack: { speed: 580, duration: 190, cooldown: 350, missCooldown: 800, icon: '🦷' },
};

/** Resolve an episode's form for the reptile the kid chose. */
export function getForm(formId: string, species: Species | null): FormConfig {
  if (formId === 'hatchling') {
    const s = species ?? 'lizard';
    return { ...HATCHLING, texture: s, body: SPECIES_BODY[s] };
  }
  return EGG;
}

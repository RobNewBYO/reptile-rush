import { CHARACTERS, type CharacterConfig, type CharacterId } from './characters';
import { applyUpgrades, type UpgradeLevels } from './upgrades';

/**
 * A "form" is the life stage an episode uses (egg, hatchling, ...).
 * From the hatchling onward the player's stats and ability come from the chosen character.
 */
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
  /** Egg only: a short dash that defeats what it touches. Characters use `character.ability` instead. */
  attack?: { speed: number; duration: number; cooldown: number; missCooldown: number; icon: string };
  character?: CharacterConfig;
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

/** Sprite scale per life stage (placeholder art is drawn at full size). */
const STAGE_SCALE: Record<string, number> = {
  hatchling: 0.62,
};

/** Resolve an episode's form for the character the kid chose. */
export function getForm(
  formId: string,
  characterId: CharacterId | null,
  upgrades?: UpgradeLevels,
): FormConfig {
  if (formId === 'egg') return EGG;
  const ch = applyUpgrades(CHARACTERS[characterId ?? 'lizard'], upgrades);
  return {
    id: formId,
    texture: ch.texture,
    scale: STAGE_SCALE[formId] ?? STAGE_SCALE.hatchling,
    body: ch.body,
    speed: ch.speed,
    jumpVelocity: ch.jumpVelocity,
    rolls: false,
    character: ch,
  };
}

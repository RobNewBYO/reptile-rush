import type { Ability, CharacterConfig } from './characters';

export type UpgradeStat = 'endurance' | 'power' | 'jump';

export const UPGRADE_STATS: UpgradeStat[] = ['endurance', 'power', 'jump'];
/** Icon per stat (the UI is icon-only). */
export const STAT_ICON: Record<UpgradeStat, string> = { endurance: '❤️', power: '⚡', jump: '⬆️' };
/** Each stat can be raised this many times per animal. */
export const MAX_UPGRADE = 10;

export type UpgradeLevels = Record<UpgradeStat, number>;

export const NO_UPGRADES: UpgradeLevels = { endurance: 0, power: 0, jump: 0 };

/**
 * Bugs needed for the next upgrade, given how many have been bought so far across all animals:
 * 10, 13, 16, 20, 24, 29 ... 60 (the 20th) ... 130 (the 30th). Climbs steadily, so later levels
 * need more bugs per upgrade without the price running away over 180 possible upgrades.
 */
export function upgradeCost(purchased: number): number {
  return Math.round(10 + 3 * purchased + 0.1 * purchased * purchased);
}

/**
 * The character as it plays right now, with the player's upgrades applied. At level 10 of each:
 *  - endurance: +10 hearts (+1 per level)
 *  - jump:      +40% jump speed (about double the height); +4% per level
 *  - power:     ability reloads 45% faster, reaches 50% further, and does +2 damage;
 *               reach and reload improve a little every level, and +1 damage at levels 5 and 10
 */
export function applyUpgrades(base: CharacterConfig, lv: UpgradeLevels = NO_UPGRADES): CharacterConfig {
  const P = lv.power;
  const t = P / MAX_UPGRADE;
  const bonusDamage = Math.floor(P / 5);
  const ability: Ability = { ...base.ability };
  if (P > 0) {
    ability.cooldown = Math.round(ability.cooldown * (1 - 0.45 * t));
    if (ability.range !== undefined) ability.range = Math.round(ability.range * (1 + 0.5 * t));
    if (ability.radius !== undefined) ability.radius = Math.round(ability.radius * (1 + 0.5 * t));
    if (ability.knockback !== undefined) ability.knockback = Math.round(ability.knockback * (1 + 0.6 * t));
    if (bonusDamage > 0) ability.damage = (ability.damage ?? 1) + bonusDamage;
  }
  return {
    ...base,
    maxHearts: base.maxHearts + lv.endurance,
    jumpVelocity: Math.round(base.jumpVelocity * (1 + 0.04 * lv.jump)),
    stompDamage: base.stompDamage + (base.ability.kind === 'slam' ? bonusDamage : 0),
    ability,
  };
}

import type { CharacterId } from '../config/characters';
import { MAX_UPGRADE, NO_UPGRADES, upgradeCost, type UpgradeLevels, type UpgradeStat } from '../config/upgrades';

export type { CharacterId };

interface SaveData {
  /** The character currently chosen (field name kept for saves made before there were six). */
  species: CharacterId | null;
  muted: boolean;
  /** Best stars (1-3) per completed level id. */
  stars: Record<string, number>;
  /** Collectibles picked up, per level: id -> value. Each one pays out once. */
  bugs: Record<string, Record<string, number>>;
  /** Bug points spent on upgrades. */
  spent: number;
  /** Upgrade levels per animal. */
  upgrades: Partial<Record<CharacterId, UpgradeLevels>>;
}

const KEY = 'reptile-rush-save-v1';

function fresh(): SaveData {
  return { species: null, muted: false, stars: {}, bugs: {}, spent: 0, upgrades: {} };
}

/** localStorage can throw (private mode, blocked storage): never let that break the game. */
function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...(JSON.parse(raw) as Partial<SaveData>) };
  } catch {
    /* ignore */
  }
  return fresh();
}

let data = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export const Save = {
  get species() {
    return data.species;
  },
  get character() {
    return data.species;
  },
  setCharacter(c: CharacterId) {
    data.species = c;
    persist();
  },
  get muted() {
    return data.muted;
  },
  setMuted(m: boolean) {
    data.muted = m;
    persist();
  },
  starsFor(levelId: string): number {
    return data.stars[levelId] ?? 0;
  },
  isComplete(levelId: string): boolean {
    return this.starsFor(levelId) > 0;
  },
  /** Keeps the best result. */
  complete(levelId: string, stars: number) {
    data.stars[levelId] = Math.max(this.starsFor(levelId), stars);
    persist();
  },

  // ---- bugs & upgrades ----

  isCollected(levelId: string, id: string): boolean {
    return data.bugs[levelId]?.[id] !== undefined;
  },
  /** Saved straight away, so a level restart never lets the same bug be collected twice. */
  collect(levelId: string, id: string, value: number) {
    if (this.isCollected(levelId, id)) return;
    (data.bugs[levelId] ??= {})[id] = value;
    persist();
  },
  /** Points and count collected in one level. */
  levelBugs(levelId: string): { count: number; points: number } {
    const b = data.bugs[levelId] ?? {};
    const vals = Object.values(b);
    return { count: vals.length, points: vals.reduce((a, v) => a + v, 0) };
  },
  /** Bug points available to spend. */
  get bank(): number {
    let total = 0;
    for (const lvl of Object.values(data.bugs)) for (const v of Object.values(lvl)) total += v;
    return total - data.spent;
  },
  upgradesFor(c: CharacterId): UpgradeLevels {
    return { ...NO_UPGRADES, ...(data.upgrades[c] ?? {}) };
  },
  /** How many upgrades have been bought in total (drives the price of the next). */
  get upgradesBought(): number {
    let n = 0;
    for (const lv of Object.values(data.upgrades)) n += lv.endurance + lv.power + lv.jump;
    return n;
  },
  get nextUpgradeCost(): number {
    return upgradeCost(this.upgradesBought);
  },
  canAffordUpgrade(): boolean {
    return this.bank >= this.nextUpgradeCost;
  },
  /** Returns false if it can't be bought (not enough bugs, or already maxed). */
  buyUpgrade(c: CharacterId, stat: UpgradeStat): boolean {
    const lv = this.upgradesFor(c);
    const cost = this.nextUpgradeCost;
    if (lv[stat] >= MAX_UPGRADE || this.bank < cost) return false;
    data.upgrades[c] = { ...lv, [stat]: lv[stat] + 1 };
    data.spent += cost;
    persist();
    return true;
  },

  /** Wipes all progress (stars, character, bugs, upgrades). The mute preference is kept. */
  reset() {
    const muted = data.muted;
    data = { ...fresh(), muted };
    persist();
  },
};

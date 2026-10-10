export type Species = 'lizard' | 'snake';

interface SaveData {
  species: Species | null;
  /** Best stars (1-3) per completed level id. */
  stars: Record<string, number>;
}

const KEY = 'reptile-rush-save-v1';

function fresh(): SaveData {
  return { species: null, stars: {} };
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
  setSpecies(s: Species) {
    data.species = s;
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
  reset() {
    data = fresh();
    persist();
  },
};

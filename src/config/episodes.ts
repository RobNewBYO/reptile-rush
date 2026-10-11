export interface EpisodeConfig {
  id: number;
  name: string;
  /** Emoji used on the level-select card (no reading needed). */
  icon: string;
  form: string;
  /** Empty = not built yet (shown locked). */
  levels: string[];
}

export const EPISODES: EpisodeConfig[] = [
  { id: 1, name: 'Egg', icon: '🥚', form: 'egg', levels: ['ep1-l1', 'ep1-l2'] },
  { id: 2, name: 'Hatchling', icon: '🐣', form: 'hatchling', levels: ['ep2-l1', 'ep2-l2', 'ep2-l3', 'ep2-l4'] },
];

export const ALL_LEVEL_IDS = EPISODES.flatMap((e) => e.levels);

export function episodeOf(levelId: string): EpisodeConfig {
  return EPISODES.find((e) => e.levels.includes(levelId)) ?? EPISODES[0];
}

/** Level shape. Data lives in /public/levels/<id>.json and is loaded by BootScene. */
export interface LevelConfig {
  id: string;
  width: number;
  height: number;
  /** Look of the level (see themes.ts). Defaults to the meadow. */
  theme?: string;
  platforms: { x: number; y: number; w: number }[];
  /** `y` is only used in water levels, where enemies can be anywhere vertically. */
  enemies: { type: string; x: number; y?: number; patrol?: number }[];
  boss: { type: string; x: number; wakeX: number };
  /** A flag in the middle of a long level: reaching it refills hearts and becomes the restart point. */
  checkpoint?: { x: number };
  /** Water level: swim in all directions, no gravity, water abilities, aquatic enemies. */
  water?: boolean;
  /** Optional pick-ups. A bug is worth 1 point, a grub 3. `id` is stable so saves survive level edits. */
  collectibles?: { id: string; type: 'bug' | 'grub'; x: number; y: number }[];
  /** Spring pads on the floor: step on one for a big assisted jump (reaches the high platforms). */
  trampolines?: { x: number; power?: number }[];
}

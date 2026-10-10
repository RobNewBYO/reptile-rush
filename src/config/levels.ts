/** Level shape. Data lives in /public/levels/<id>.json and is loaded by BootScene. */
export interface LevelConfig {
  id: string;
  width: number;
  height: number;
  platforms: { x: number; y: number; w: number }[];
  enemies: { type: string; x: number; patrol?: number }[];
  boss: { type: string; x: number; wakeX: number };
  /** Spring pads on the floor: step on one for a big assisted jump (reaches the high platforms). */
  trampolines?: { x: number; power?: number }[];
}

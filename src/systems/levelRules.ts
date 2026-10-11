/**
 * Boss-arena rules that keep a boss fight honest.
 *
 * The exploit these prevent: a platform low enough that the (tall) boss can't walk under it, so the
 * player parks beneath it, the boss bumps the edge, and the player gets free hits. Inside the arena
 * every platform must leave the boss room to walk underneath (its height plus a margin).
 *
 * Kept import-free so `scripts/check-levels.ts` can run it straight from Node.
 */
export const FLOOR_TOP = 476; // ground tiles are 64px tall at the bottom of a 540px level
export const PLATFORM_THICKNESS = 24;
/** Extra room beyond the boss's height, so it never scrapes the platform. */
export const CLEARANCE_MARGIN = 40;
/** The arena starts this far before the point where the boss wakes. */
export const ARENA_LEAD = 250;

export interface PlatformLike {
  x: number;
  y: number;
  w: number;
}

export interface LevelLike {
  width?: number;
  water?: boolean;
  platforms: PlatformLike[];
  boss: { wakeX: number };
  checkpoint?: { x: number };
  trampolines?: { x: number }[];
  collectibles?: { id: string; type: string; x: number; y: number }[];
}

/** The lowest normal jump (snake): platforms higher than this need a trampoline. */
export const MIN_JUMP_REACH = 84;
/** A trampoline must be within this horizontal distance of a platform's edge to count as serving it. */
export const TRAMPOLINE_REACH = 140;
/** Half the trampoline sprite's width. */
export const TRAMPOLINE_HALF_WIDTH = 48;
/** Gap a trampoline must keep from any platform's edge so the bounce doesn't clip its underside. */
export const TRAMPOLINE_EDGE_GAP = 30;

/** Free height between the floor and the underside of a platform. */
export function clearanceUnder(p: PlatformLike): number {
  return FLOOR_TOP - (p.y + PLATFORM_THICKNESS / 2);
}

export function arenaStartX(level: LevelLike): number {
  return level.boss.wakeX - ARENA_LEAD;
}

/** Platforms in the boss arena that the boss can't walk under. */
export function findHidingSpots(level: LevelLike, bossHeight: number): PlatformLike[] {
  const start = arenaStartX(level);
  return level.platforms.filter(
    (p) => p.x + p.w / 2 > start && clearanceUnder(p) < bossHeight + CLEARANCE_MARGIN,
  );
}

/** Arena platforms too high for a plain jump with no trampoline beside them. */
export function findUnreachablePlatforms(level: LevelLike): PlatformLike[] {
  const start = arenaStartX(level);
  return level.platforms.filter((p) => {
    if (p.x + p.w / 2 <= start) return false;
    const topAboveFloor = FLOOR_TOP - (p.y - PLATFORM_THICKNESS / 2);
    if (topAboveFloor <= MIN_JUMP_REACH) return false;
    const served = (level.trampolines ?? []).some(
      (t) => Math.abs(t.x - p.x) <= p.w / 2 + TRAMPOLINE_REACH,
    );
    return !served;
  });
}

/** Trampolines sitting under (or too close to the edge of) a platform: the bounce would hit its underside. */
export function findBlockedTrampolines(level: LevelLike): { x: number }[] {
  return (level.trampolines ?? []).filter((t) =>
    level.platforms.some(
      (p) =>
        Math.abs(t.x - p.x) < p.w / 2 + TRAMPOLINE_HALF_WIDTH + TRAMPOLINE_EDGE_GAP,
    ),
  );
}

/** Collectibles buried in a platform or the ground, or sharing an id (which would break saves). */
export function findBadCollectibles(level: LevelLike): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const c of level.collectibles ?? []) {
    if (seen.has(c.id)) problems.push(`${c.id}: duplicate id`);
    seen.add(c.id);
    if (c.y > FLOOR_TOP - 20) problems.push(`${c.id}: inside the ground (y=${c.y})`);
    const inside = level.platforms.find(
      (p) => Math.abs(c.x - p.x) < p.w / 2 + 16 && Math.abs(c.y - p.y) < PLATFORM_THICKNESS / 2 + 18,
    );
    if (inside) problems.push(`${c.id}: inside platform x=${inside.x} (at ${c.x},${c.y})`);
  }
  return problems;
}

/**
 * Water levels: swimmers can't hide under a ledge, but a boss charging in a straight line can be
 * wedged by one, so the boss arena must be open water.
 */
export function findRocksInWaterArenas(level: LevelLike): { x: number }[] {
  const from = level.boss.wakeX - ARENA_LEAD;
  const to = level.width ?? Infinity;
  return level.platforms.filter((p) => p.x + p.w / 2 > from && p.x - p.w / 2 < to).map((p) => ({ x: p.x }));
}

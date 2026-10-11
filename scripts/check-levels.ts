// Run with: npm run check:levels
// Land levels: no boss-arena hiding spots, every high platform reachable by trampoline.
// Water levels: boss arenas are open water. Both: collectibles are in open space and ids are unique.
import { readdirSync, readFileSync } from 'node:fs';
import { ENEMIES } from '../src/config/enemies.ts';
import {
  clearanceUnder,
  findBadCollectibles,
  findBlockedTrampolines,
  findHidingSpots,
  findRocksInWaterArenas,
  findUnreachablePlatforms,
} from '../src/systems/levelRules.ts';

const dir = new URL('../public/levels/', import.meta.url);
let bad = 0;
const fail = (msg: string) => {
  console.error(msg);
  bad++;
};

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const level = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
  const bossCfg = ENEMIES[level.boss.type];
  if (!bossCfg) fail(`${file}: boss "${level.boss.type}" is not defined in enemies.ts`);
  else if (!bossCfg.height) fail(`${file}: boss "${level.boss.type}" has no height in enemies.ts`);
  if (level.checkpoint && !(level.checkpoint.x > 0 && level.checkpoint.x < level.boss.wakeX - 250)) {
    fail(`${file}: checkpoint x=${level.checkpoint.x} must be before the boss arena`);
  }
  for (const e of level.enemies as { type: string }[]) {
    if (!ENEMIES[e.type]) fail(`${file}: enemy "${e.type}" is not defined in enemies.ts`);
  }

  if (level.water) {
    for (const r of findRocksInWaterArenas(level)) {
      fail(`${file}: coral ledge at x=${r.x} sits inside the boss arena (keep boss arenas open water)`);
    }
    for (const e of level.enemies as { type: string; x: number; y?: number }[]) {
      if (e.y === undefined) fail(`${file}: water enemy "${e.type}" at x=${e.x} needs a y`);
    }
  } else {
    const boss = ENEMIES[level.boss.type];
    if (boss?.height) {
      for (const p of findHidingSpots(level, boss.height)) {
        fail(
          `${file}: platform x=${p.x} y=${p.y} leaves ${clearanceUnder(p)}px, ` +
            `but ${level.boss.type} needs ${boss.height + 40}px -> hiding spot in the boss arena`,
        );
      }
    }
    for (const p of findUnreachablePlatforms(level)) {
      fail(`${file}: platform x=${p.x} y=${p.y} is too high to jump onto and has no trampoline beside it`);
    }
    for (const t of findBlockedTrampolines(level)) {
      fail(`${file}: trampoline x=${t.x} is under (or too close to) a platform, so the bounce would hit it`);
    }
  }

  for (const msg of findBadCollectibles(level)) fail(`${file}: collectible ${msg}`);
  const pts = (level.collectibles ?? []).reduce(
    (n: number, c: { type: string }) => n + (c.type === 'grub' ? 3 : 1),
    0,
  );
  console.log(
    `${file}: ${level.water ? 'water' : 'land'}, ${level.width}px, ${level.enemies.length} enemies` +
      `${level.checkpoint ? `, checkpoint at ${level.checkpoint.x}` : ''}, ${(level.collectibles ?? []).length} collectibles = ${pts} points`,
  );
}
if (bad) process.exit(1);
console.log('All levels pass.');

// Run with: npm run check:levels
// Fails if any boss arena has a platform the boss can't walk under (a hiding spot).
import { readdirSync, readFileSync } from 'node:fs';
import { ENEMIES } from '../src/config/enemies.ts';
import {
  clearanceUnder,
  findBadCollectibles,
  findBlockedTrampolines,
  findHidingSpots,
  findUnreachablePlatforms,
} from '../src/systems/levelRules.ts';

const dir = new URL('../public/levels/', import.meta.url);
let bad = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const level = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
  const boss = ENEMIES[level.boss.type];
  if (!boss?.height) {
    console.error(`${file}: boss "${level.boss.type}" has no height in enemies.ts`);
    bad++;
    continue;
  }
  for (const p of findHidingSpots(level, boss.height)) {
    console.error(
      `${file}: platform x=${p.x} y=${p.y} leaves ${clearanceUnder(p)}px, ` +
        `but ${level.boss.type} needs ${boss.height + 40}px -> hiding spot in the boss arena`,
    );
    bad++;
  }
  for (const p of findUnreachablePlatforms(level)) {
    console.error(`${file}: platform x=${p.x} y=${p.y} is too high to jump onto and has no trampoline beside it`);
    bad++;
  }
  for (const msg of findBadCollectibles(level)) {
    console.error(`${file}: collectible ${msg}`);
    bad++;
  }
  const pts = (level.collectibles ?? []).reduce(
    (n: number, c: { type: string }) => n + (c.type === 'grub' ? 3 : 1),
    0,
  );
  console.log(`${file}: ${(level.collectibles ?? []).length} collectibles, ${pts} points`);
  for (const t of findBlockedTrampolines(level)) {
    console.error(`${file}: trampoline x=${t.x} is under (or too close to) a platform, so the bounce would hit it`);
    bad++;
  }
}
if (bad) process.exit(1);
console.log('All boss arenas pass (no hiding spots, every high platform has a clear trampoline, collectibles in open air).');

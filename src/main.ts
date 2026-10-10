import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LevelScene } from './scenes/LevelScene';
import { HatchScene } from './scenes/HatchScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ResultsScene } from './scenes/ResultsScene';
import { TitleScene } from './scenes/TitleScene';
import { GAME_HEIGHT, computeGameWidth, isLandscape } from './systems/viewport';

const bootedLandscape = isLandscape();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: computeGameWidth(),
  height: GAME_HEIGHT,
  backgroundColor: '#1d3b2a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 1200 }, debug: false },
  },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, LevelSelectScene, LevelScene, ResultsScene, HatchScene],
});

// Opened in portrait, then rotated: the canvas was sized for the wrong aspect, so rebuild it once.
// (Small aspect shifts, like Safari's toolbar hiding, are left to FIT: a sliver of border is fine.)
window.addEventListener('resize', () => {
  if (!bootedLandscape && isLandscape()) location.reload();
});

// Dev-only handle for smoke tests / debugging.
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;

// Offline support / installability. Production only so dev hot-reload isn't cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is optional */
    });
  });
}

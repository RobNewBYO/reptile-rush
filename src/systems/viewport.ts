/**
 * The game's logical height is fixed; its width follows the screen's aspect ratio, so the canvas
 * fills the whole display (iPad 4:3 and iPhone ~2.1:1 alike) instead of letterboxing a 16:9 box.
 * Gameplay and UI are laid out from scale.width / scale.height, never hard-coded sizes.
 */
export const GAME_HEIGHT = 540;
export const MIN_WIDTH = 720; // 4:3 (iPad)
export const MAX_WIDTH = 1170; // ~2.17:1 (large iPhones)

export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

export function computeGameWidth(): number {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(GAME_HEIGHT * aspect)));
}

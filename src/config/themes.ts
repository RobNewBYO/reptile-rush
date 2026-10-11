/** Look of a level: sky colour and which ground texture (see BootScene). */
export interface Theme {
  sky: string;
  ground: string;
}

export const THEMES: Record<string, Theme> = {
  meadow: { sky: '#8ed1fc', ground: 'ground' },
  /** Red-earth desert under a hot sky. */
  outback: { sky: '#f8c98a', ground: 'ground-outback' },
  /** Cooler, greener sky over the usual grass. */
  bush: { sky: '#9fe0d0', ground: 'ground' },
};

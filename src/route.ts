/**
 * The route: the sectors the ship flies through, in order, then the Warden.
 * Each sector lists its waves; ticks are counted from the sector's start.
 */

export type EnemyKind = "drone" | "dart" | "turret" | "lancer";

/**
 * line: side by side, all at once. vee: the middle arrives first.
 * column: one lane, one after another. pincer: pairs from both sides.
 */
export type Formation = "line" | "vee" | "column" | "pincer";

export interface Wave {
  at: number;
  kind: EnemyKind;
  count: number;
  formation: Formation;
  /** Centre of a line or vee, or the lane of a column. Pincers ignore it. */
  x?: number;
}

export interface Sector {
  name: string;
  subtitle: string;
  /** Ticks before the next sector starts, as soon as the screen is clear. */
  length: number;
  waves: Wave[];
}

/** Ticks past a sector's length before the next one starts regardless. */
export const graceTicks = 240;

export const sectors: Sector[] = [
  {
    name: "Outer Drift",
    subtitle: "Scouts ahead",
    length: 1560,
    waves: [
      { at: 60, kind: "drone", count: 4, formation: "line" },
      { at: 360, kind: "drone", count: 5, formation: "vee", x: 168 },
      { at: 660, kind: "drone", count: 5, formation: "vee", x: 312 },
      { at: 960, kind: "drone", count: 6, formation: "line" },
      { at: 1200, kind: "drone", count: 4, formation: "column", x: 120 },
      { at: 1260, kind: "drone", count: 4, formation: "column", x: 360 },
    ],
  },
  {
    name: "Shatter Belt",
    subtitle: "Divers incoming",
    length: 1800,
    waves: [
      { at: 60, kind: "drone", count: 6, formation: "vee" },
      { at: 300, kind: "dart", count: 4, formation: "line" },
      { at: 600, kind: "dart", count: 5, formation: "column", x: 144 },
      { at: 720, kind: "dart", count: 5, formation: "column", x: 336 },
      { at: 1020, kind: "drone", count: 7, formation: "line" },
      { at: 1140, kind: "dart", count: 5, formation: "vee" },
      { at: 1440, kind: "dart", count: 6, formation: "line" },
    ],
  },
  {
    name: "Gun Lanes",
    subtitle: "Turrets online",
    length: 1920,
    waves: [
      { at: 60, kind: "turret", count: 1, formation: "line" },
      { at: 240, kind: "drone", count: 6, formation: "vee" },
      { at: 540, kind: "turret", count: 2, formation: "line" },
      { at: 840, kind: "dart", count: 6, formation: "column", x: 240 },
      { at: 1080, kind: "turret", count: 2, formation: "line" },
      { at: 1140, kind: "drone", count: 6, formation: "line" },
      { at: 1500, kind: "turret", count: 3, formation: "line" },
    ],
  },
  {
    name: "Lancer Gate",
    subtitle: "Crossfire",
    length: 1920,
    waves: [
      { at: 60, kind: "lancer", count: 4, formation: "pincer" },
      { at: 360, kind: "dart", count: 6, formation: "vee" },
      { at: 600, kind: "lancer", count: 6, formation: "pincer" },
      { at: 780, kind: "turret", count: 2, formation: "line" },
      { at: 1140, kind: "lancer", count: 6, formation: "pincer" },
      { at: 1260, kind: "drone", count: 8, formation: "vee" },
      { at: 1560, kind: "dart", count: 8, formation: "line" },
    ],
  },
  {
    name: "Last Approach",
    subtitle: "Everything they have",
    length: 2040,
    waves: [
      { at: 60, kind: "turret", count: 3, formation: "line" },
      { at: 180, kind: "lancer", count: 6, formation: "pincer" },
      { at: 540, kind: "dart", count: 6, formation: "column", x: 120 },
      { at: 540, kind: "dart", count: 6, formation: "column", x: 360 },
      { at: 900, kind: "drone", count: 9, formation: "vee" },
      { at: 1020, kind: "turret", count: 2, formation: "line" },
      { at: 1320, kind: "lancer", count: 8, formation: "pincer" },
      { at: 1560, kind: "dart", count: 8, formation: "vee" },
    ],
  },
];

/** The last stop on the route, after every sector is flown. */
export const warden = {
  name: "The Warden",
  title: "WARNING",
  subtitle: "The Warden approaches",
};

/** Where the i-th enemy of a wave enters, and how many ticks after `at`. */
export function place(
  wave: Wave,
  i: number,
): { delay: number; x: number; y: number } {
  const centre = wave.x ?? 240;
  const middle = (wave.count - 1) / 2;
  switch (wave.formation) {
    case "line":
      return { delay: 0, x: centre + (i - middle) * 64, y: -30 };
    case "vee":
      return {
        delay: Math.abs(i - middle) * 10,
        x: centre + (i - middle) * 44,
        y: -30,
      };
    case "column":
      return { delay: i * 24, x: centre, y: -30 };
    case "pincer": {
      const pair = Math.floor(i / 2);
      return {
        delay: pair * 30,
        x: i % 2 === 0 ? -30 : 510,
        y: 70 + pair * 50,
      };
    }
  }
}

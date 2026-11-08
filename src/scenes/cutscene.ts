import Phaser from "phaser";
import { HEIGHT, WIDTH } from "../../actors.ts";
import type { Hud } from "../../hud.ts";
import { play } from "../../sounds.ts";
import { TINTS } from "../../textures.ts";
import { Backdrop } from "../backdrop.ts";
import { fadeIn, fadeTo } from "../fade.ts";

/** Lines of the closing story and when (seconds) each appears. */
const STORY: [number, string][] = [
  [0.8, "The Warden's lights go dark, one ring at a time."],
  [4.2, "Behind you, five sectors of open sky."],
  [7.6, "Ahead, the long way home."],
];
const WARP_AT = 9;
const CREDITS_AT = 11;
const RETURN_AT = 18;

/** What the play scene hands the cutscene when the Warden falls. */
export interface CutsceneData {
  run: { score: number; kills: number; hits: number; continues: number };
  selfPlay: boolean;
}

/** The closing story after the Warden falls; runs on timers, then the title. */
export class CutsceneScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private ending!: CutsceneData;

  constructor(private readonly hud: Hud) {
    super("cutscene");
  }

  init(data: CutsceneData): void {
    this.ending = data;
  }

  create(): void {
    const { run, selfPlay } = this.ending;
    this.backdrop = new Backdrop(this);
    this.input.keyboard?.on("keydown-SPACE", () => this.end());
    this.hud.setMode("cutscene");
    this.hud.setBoss(null);
    fadeIn(this, 600);

    const ship = this.add.image(WIDTH / 2, HEIGHT - 120, "player");
    ship.enableFilters();
    ship.filters?.internal.addGlow(TINTS.player, 5, 0, 1);
    this.add.particles(0, 0, "spark", {
      speedY: { min: 120, max: 260 },
      lifespan: 420,
      scale: { start: 1.2, end: 0 },
      tint: TINTS.player,
      blendMode: "ADD",
      frequency: 16,
    }).startFollow(ship, 0, 18);
    this.tweens.add({
      targets: ship,
      y: HEIGHT - 140,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    for (const [at, line] of STORY) {
      this.time.delayedCall(at * 1000, () => this.hud.say(line));
    }
    this.time.delayedCall(WARP_AT * 1000, () => {
      this.hud.say("");
      play(this, "pickup", 0.7);
      this.tweens.add({
        targets: this.backdrop,
        warp: 18,
        duration: 900,
        ease: "Quad.in",
      });
      this.tweens.killTweensOf(ship);
      this.tweens.add({
        targets: ship,
        y: -80,
        scale: 0.4,
        duration: 1100,
        ease: "Back.in",
      });
      this.time.delayedCall(
        1000,
        () => this.cameras.main.flash(500, 220, 250, 255),
      );
    });
    this.time.delayedCall(CREDITS_AT * 1000, () => {
      this.hud.announce("THANK YOU FOR PLAYING", `Final score ${run.score}`);
      if (selfPlay) {
        this.hud.say(
          `Self-play: ${run.kills} kills, ${run.hits} hits, ${run.continues} continues`,
        );
      }
    });
    this.time.delayedCall(RETURN_AT * 1000, () => this.end());
  }

  override update(_time: number, delta: number): void {
    this.backdrop.scroll(delta);
  }

  private end(): void {
    this.hud.say("");
    fadeTo(this, "title");
  }
}

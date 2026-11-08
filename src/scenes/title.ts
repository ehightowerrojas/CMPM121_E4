import Phaser from "phaser";
import { HEIGHT, WIDTH } from "../../actors.ts";
import type { Hud } from "../../hud.ts";
import type { LaunchOptions } from "../../main.ts";
import { sectors, warden } from "../../route.ts";
import { Backdrop } from "../backdrop.ts";
import { fadeIn, fadeTo } from "../fade.ts";

/** Seconds of idling before the title hands the ship to the autopilot. */
const IDLE_SECONDS = 8;

/** The title screen: SPACE launches play; idling launches the self-play demo. */
export class TitleScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private countdown!: Phaser.GameObjects.Text;
  private idle = 0;

  constructor(
    private readonly hud: Hud,
    private readonly options: LaunchOptions,
  ) {
    super("title");
  }

  init(): void {
    this.idle = 0;
  }

  create(): void {
    this.backdrop = new Backdrop(this);
    this.input.keyboard?.on(
      "keydown-SPACE",
      () => fadeTo(this, "play", { autopilot: false }),
    );

    this.hud.setMode("title");
    this.hud.setRoute([...sectors.map((sector) => sector.name), warden.name]);
    this.hud.setSector(-1);
    this.hud.setBoss(null);
    this.hud.say("");

    const title = this.add.text(WIDTH / 2, HEIGHT * 0.34, "NEON\nWARDEN", {
      fontFamily: "Orbitron, Trebuchet MS, sans-serif",
      fontSize: "64px",
      fontStyle: "bold",
      align: "center",
      color: "#e8fdff",
    }).setOrigin(0.5).setLineSpacing(-6);
    title.enableFilters();
    title.filters?.internal.addGlow(0x5ef2ff, 6, 0, 1);
    this.tweens.add({
      targets: title,
      scale: 1.04,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.add.text(WIDTH / 2, HEIGHT * 0.62, "SPACE  launch", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffe066",
    }).setOrigin(0.5);
    this.countdown = this.add.text(WIDTH / 2, HEIGHT * 0.68, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#8aa4c8",
    }).setOrigin(0.5);

    fadeIn(this, 400);
    if (this.options.attract) fadeTo(this, "play", { autopilot: true });
  }

  override update(_time: number, delta: number): void {
    this.backdrop.scroll(delta);
    this.idle += delta / 1000;
    const left = Math.max(0, Math.ceil(IDLE_SECONDS - this.idle));
    this.countdown.setText(`self-play demo in ${left}`);
    if (left <= 0) fadeTo(this, "play", { autopilot: true });
  }
}

import Phaser from "phaser";
import { loadSounds } from "../sounds.ts";
import { makeTextures } from "../textures.ts";

/** Draws every texture and synthesizes every sound once, then opens the title. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    makeTextures(this);
    loadSounds(this);
    this.scene.start("title");
  }
}

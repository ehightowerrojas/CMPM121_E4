import type Phaser from "phaser";

const fadeMs = 450;

/**
 * Fades the camera to the backdrop colour, then starts another scene.
 * A second request while a fade-out is under way is ignored.
 */
export function fadeTo(scene: Phaser.Scene, key: string, data?: object): void {
  const camera = scene.cameras.main;
  const fade = camera.fadeEffect;
  if (fade.direction && (fade.isRunning || fade.isComplete)) return;
  camera.fadeOut(fadeMs, 4, 2, 12);
  camera.once("camerafadeoutcomplete", () => scene.scene.start(key, data));
}

/** Fades the camera in from the backdrop colour. */
export function fadeIn(scene: Phaser.Scene, ms: number): void {
  scene.cameras.main.fadeIn(ms, 4, 2, 12);
}

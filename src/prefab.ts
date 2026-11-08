import Phaser from "phaser";
import { Actor, type Arena, WIDTH } from "./actors.ts";

function aim(from: { x: number; y: number }, arena: Arena): number {
  return Math.atan2(arena.player.y - from.y, arena.player.x - from.x);
}

/** What every prefab of one kind shares. kind is also the texture key. */
export interface Prefab {
  kind: string;
  hp: number;
  score: number;
  radius: number;
  dropChance: number;
}

export const prefabs = {
  drone: { kind: "drone", hp: 2, score: 100, radius: 13, dropChance: 0.015 },
  dart: { kind: "dart", hp: 1, score: 150, radius: 12, dropChance: 0.015 },
  turret: { kind: "turret", hp: 12, score: 400, radius: 19, dropChance: 0.3 },
  lancer: { kind: "lancer", hp: 4, score: 250, radius: 15, dropChance: 0.06 },
  boss: { kind: "boss", hp: 900, score: 10000, radius: 46, dropChance: 0 },
} satisfies Record<string, Prefab>;

/**
 * Base class for everything the player can shoot or pick up: enemies, the
 * boss and power-ups. side is +1 or -1: which way the prefab swings or flies.
 */
export class ShmupPrefabSprite extends Actor {
  kind: string;
  hp: number;
  maxHp: number;
  score: number;
  dropChance: number;
  homeX: number;
  flash = 0;
  heading = 0;
  // spin: turrets rotate using this
  spin = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    prefab: Prefab,
    public side = 1,
  ) {
    super(scene, x, y, prefab.kind, prefab.radius);
    this.kind = prefab.kind;
    this.hp = prefab.hp;
    this.maxHp = prefab.hp;
    this.score = prefab.score;
    this.dropChance = prefab.dropChance;
    this.homeX = x;
  }

  step(arena: Arena): void {
    this.age++;
    const { x, y } = this;
    this.moveByKind(arena);
    this.vx = this.x - x;
    this.vy = this.y - y;
    this.fireWeapon(arena);
    this.flash = Math.max(0, this.flash - 1);
    if (this.flash > 0) {
      this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    } else this.clearTint();
  }

  moveByKind(arena: Arena): void {
    switch (this.kind) {
      case "drone":
        this.y += 1.5;
        this.x = this.homeX + Math.sin(this.age * 0.045) * 46 * this.side;
        break;
      case "dart":
        if (this.age < 50) {
          this.y += 1.2;
        } else {
          if (this.age === 50) {
            this.heading = Math.sign(arena.player.x - this.x) * 1.4;
          }
          this.y += 5.2;
          this.x += this.heading;
        }
        break;
      case "turret":
        if (this.age < 70) this.y += 1.6;
        else if (this.age > 420) this.y += 1.2;
        this.rotation += 0.02;
        break;
      case "lancer":
        this.x += 2.4 * this.side;
        this.y += 0.35;
        break;
    }
  }

  // Drones, turrets and lancers fire here. Darts never fire: they only dive.
  fireWeapon(arena: Arena): void {
    switch (this.kind) {
      case "drone":
        if (this.age % 100 !== 60 || !arena.rng.chance(0.35)) return;
        arena.fire(this.x, this.y, aim(this, arena), 2.4);
        break;
      case "turret": {
        const t = this.age - 80;
        if (t < 0 || this.age > 420 || t % 100 > 40 || t % 8 !== 0) return;
        arena.fire(this.x, this.y, aim(this, arena), 3.4);
        break;
      }
      case "lancer":
        if (this.age % 40 !== 20 || this.x < 20 || this.x > WIDTH - 20) return;
        for (const spread of [-0.25, 0, 0.25]) {
          arena.fire(this.x, this.y + 8, Math.PI / 2 + spread, 2.6);
        }
        break;
    }
  }

  get fraction(): number {
    return this.hp / this.maxHp;
  }

  phase(): number {
    return 1;
  }

  /** Returns true when this hit destroys the prefab. */
  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.flash = 3;
    return this.hp <= 0;
  }
}

/** The Warden: a three-phase finale whose attacks escalate as it weakens. */
export class ShmupBoss extends ShmupPrefabSprite {
  readonly core: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, WIDTH / 2, -90, prefabs.boss);
    this.core = scene.add.image(this.x, this.y, "boss-core").setBlendMode(
      Phaser.BlendModes.ADD,
    );
  }

  override phase(): number {
    return this.fraction > 2 / 3 ? 1 : this.fraction > 1 / 3 ? 2 : 3;
  }

  /** The Warden ignores damage until it has finished descending. */
  get arrived(): boolean {
    return this.age > 150;
  }

  override takeDamage(amount: number): boolean {
    return this.arrived ? super.takeDamage(amount) : false;
  }

  // the Warden attacks from step() instead
  override fireWeapon(): void {}

  override step(arena: Arena): void {
    super.step(arena);
    if (!this.arrived) {
      this.y += 1.4;
    } else {
      const sway = this.phase() === 3 ? 0.012 : 0.008;
      this.x = WIDTH / 2 + Math.sin((this.age - 150) * sway) * 140;
      this.attack(arena, this.age - 150);
    }
    this.core.setPosition(this.x, this.y + 6);
    this.core.setScale(1 + 0.15 * Math.sin(this.age * (0.08 * this.phase())));
  }

  private attack(arena: Arena, t: number): void {
    if (this.phase() === 1 && t % 55 === 0) this.fan(arena, 9, 1.1, 2.8);
    if (this.phase() === 2) {
      if (t % 80 === 0) this.fan(arena, 9, 1.2, 3);
      if (t % 80 === 40) {
        for (const d of [-0.12, 0, 0.12]) {
          arena.fire(this.x, this.y + 30, aim(this, arena) + d, 4.2, true);
        }
      }
      if (t % 360 === 180) {
        arena.summon("drone", this.x - 70, this.y);
        arena.summon("drone", this.x + 70, this.y);
      }
    }
    if (this.phase() === 3 && t % 6 === 0) {
      this.spin += 0.23;
      for (let arm = 0; arm < 4; arm++) {
        arena.fire(this.x, this.y + 6, this.spin + (arm * Math.PI) / 2, 2.6);
      }
      if (t % 48 === 0) {
        arena.fire(this.x, this.y + 30, aim(this, arena), 4.6, true);
      }
    }
  }

  private fan(arena: Arena, count: number, width: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI / 2 + (i / (count - 1) - 0.5) * width;
      arena.fire(this.x, this.y + 40, angle, speed);
    }
  }

  override destroy(fromScene?: boolean): void {
    this.core.destroy(fromScene);
    super.destroy(fromScene);
  }
}

export class ShmupPowerUp extends ShmupPrefabSprite {
  constructor(scene: Phaser.Scene, x: number, y: number, kind: string) {
    super(scene, x, y, { kind, hp: 0, score: 0, radius: 14, dropChance: 0 });
  }

  override step(): void {
    this.age++;
    this.y += 1.1;
    this.rotation += 0.04;
    this.setScale(1 + 0.12 * Math.sin(this.age * 0.15));
  }

  // power-ups can't shoot
  override fireWeapon(): void {}

  // power-ups can't be hurt
  override takeDamage(): boolean {
    return false;
  }

  // power-ups have no boss phases
  override phase(): number {
    return 0;
  }
}

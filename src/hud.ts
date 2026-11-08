/**
 * The HUD lives in ordinary HTML around the game canvas. index.html provides
 * the markup; the constructor finds it, and scenes call the methods below to
 * update it.
 */
export type HudMode = "title" | "play" | "attract" | "cutscene";

export class Hud {
  private cabinet: HTMLElement;
  private score: HTMLOutputElement;
  private best: HTMLOutputElement;
  private lives: HTMLElement[];
  private power: HTMLElement[];
  private route: HTMLOListElement;
  private stopTemplate: HTMLTemplateElement;
  private boss: HTMLElement;
  private bossFill: HTMLElement;
  private banner: HTMLElement;
  private caption: HTMLElement;
  private stops: HTMLElement[] = [];
  private shownScore = -1;
  private bestScore = 0;

  constructor() {
    this.cabinet = find<HTMLElement>("#cabinet");
    this.score = find<HTMLOutputElement>("#score");
    this.best = find<HTMLOutputElement>("#best");
    this.lives = [...document.querySelectorAll<HTMLElement>("#lives .pip")];
    this.power = [...document.querySelectorAll<HTMLElement>("#power .cell")];
    this.route = find<HTMLOListElement>("#route");
    this.stopTemplate = find<HTMLTemplateElement>("#stop-template");
    this.boss = find<HTMLElement>("#boss");
    this.bossFill = find<HTMLElement>("#boss-fill");
    this.banner = find<HTMLElement>("#banner");
    this.caption = find<HTMLElement>("#caption");
  }

  /** Clones one route stop per sector from the template in index.html. */
  setRoute(names: readonly string[]): void {
    this.route.replaceChildren();
    this.stops = names.map((name) => {
      const stop = this.stopTemplate.content.firstElementChild!
        .cloneNode(true) as HTMLLIElement;
      stop.dataset.state = "ahead";
      stop.querySelector(".stop-name")!.textContent = name;
      this.route.appendChild(stop);
      return stop;
    });
  }

  setMode(mode: HudMode): void {
    this.cabinet.dataset.mode = mode;
  }

  setScore(score: number): void {
    if (score === this.shownScore) return;
    this.shownScore = score;
    this.score.value = pad(score);
    if (score > this.bestScore) {
      this.bestScore = score;
      this.best.value = pad(score);
    }
  }

  setLives(lives: number): void {
    this.lives.forEach((pip, i) => pip.classList.toggle("lit", i < lives));
  }

  setPower(level: number): void {
    this.power.forEach((cell, i) => cell.classList.toggle("lit", i < level));
  }

  /** Marks earlier stops cleared and highlights the current one (-1: none). */
  setSector(current: number): void {
    this.stops.forEach((stop, i) => {
      stop.dataset.state = i < current
        ? "cleared"
        : i === current
        ? "current"
        : "ahead";
    });
  }

  /** Shows the boss meter at a 0–1 fraction, or hides it with null. */
  setBoss(fraction: number | null): void {
    this.boss.hidden = fraction === null;
    if (fraction !== null) {
      this.bossFill.style.setProperty("--fill", String(Math.max(0, fraction)));
    }
  }

  announce(title: string, subtitle = ""): void {
    this.banner.querySelector("strong")!.textContent = title;
    this.banner.querySelector("span")!.textContent = subtitle;
    restartAnimation(this.banner, "show");
  }

  /** Shakes the panels; heavy impacts use the stronger animation. */
  shudder(heavy = false): void {
    restartAnimation(this.cabinet, heavy ? "quake" : "shudder");
  }

  say(text: string): void {
    this.caption.textContent = text;
    this.caption.classList.toggle("visible", text !== "");
  }
}

function find<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`index.html is missing ${selector}`);
  return element;
}

function pad(score: number): string {
  return String(score).padStart(7, "0");
}

/** Removing a class and forcing layout lets the same CSS animation replay. */
function restartAnimation(element: HTMLElement, className: string): void {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

import type { iBuilderConfig, iBuilderRegistry } from "../../interface";
import { Builder } from "../Base";
import "./ModeSwitcher.css";


export type ModeSwitcherElementType =
  | "@container"
  | "@mode-switcher"
  | "@mode-switcher>track"
  | "@mode-switcher>thumb"
  | "@mode-switcher>label";

export interface iModeSwitcherConfig extends iBuilderConfig<ModeSwitcherElementType> {

}

export class ModeSwitcherBuilder extends Builder<ModeSwitcherElementType, iModeSwitcherConfig> {
  readonly builderId: keyof iBuilderRegistry = "mode-switcher";
  readonly name: keyof iBuilderRegistry = "mode-switcher";
  readonly stylesheet: string = "./ModeSwitcher.css";

  private mode: "light" | "dark" = "light";
  public config: Required<iModeSwitcherConfig>;

  constructor(config: Partial<iModeSwitcherConfig> = {}) {
    super();
    // 💡 SINKRONISASI INITIAL STATE: Baca kondisi mode browser live semenjak detik pertama lahir!
    this.mode = this.getMode();

    const defaultSelectors = {
      "@container": { tagName: "div", className: "theme-toggle-wrapper" },
      "@mode-switcher": {
        tagName: "button",
        className: "theme-toggle-btn",
        attrs: { "data-theme-toggle": "", "aria-label": "Toggle theme" }
      },
      "@mode-switcher>track": { tagName: "span", className: "theme-toggle-track" },
      "@mode-switcher>thumb": { tagName: "span", className: "theme-toggle-thumb" },
      "@mode-switcher>label": { tagName: "span", className: "theme-toggle-label" }
    };

    // Deep merge terisolasi agar selectors anak tidak hilang terpotong
    const defaultConfig = {
      themeId: "default",
      selectors: defaultSelectors,
      emit: () => { },
    } as Required<iModeSwitcherConfig>;

    this.config = this.resolveConfig(defaultConfig, config)
  }

  public prepare(data?: any): HTMLElement {

    const container = this.render("@container", data);

    const toggleBtn = this.render("@mode-switcher", data);
    const track = this.render("@mode-switcher>track", data);
    const thumb = this.render("@mode-switcher>thumb", data);
    if (thumb && track) track.appendChild(thumb);

    const label = this.render("@mode-switcher>label", data);

    if (toggleBtn) {
      if (track) toggleBtn.appendChild(track);
      if (label) toggleBtn.appendChild(label);
    }
    if (container && toggleBtn) container.appendChild(toggleBtn);

    return this.load("@container") as HTMLElement;
  }

  protected template(typeKey: ModeSwitcherElementType, el: HTMLElement, _payload?: any): void {
    switch (typeKey) {
      case "@mode-switcher": {
        const btn = el as HTMLButtonElement;
        btn.type = "button";
        btn?.classList.toggle('is-dark', this.mode === "dark");
        // Sinkronisasi kelas CSS awal mengikuti status mode ter-load
        break;
      }

      case "@mode-switcher>label":
        // Sinkronisasi teks label pertama kali mengikuti kebenaran data di dokumen
        el.textContent = this.mode === "dark" ? "Light" : "Dark";
        break;
    }
  }

  public initialize(): void {

    const toggleBtn = this.load("@mode-switcher") as HTMLButtonElement;
    const label = this.load("@mode-switcher>label") as HTMLElement;

    if (toggleBtn && label) {
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.mode = this.mode === "dark" ? "light" : "dark";
        document.documentElement.dataset.mode = this.mode;

        toggleBtn?.classList.toggle('is-dark', this.mode === "dark");
        label.textContent = this.mode === 'dark' ? 'Light' : 'Dark';

        this.config.emit?.("themeChanged", {
          themeId: this.activeLiveThemeId,
          shell: toggleBtn
        });
      });

      console.log("[ModeSwitcher Lifecycle] Secure interactive toggle click bound successfully.");
    }
  }


  // ================
  // internal methods
  // ================
  private normalizeMode(mode?: string | null): 'light' | 'dark' {
    return mode?.toLowerCase() === 'dark' ? 'dark' : 'light';
  }

  public getMode(): 'light' | 'dark' {
    return this.normalizeMode(document.documentElement.dataset.mode);
  }

}

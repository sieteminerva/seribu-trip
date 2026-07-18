import type { iBuilderConfig, iBuilderRegistry } from "../../interface";
import "./ModeSwitcher.css";


export type SwitcherElementType =
  | "toggle"
  | "track"
  | "thumb"
  | "label";

export interface iModeSwitcherConfig extends iBuilderConfig<SwitcherElementType> {

}

export class ModeSwitcherBuilder {
  readonly name: keyof iBuilderRegistry = "mode-switcher";
  readonly stylesheet: string = "";
  private element!: HTMLElement;
  private mode: "light" | "dark" = "light";
  readonly config: Required<iModeSwitcherConfig>;

  constructor(config: Partial<iModeSwitcherConfig> = {}) {
    // 💡 SINKRONISASI INITIAL STATE: Baca kondisi mode browser live semenjak detik pertama lahir!
    this.mode = this.getMode();

    const defaultSelectors = {
      toggle: {
        tagName: "button",
        className: "theme-toggle-btn",
        attrs: { "data-theme-toggle": "", "aria-label": "Toggle theme" }
      },
      track: { tagName: "span", className: "theme-toggle-track" },
      thumb: { tagName: "span", className: "theme-toggle-thumb" },
      label: { tagName: "span", className: "theme-toggle-label" }
    };

    // Deep merge terisolasi agar selectors anak tidak hilang terpotong
    this.config = {
      selectors: config.selectors ? {
        toggle: { ...defaultSelectors.toggle, ...config.selectors.toggle },
        track: { ...defaultSelectors.track, ...config.selectors.track },
        thumb: { ...defaultSelectors.thumb, ...config.selectors.thumb },
        label: { ...defaultSelectors.label, ...config.selectors.label }
      } : defaultSelectors,
      emit: undefined, // Mengalir bebas diwarisi dari core framework Anda
      ...config
    } as Required<iModeSwitcherConfig>;

  }

  public create(data?: any): HTMLElement {
    const selector = this.config.selectors;

    // 1. Bangun Shell Tombol Toggle Utama
    this.element = document.createElement(selector.toggle.tagName!);
    this.element.className = selector.toggle.className as string;

    if (selector.toggle.tagName!.toLowerCase() === "button") {
      (this.element as HTMLButtonElement).type = 'button';
    }

    // Suntikkan atribut bawaan secara berdaulat
    if (selector.toggle.attrs) {
      for (const key in selector.toggle.attrs) {
        if (Object.prototype.hasOwnProperty.call(selector.toggle.attrs, key)) {
          this.element.setAttribute(key, selector.toggle.attrs[key]);
        }
      }
    }

    // 2. Bangun Jalur Lintasan Slide (Track)
    const track = document.createElement(selector.track.tagName!);
    track.className = selector.track.className as string;

    // 3. Bangun Tombol Kenop Geser (Thumb)
    const thumb = document.createElement(selector.thumb.tagName!);
    thumb.className = selector.thumb.className as string;

    track.appendChild(thumb);
    this.element.appendChild(track);

    // 4. Bangun Label Teks Deskriptif (Preset Default)
    const label = document.createElement(selector.label.tagName!);
    label.className = selector.label.className as string;

    // Sinkronisasi teks label pertama kali mengikuti kebenaran data di dokumen
    label.textContent = this.mode === 'dark' ? 'Light' : 'Dark';
    this.element.appendChild(label);

    // Sinkronisasi kelas CSS awal mengikuti status mode ter-load
    this.element.classList.toggle('is-dark', this.mode === 'dark');

    // Ikat event listener klik murni ke atas elemen fisik sekarang juga!
    this.bindListeners(this.element, label, data);

    // 💡 PIPELINE EMITTER GLOBAL: Laporkan kelahiran elemen utama switcher ke pusat orkestrasi!
    this.config.emit?.("elementAdded", {
      builder: this.name, // Atau ganti token registry kustom Anda kelak jika didaftarkan
      type: "toggle",
      element: this.element,
      data: data || {}
    });

    return this.element;
  }

  public normalizeMode(mode?: string | null): 'light' | 'dark' {
    return mode?.toLowerCase() === 'dark' ? 'dark' : 'light';
  }

  public getActiveTheme(): string {
    // 💡 FIX: Kembalikan string secara ksatria menggunakan kata kunci return!
    return (
      localStorage.getItem("active_theme") ||
      document.documentElement.dataset.theme?.replace(/^theme-/, "") ||
      "default"
    );
  }

  public getMode(): 'light' | 'dark' {
    // 💡 FIX: Kembalikan nilai pembacaan dataset mode asli browser secara akurat!
    return this.normalizeMode(document.documentElement.dataset.mode || document.body.dataset.mode);
  }

  public applyMode(label: HTMLElement): void {
    // 💡 FIX MUTLAK 3: BALIK STATUS MEMORI STATE (TOGGLING SIKLUS LOOP)
    // Jika tadinya light rubah ke dark, jika dark rubah ke light!
    this.mode = this.mode === 'light' ? 'dark' : 'light';

    // Siram ke level tertinggi dokumen HTML browser secara legal
    document.documentElement.dataset.mode = this.mode;
    if (document.body) {
      document.body.dataset.mode = this.mode;
    }

    // Mutasi kelas kosmetik visual Semantic UI / Vanilla kustom Anda
    this.element.classList.toggle('is-dark', this.mode === 'dark');
    label.textContent = this.mode === 'dark' ? 'Light' : 'Dark';
  };


  protected bindListeners(el: HTMLElement, label: HTMLElement, _rawData: any): void {
    el.addEventListener("click", (e) => {
      e.preventDefault();

      // Eksekusi mutasi perpindahan warna layar
      this.applyMode(label);

      // 💡 BONUS PEMUTAKHIRAN PIPELINE EVENT:
      // Tembakkan event kustom onPageChanged atau kustom notify ke arah orkestrator atas 
      // agar seluruh sub-komponen lain ikut bersiap melakukan sinkronisasi state!
      this.config.emit?.("themeChanged", {
        themeId: this.getActiveTheme(),
        shell: el
      });
    });
  }
}

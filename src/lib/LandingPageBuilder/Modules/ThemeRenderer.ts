import { ComponentRegistry } from "./ComponentRegistry";
import type { iActionProperty, iBasicNode, iThemeModule } from "../interface";


export class ThemeRenderer {
  public activeTheme: iThemeModule | null = null;
  public themesMap = new Map<string, iThemeModule>();

  private builder: any = null;

  isSwitcherOpen: boolean = false;
  switcherElement: HTMLElement | null = null;
  switcherPosition: string = "bottom-left";

  private isEventBound = false;

  constructor() { }

  public attachBuilder(builderInstance: any) {
    this.builder = builderInstance;
  }

  /**
   * Registers a dynamic design layout theme module
   */
  public register(theme: iThemeModule): this {
    this.themesMap.set(theme.themeId, theme);

    if (this.builder && !this.isEventBound) {
      this.initEventBindings();
      this.isEventBound = true;
    }

    return this;
  }

  /**
   * Core Event Subscription Engine
   */
  private initEventBindings() {
    if (!this.builder) return;
    // 🧙‍♂️ TAHAP 1: Intercept Struktur Objek via Pass-by-Reference Mutation (Pre-Render)
    this.builder.events.on("onReady", (eventData: any) => {
      const currentThemeId = (this.builder as any).currentThemeId;

      if (this.activeTheme && this.activeTheme.themeId !== currentThemeId && this.activeTheme.deactivate) {
        this.activeTheme.deactivate(eventData.shell);
      }

      const targetTheme = this.themesMap.get(currentThemeId);
      if (targetTheme) {
        this.activeTheme = targetTheme;

        // 💡 BENTUK AMAN: Kirim iterator array hasil values Map cloningan ke modul tema

        // Modul tema menerima array element hidup hasil saringan aman
        targetTheme.activate(eventData.shell, Array.from(eventData.components.values()));
      }

    });

    this.builder.events.on("onError", (errData: any) => {
      console.error(`[ThemeEngine] Captured core anomaly: ${errData.message}`, errData.error);
    });
  }

  public renderSwitcher(config = { position: "bottom-left", duration: 10000 }) {

    // 1. Hancurkan switcher lama dari document body jika ada
    if (this.switcherElement && this.switcherElement.parentNode) {
      this.switcherElement.parentNode.removeChild(this.switcherElement);
    }

    const currentActiveThemeId = this.builder?.currentThemeId || localStorage.getItem("active_theme");

    // 2. Susun kontrak data iActionProperty[] secara bersih sesuai standard baru Anda!
    const dynamicActions: iActionProperty[] = [];

    this.themesMap.forEach((themeModule, themeId) => {
      const isActive = themeId === currentActiveThemeId;

      dynamicActions.push({
        label: themeModule.name || themeId,
        isActive: isActive,
        onClick: (e: Event) => {
          // Eksekusi perpindahan tema murni searah yang aman & bebas double call!
          e.preventDefault();
          const el = e.currentTarget as HTMLElement;
          if (isActive) el.classList.add("active")
          this.builder.changeTheme(themeId);
        }
      });
    });

    // 3. RAKIT BLUEPRINT DEKLARATIF MURNI (Format iBasicNode Pilihan Anda!)

    const switcherSchema: iBasicNode = {
      id: "theme-switcher-wrapper", // Dikomentari sesuai format asli request Anda
      builder: "fab-menu",    // Membakar instruksi pemanggilan builder registry!
      isRoot: true,
      content: {
        attrs: {// Menyuapkan data-attributes konfigurasi visual!
          "data-position": config.position,
          "data-close-on-selected": "true",
          "data-duration": config.duration,
          "data-display-icon": "⚙️",
          "data-close-icon": "✕"
        },
        title: "switch theme preview",  // Masuk sebagai properti data.title
        actions: dynamicActions         // Masuk sebagai properti data.actions
      }
    };

    if (this.builder) {
      const component = this.builder.component as ComponentRegistry
      // Cetak fisiknya secara legal lalu tempelkan ke document.body luar browser!
      this.switcherElement = component.build("fab-menu", switcherSchema);
      document.body.appendChild(this.switcherElement as HTMLElement);
    }
  }


}

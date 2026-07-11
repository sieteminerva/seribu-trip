import { BuilderRegistry } from "../BuilderRegistry";
import type { iBasicNode, iThemeModule, themeSwitcherPosition } from "../interface";
import type { LandingPageBuilder } from "../LandingPage";
import { NodeTransformer } from "../Utils/NodeTransformer";
import { DOMRenderer } from "./DOMRenderer";

export class ThemeRenderer {
  private activeTheme: iThemeModule | null = null;
  private themesMap = new Map<string, iThemeModule>();
  private builder: LandingPageBuilder;

  // New configuration properties
  private switcherPosition: themeSwitcherPosition = "bottom-right";
  private showSwitcher: boolean = false;
  private switcherElement: HTMLElement | null = null;

  private isSwitcherOpen = false;
  private idleTimeoutTimer: number | null = null;
  private idleDelayDuration = 10000; // 10 Detik durasi idle (bisa disesuaikan)

  // Local helper renderer engine
  private engine = new DOMRenderer();
  private emptyRegistry = new BuilderRegistry();

  constructor(builderInstance: LandingPageBuilder, switcherConfig: boolean | themeSwitcherPosition = false) {
    this.builder = builderInstance;

    if (typeof switcherConfig === "string") {
      this.showSwitcher = true;
      this.switcherPosition = switcherConfig;
    } else if (switcherConfig === true) {
      this.showSwitcher = true;
      this.switcherPosition = "bottom-right"; // Default fallback position
    }

    this.initEventBindings();
  }

  /**
   * Registers a dynamic design layout theme module
   */
  public registerTheme(theme: iThemeModule): this {
    this.themesMap.set(theme.themeId, theme);
    return this;
  }

  /**
   * Core Event Subscription Engine
   */
  private initEventBindings() {

    // 🧙‍♂️ TAHAP 1: Intercept Struktur Objek via Pass-by-Reference Mutation (Pre-Render)
    this.builder.events.on("beforeRender", (renderPayload) => {
      const currentThemeId = (this.builder as any).currentThemeId;
      const targetTheme = this.themesMap.get(currentThemeId);

      if (targetTheme && typeof targetTheme.beforePageRender === "function") {
        // Jalankan fungsi perombak milik modul tema
        const mutated = targetTheme.beforePageRender(renderPayload.pages, renderPayload.menu, renderPayload.footer);

        // Mutasikan langsung isi properti objek referensinya!
        renderPayload.menu = mutated.menu;
        renderPayload.pages = mutated.pages;
        renderPayload.footer = mutated.footer;
      }
    });

    this.builder.events.on("onReady", (eventData) => {
      const currentThemeId = (this.builder as any).currentThemeId;

      if (this.activeTheme && this.activeTheme.themeId !== currentThemeId && this.activeTheme.deactivate) {
        this.activeTheme.deactivate(eventData.shell);
      }

      const targetTheme = this.themesMap.get(currentThemeId);
      if (targetTheme) {
        this.activeTheme = targetTheme;

        // 💡 BENTUK AMAN: Kirim iterator array hasil values Map cloningan ke modul tema
        const liveElementsArray = Array.from(eventData.components.values());

        // Modul tema menerima array element hidup hasil saringan aman
        targetTheme.activate(eventData.shell, liveElementsArray);
      }

      if (this.showSwitcher) this.renderSwitcher();
    });

    this.builder.events.on("onError", (errData) => {
      console.error(`[ThemeEngine] Captured core anomaly: ${errData.message}`, errData.error);
    });
  }


  private renderSwitcher() {
    // 1. Hancurkan switcher widget lama jika ada di halaman
    if (this.switcherElement && this.switcherElement.parentNode) {
      this.switcherElement.parentNode.removeChild(this.switcherElement);
    }

    // 2. Dapatkan status tema yang sedang aktif saat ini
    const currentActiveThemeId = (this.builder as any).currentThemeId;

    // 3. Susun tombol-tombol pilihan tema secara dinamis
    const menuSchemas: iBasicNode[] = [
      { tagName: "span", className: "title", content: "switch theme preview".toUpperCase() }
    ];

    this.themesMap.forEach((themeModule, themeId) => {
      const isActive = themeId === currentActiveThemeId;

      menuSchemas.push({
        tagName: "button",
        className: `item option ${isActive ? "active" : ""}`,
        content: themeModule.name || themeId,
        onCreated: (btnEl: HTMLElement) => {
          btnEl.addEventListener("click", () => {
            this.resetIdleTimer(); // Reset hitung mundur timer setiap ada aktivitas klik
            if (!isActive) {
              this.builder.changeTheme(themeId);
            }
          });
        }
      });
    });

    // 4. Rakit Konten Widget Berdasarkan Urutan Vertikal Posisi (Top vs Bottom)
    const widgetNodes: iBasicNode[] = [];
    const panelSchema: iBasicNode = {
      tagName: "div",
      className: "panel " + (this.isSwitcherOpen ? "is-open" : ""),
      content: menuSchemas
    };

    // Jika posisi melayang di bawah, taruh panel menu di ATAS tombol FAB
    if (this.switcherPosition.startsWith("bottom")) {
      widgetNodes.push(panelSchema);
    }

    // Masukkan Tombol Lingkaran FAB Utama
    widgetNodes.push({
      tagName: "button",
      className: "trigger",
      title: "Click for switching theme", // Native OS tooltip, ringkas & anti-bug!
      content: this.isSwitcherOpen ? "✕" : "⚙️",
      onCreated: (fabEl: HTMLElement) => {
        fabEl.addEventListener("click", () => {
          this.isSwitcherOpen = !this.isSwitcherOpen;

          if (this.isSwitcherOpen) {
            this.resetIdleTimer();
          } else {
            this.clearIdleTimer();
          }

          this.renderSwitcher(); // Re-render visual murni memutasi kelas CSS
        });
      }
    });

    // Jika posisi melayang di atas, taruh panel menu di BAWAH tombol FAB
    if (this.switcherPosition.startsWith("top")) {
      widgetNodes.push(panelSchema);
    }

    // 5. BUNGKUS KE BLUEPRINT UTAMA (Menerapkan Token Koordinat Posisi)
    const switcherSchema: iBasicNode = {
      tagName: "div",
      // id: "theme-switcher-wrapper",
      className: `fab ${this.switcherPosition}`, // Menembak class CSS eksternal .pos-bottom-right dll.
      content: widgetNodes
    };

    // 6. Cetak fisiknya murni lewat DOMRenderer dan tempel langsung ke document.body
    this.switcherElement = this.engine.render(NodeTransformer.resolveContentNode(switcherSchema), this.emptyRegistry);
    document.body.appendChild(this.switcherElement);
  }


  private resetIdleTimer() {
    this.clearIdleTimer();

    // Daftarkan hitung mundur baru berdasarkan durasi yang ditentukan (misal 10 detik)
    this.idleTimeoutTimer = window.setTimeout(() => {
      if (this.isSwitcherOpen) {
        console.log(`[ThemeEngine Idle] ${this.idleDelayDuration / 1000}s Idle reached. Closing menu panel...`);
        this.isSwitcherOpen = false;
        this.renderSwitcher(); // Mengembalikan ke state awal rounded button secara otomatis
      }
    }, this.idleDelayDuration);
  }

  private clearIdleTimer() {
    if (this.idleTimeoutTimer) {
      window.clearTimeout(this.idleTimeoutTimer);
      this.idleTimeoutTimer = null;
    }
  }
}

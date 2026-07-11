import { BuilderRegistry } from "../BuilderRegistry";
import type { iBasicNode, iThemeModule, themeSwitcherPosition } from "../interface";
import { NodeTransformer } from "../Utils/NodeTransformer";
import { DOMRenderer } from "./DOMRenderer";
interface iSwitcherConfig { position: boolean | themeSwitcherPosition, duration: number | null }
export class ThemeRenderer {
  public activeTheme: iThemeModule | null = null;
  public themesMap = new Map<string, iThemeModule>();

  private builder: any = null;

  // Local helper renderer engine
  private engine = new DOMRenderer();
  private emptyRegistry = new BuilderRegistry();
  isSwitcherOpen: boolean = false;
  switcherElement: HTMLElement | null = null;

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
    this.builder.events.on("beforeRender", (renderPayload: any) => {
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

  public renderSwitcher(config: Partial<iSwitcherConfig> = { position: "bottom-left", duration: 10000 }) {

    const switcherPosition = config.position;

    // 1. Hancurkan switcher widget lama jika ada di halaman
    if (this.switcherElement && (this.switcherElement as HTMLElement).parentNode) {
      ((this.switcherElement as HTMLElement).parentNode as HTMLElement).removeChild(this.switcherElement);
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
            this.resetIdleTimer(this.isSwitcherOpen, config.duration as number); // Reset hitung mundur timer setiap ada aktivitas klik
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
    if ((switcherPosition as themeSwitcherPosition).startsWith("bottom")) {
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
            this.resetIdleTimer(this.isSwitcherOpen, config.duration as number);
          } else {
            this.clearIdleTimer(config.duration as number);
          }

          this.renderSwitcher(); // Re-render visual murni memutasi kelas CSS
        });
      }
    });

    // Jika posisi melayang di atas, taruh panel menu di BAWAH tombol FAB
    if ((switcherPosition as themeSwitcherPosition).startsWith("top")) {
      widgetNodes.push(panelSchema);
    }

    // 5. BUNGKUS KE BLUEPRINT UTAMA (Menerapkan Token Koordinat Posisi)
    const switcherSchema: iBasicNode = {
      tagName: "div",
      // id: "theme-switcher-wrapper",
      className: `fab ${switcherPosition}`, // Menembak class CSS eksternal .pos-bottom-right dll.
      content: widgetNodes
    };

    // 6. Cetak fisiknya murni lewat DOMRenderer dan tempel langsung ke document.body
    this.switcherElement = this.engine.render(NodeTransformer.resolveContentNode(switcherSchema), this.emptyRegistry);
    document.body.appendChild(this.switcherElement);
  }


  private resetIdleTimer(isSwitcherOpen: boolean, idleDuration: number) {
    this.clearIdleTimer();

    // Daftarkan hitung mundur baru berdasarkan durasi yang ditentukan (misal 10 detik)
    window.setTimeout(() => {
      if (isSwitcherOpen) {
        console.log(`[ThemeEngine Idle] ${idleDuration as number / 1000}s Idle reached. Closing menu panel...`);
        isSwitcherOpen = false;
        this.renderSwitcher(); // Mengembalikan ke state awal rounded button secara otomatis
      }
    }, idleDuration);
  }

  private clearIdleTimer(timeoutTimer?: number) {
    if (timeoutTimer) {
      window.clearTimeout(timeoutTimer);
      timeoutTimer = null as any;
    }
  }
}

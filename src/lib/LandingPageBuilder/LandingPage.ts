import { ComponentRegistry } from "./Modules/ComponentRegistry";
import type { iBasicNode, iBuilderRegistry, iLandingPageBuilderSource, iNodeContent } from "./interface";
import { DOMRenderer } from "./Modules/DOMRenderer";
import { ThemeRenderer } from "./Modules/ThemeRenderer";
import { EventEmitter } from "./Modules/EventEmitter";
import { NodeTransformer } from "./Utils/NodeTransformer";
import { HashRouter, type iRouteState } from "./Modules/HashRouter";

export interface iLandingPageBuilderConfig {
  container: HTMLElement | string;
  theme?: string;
  mode?: 'light' | 'dark' | string;
  useMenu?: boolean;
  useFooter?: boolean;
  defaultRoute?: string;
  allowCustomClasses?: boolean;
  onSectionRendered?: (sectionId: string, element: HTMLElement) => void;
}

export class LandingPageBuilder {
  /* NODE/ELEMENT  */
  private container!: HTMLElement;
  public shell: HTMLElement | null = null;

  private _menuData: iBasicNode | null = null;
  private footer: HTMLElement | iBasicNode | null = null;
  private pages: Record<string, (iNodeContent<any> | iBasicNode)[]> = {};
  private renderedNodesMap = new Map<string, HTMLElement>();

  /* ROUTE */
  private defaultRoute!: string;
  private currentRoute!: string;
  public pendingFragment: string = "";

  /* CONFIG */
  private useMenu!: boolean;
  private useFooter!: boolean;
  public currentThemeId: string = "default";

  // Core Render Engine
  public factory: DOMRenderer | null = null;
  public component: ComponentRegistry | null = null;
  public router!: HashRouter;
  public theme: ThemeRenderer | null = null;
  public events = new EventEmitter();

  _isInternalRendering!: boolean;

  constructor(
    source: iLandingPageBuilderSource,
    config: iLandingPageBuilderConfig) {
    try {
      const resolved = typeof config.container === "string" ? document.querySelector(config.container) : config.container;
      if (!resolved || !(resolved instanceof HTMLElement)) {
        throw new Error("Target container not found.");
      }

      this.factory = new DOMRenderer();
      this.theme = new ThemeRenderer();
      this.component = new ComponentRegistry();

      this.container = resolved;
      this.useMenu = config.useMenu ?? true;
      this.useFooter = config.useFooter ?? true;

      this.menu = source.menu ?? null;
      this.footer = source.footer ?? null;
      this.pages = source.pages || {};


      // activate theme
      this.theme.attachBuilder(this);

      this.defaultRoute = this.normalizeRoute(config.defaultRoute || "home");
      const persistedTheme = localStorage.getItem("active_theme");

      this.router = new HashRouter(this.defaultRoute, persistedTheme || (config.theme as string) || "default", Object.keys(this.pages), (state: iRouteState) => {
        // Callback otomatis ter-trigger setiap kali URL hash berubah!
        if (state.theme && state.theme !== this.currentThemeId) {
          this.currentThemeId = state.theme;
          localStorage.setItem("active_theme", state.theme);
          this.events.emit("themeChanged", { themeId: state.theme, shell: this.shell! });
        }

        this.pendingFragment = state.fragment;
        this.render(state.route);
      });

      const urlState = this.router.parseUrlHash();
      this.currentRoute = urlState.route;
      this.pendingFragment = urlState.fragment;
      this.currentThemeId = urlState.theme || persistedTheme || (config.theme as string) || "default";
      localStorage.setItem("active_theme", this.currentThemeId);

    } catch (error: any) {
      // 💡 EVENT TRIGGER: onError
      this.events.emit("error", { message: "Failed to initialize LandingPageBuilder", error, context: "constructor" });
    }
  }

  public get menu(): HTMLElement | iBasicNode | null {
    return this._menuData;
  }

  public set menu(newMenuBlueprint: HTMLElement | iBasicNode | null) {
    this._menuData = newMenuBlueprint;

    // 💡 LIVE HOT-SWAP SINKRONUS:
    // Jika shell sudah terpasang di DOM dan renderedNodesMap sudah memegang navbar lama,
    // langsung eksekusi pencetakan ulang menu baru tanpa perlu re-render seluruh halaman!
    if (this.shell && (this as any).useMenu) {
      console.log("[Reactive Menu Setter] Menu blueprint changed. Hot-swapping navbar element in live DOM...");

      // 1. Jalankan restorasi dan kompilasi JIT murni satu kali di luar buildStructure
      const resolvedMenu = this._menuData ? NodeTransformer.resolveContentNode(this._menuData) : null;
      const cleanMenuBlueprint = (this as any).restore(resolvedMenu);

      if (cleanMenuBlueprint) {
        // Ambil element navbar fisik lama yang sedang menempel di layar
        const oldNavbarElement = (this as any).renderedNodesMap.get("system-navbar");

        // Bakar blueprint baru menjadi HTMLElement hidup lewat pintu utama .compile() Anda
        const newNavbarElement = this.compile(cleanMenuBlueprint);

        if (newNavbarElement && oldNavbarElement && this.shell.contains(oldNavbarElement)) {
          // 🧙‍♂️ ABAKADABRA: Tukar fisiknya secara instan di layar menggunakan native DOM API!
          this.shell.replaceChild(newNavbarElement, oldNavbarElement);
          (this as any).renderedNodesMap.set("system-navbar", newNavbarElement);
        } else if (newNavbarElement) {
          // Jika sebelumnya tidak ada menu tapi useMenu diaktifkan, langsung prepend di atas
          this.shell.prepend(newNavbarElement);
          (this as any).renderedNodesMap.set("system-navbar", newNavbarElement);
        }
      } else {
        // Jika menu di-set menjadi null, copot fisiknya dari layar
        const oldNavbarElement = (this as any).renderedNodesMap.get("system-navbar");
        if (oldNavbarElement) oldNavbarElement.remove();
        (this as any).renderedNodesMap.delete("system-navbar");
      }
    }
  }


  private restore(target: HTMLElement | null): iBasicNode | null {
    if (!target) return null;
    if (target instanceof HTMLElement) {
      target.removeAttribute("style");
      return { content: target } as any;
    }
    return target as iBasicNode;
  }

  /**
   * Publik API untuk mengganti tema secara reaktif di level runtime
   */
  public changeTheme(themeId: string) {
    this.router.navigate(this.currentRoute, themeId, this.pendingFragment);
  }

  /**
 * 🏗️ THE TRUE PURE RENDER MACHINE (Ultra Ramping & Sempurna!)
 * Hanya bertugas menempelkan elemen hidup yang sudah dimatangkan penuh oleh .compile()
 */
  async render(route: string = this.currentRoute): Promise<void> {

    if (!this.shell) {
      this.shell = document.createElement("main");
      this.shell.className = "page";
    }

    this.currentRoute = this.normalizeRoute(route);

    this._isInternalRendering = true;

    const payload = await this.prepare();

    this._isInternalRendering = false;

    if (this.shell.parentElement !== this.container) {
      this.container.appendChild(this.shell);
      this.events.emit("elementAdded", { element: this.shell, parent: this.container });
    }

    (this.shell as HTMLElement).innerHTML = "";
    this.renderedNodesMap.clear();

    // Pancarkan sebelum render untuk kebutuhan plugin luar, data sudah 100% matang ter-hydrate!
    // this.events.emit("beforeRender", payload as any);

    // console.log(payload)
    // 1. Jalankan Kompilasi & Penempelan Navbar Menu
    if (this.useMenu && payload?.menu) {
      const renderedMenu = this.compile(payload?.menu);
      if (renderedMenu) {
        this.renderedNodesMap.set("system-navbar", renderedMenu);
        this.shell?.appendChild(renderedMenu);
      }
    }

    // 2. Jalankan Kompilasi & Penempelan Seluruh Urutan Blok Halaman
    payload?.pages.forEach((block: any, index: number) => {
      const renderedBlock = this.compile(block);
      if (renderedBlock) {
        const nodeKey = block.id || block.name || `section-block-${index}`;
        this.renderedNodesMap.set(nodeKey, renderedBlock);
        this.shell?.appendChild(renderedBlock);
      }
    });

    // 3. Jalankan Kompilasi & Penempelan Footer
    if (this.useFooter && payload?.footer) {
      const renderedFooter = this.compile(payload?.footer);
      if (renderedFooter) {
        this.renderedNodesMap.set("system-footer", renderedFooter);
        this.shell?.appendChild(renderedFooter);
      }
    }

    // SCROLL ANCHOR & ONREADY
    window.setTimeout(() => {
      // console.log(`[Lifecycle Scroll Lock] Invoking smooth glide animation to section anchor: #${this.pendingFragment}`);
      this._handleScrollSection();
    });

    this.events.emit("ready", {
      shell: this.shell as HTMLElement,
      elements: new Map(this.renderedNodesMap),
      context: payload?.context
    });
  }


  private _prepareDataSnapshot() {
    const rawPages = NodeTransformer.safeCloneNode(this.pages[this.currentRoute] || []);
    const rawMenu = NodeTransformer.safeCloneNode(this.menu as any);
    const rawFooter = NodeTransformer.safeCloneNode(this.footer as any);

    return {
      pages: rawPages,
      menu: rawMenu,
      footer: rawFooter
    };
  }

  private async prepare(): Promise<{ pages: any, menu: any, footer: any, context: any } | undefined> {
    try {
      // 1. Amankan snapshot memori imutabel (Data master murni)
      const snapshot = this._prepareDataSnapshot();

      const context = {
        /** Fungsi live penimpa konfigurasi internal builder */
        setConfig: (builderName: keyof iBuilderRegistry, newConfig: Record<string, any>) => {
          if (this.component && typeof this.component.setConfig === "function") {
            this.component.setConfig(builderName, newConfig);
          }
        },
        /** Fungsi penjemput data laporan metadata halaman */
        getMeta: () => {
          return metaReport;
        }
      };

      // 💡 SANGAT SUCI: Hilangkan semua panggilan NodeTransformer.resolveContentNode di sini!
      // Biarkan data mengalir polos, tebal, dan jujur sesuai takdir format aslinya.
      let rawBlocks = snapshot.pages;
      let rawMenu = this.restore(snapshot.menu as any);
      let rawFooter = this.restore(snapshot.footer as any);

      // 2. RUNTIME PRE-LOAD PIPELINE TERMINAL (Berdasarkan data master asli)
      const metaReport = NodeTransformer.scanMetaNodes(rawBlocks);
      const requiredBuilders = Object.keys(metaReport.hasComponent).filter(
        (key) => (metaReport.hasComponent as any)[key].active === true
      );

      if (this.shell && requiredBuilders.length > 0) {
        this.shell.className = "page loading";
        await this.component?.preloadComponents(requiredBuilders, NodeTransformer.safeCloneNode(rawBlocks));
        this.shell.className = "page";
      }

      const payload = {
        pages: rawBlocks,
        menu: rawMenu,
        footer: rawFooter,
        context
      }

      this.events.emit("beforeRender", payload);


      // // 4. EMBARK FINAL RENDERING COMPILER PIPELINE
      return payload;

    } catch (error: any) {
      this.events.emit("error", { message: "Pipeline preparation cycle crash", error, context: "prepare" });
    }
  }

  /**
   * 👑 THE UNIVERSAL COMPILER ENGINE (Final Sovereign Pipeline)
   * FIX MUTLAK: Membalik urutan eksekusi agar elemen HTMLElement hidup buatan builder 
   * tidak terbuang sia-sia akibat proses kloning resolveContentNode!
   */
  public compile(node: any): HTMLElement | null {
    if (!node || typeof node !== "object") return null;
    if (node instanceof HTMLElement) return node;

    // ====================================================
    // 🧙‍♂️ JALUR 1: THE JUST-IN-TIME TRANSFORMATION GATEWAY (Langkah Pertama!)
    // Terjemahkan advanced selector keys ke format iNodeContent secara transparan di luar.
    // Struktur data objek dipastikan 100% aman karena elemen fisiknya belum lahir!
    // ====================================================
    const resolvedBlueprint = NodeTransformer.resolveContentNode(node);

    const buildComponent = (name: keyof iBuilderRegistry, data: any): HTMLElement | null => {
      if (this.component && this.component.has(name)) {
        const boundBuildFn = this.component.build.bind(this.component);
        return boundBuildFn(name as keyof iBuilderRegistry, data);
      }
      console.warn(`[Component Launcher] Builder "${name}" is missing from core pool.`);
      return null;
    };

    // ====================================================
    // 🧙‍♂️ JALUR 2: DEEP COMPONENT HYDRO-MATRIX (Langkah Kedua!)
    // Setelah kuncinya rapi ter-resolve, barulah renderComponent menyelam 
    // mencari properti .builder dan menukarnya menjadi HTMLElement hidup secara instan!
    // ====================================================
    this.renderComponent([resolvedBlueprint]);

    // ====================================================
    // 🧱 LANGKAH 3: SYNCHRONOUS DOM RENDERING MACHINE
    // Suapkan data resolvedBlueprint yang sudah 100% matang membawa organ elemen hidup!
    // ====================================================
    const renderedElement = this.factory?.render(resolvedBlueprint, this.compile.bind(this), buildComponent as any);

    if (renderedElement instanceof HTMLElement && this.shell instanceof HTMLElement) {
      this.events.emit("elementAdded", { element: renderedElement, parent: this.shell });
      return renderedElement;
    }

    return null;
  }

  /**
   * 🎢 THE PURE COMPONENT RESOLVER (Sovereign Builder Executor)
   * Tetap murni dan fokus hanya mengeksekusi objek yang membawa properti .builder
   */
  private renderComponent(nodes: any[]): void {
    if (!nodes || !Array.isArray(nodes)) return;

    const scanAndBuild = (item: any) => {
      if (!item || typeof item !== "object" || item instanceof HTMLElement) return;

      // Jika mendeteksi array (seperti properti content: []), selami menggunakan loop array normal
      if (Array.isArray(item)) {
        item.forEach(scanAndBuild);
        return;
      }

      for (const key of Object.keys(item)) {
        const value = item[key];
        if (!value || typeof value !== "object" || value instanceof HTMLElement) continue;

        // Deteksi Komponen Builder Kustom
        if (value.builder && this.component?.has(value.builder)) {
          // Letupkan komponen hidup secara instan di level memori runtime!
          const liveDomElement = this.component.build(value.builder, value);

          if (liveDomElement instanceof HTMLElement) {
            if (value.attrs && typeof value.attrs === "object") {
              Object.entries(value.attrs).forEach(([aName, aValue]) => {
                liveDomElement.setAttribute(aName, String(aValue));
              });
            }

            // Penguncian Lifecycle isRoot Sejati
            if (value.isRoot === true) {
              Object.keys(value).forEach((k) => {
                if (k !== "content" && k !== "builder" && k !== "isRoot" && k !== "attrs") {
                  delete value[k];
                }
              });
              value.content = liveDomElement; // Dibajak murni jadi Kasus A HTMLElement Hidup
            } else {
              value.content = liveDomElement;
            }

            this.events.emit("elementAdded", { element: liveDomElement, parent: this.shell! });
            break;
          }
        } else {
          scanAndBuild(value); // Terus menyelam mencari builder bersarang di tingkat terdalam
        }
      }
    };

    nodes.forEach(scanAndBuild);
  }


  public destroy(): void {
    // window.removeEventListener("hashchange", this.handleHashChange);
    if (this.shell && this.shell.parentElement) {
      this.shell.parentElement.removeChild(this.shell);
      this.events.emit("elementRemoved", { element: this.shell });
    }
    this.events.clear(); // Bersihkan seluruh memory listeners
    this.container.innerHTML = "";
  }

  // =============================
  //      Hash Route handler 
  // =============================
  private _handleScrollSection() {
    if (this.pendingFragment) {
      const fragment = this.pendingFragment;
      this.pendingFragment = "";
      window.requestAnimationFrame(() => {
        const target = document.getElementById(fragment);
        target?.scrollIntoView({ block: "start", behavior: "auto" });
      });
    }
  }


  private normalizeRoute(route: string): string {
    const resolved = route.trim().replace(/^#/, "");
    return resolved || "home";
  }

}


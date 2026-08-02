import { ComponentRegistry } from "./Modules/ComponentRegistry";
import { GLOBAL_DISPLAY_LOG, type iBasicNode, type iBuilderRegistry, type iLandingPageBuilderSource, type iNodeContent } from "./interface";
import { DOMRenderer } from "./Modules/DOMRenderer";
import { ThemeRenderer } from "./Modules/ThemeRenderer";
import { EventEmitter } from "./Services/EventEmitter";
import { NodeTransformer } from "./Utils/NodeTransformer";
import { HashRouter, type iRouteState } from "./Services/HashRouter";
import { DOMTreeMemory } from "./Modules/DOMTreeMemory";
import { EventBus, RenderingEventBus } from "./Services/EventBus";
import { DataLogger } from "./Utils/DataLogger";

const DISPLAY_LOG = GLOBAL_DISPLAY_LOG;

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
  #nodes = new Map<string, HTMLElement>();

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

      EventBus.listen();

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


  /**
   * 👑 ON PAGE REBUILD (PUNCAK PENYATUAN BLUEPRINT METADATA SYSTEM ANDA!)
   * Menyerap rekor halaman dari DOMRenderer, menjahit hubungan darah dua arah lintas klan builder,
   * dan mengamankan status kestabilan memori RAM pusat sekejap mata!
   * 
   * @param route Nama rute aktif yang sedang dikunjungi (e.g. "home", "admin")
   * @param pageMetadata Paket objek metadata berisi records container terluar hantaran DOMRenderer
   */
  private onPageRebuild(route: string, payload: any): void {
    // Pancarkan sebelum render untuk kebutuhan plugin luar, data sudah 100% matang ter-hydrate!
    this.events.emit("beforeRender", payload as any);

    const metadata = { records: [] } as any;

    const describeElement = (el: HTMLElement) => {
      const tag = el?.tagName ? el.tagName.toLowerCase() : "unknown";
      const id = el?.id ? `#${el.id}` : "";
      const className = el?.className ? `.${String(el.className).trim().split(/\s+/).filter(Boolean).join(".")}` : "";
      return `${tag}${id}${className}`;
    };

    const getShellSelector = (shell: HTMLElement) => {
      const tagName = shell?.tagName.toLowerCase() || "div";
      const className = `${shell?.className ? "." + shell?.className : ""}`;
      const id = `${shell?.id ? "#" + shell?.id : ""}`;
      const attr = `${shell?.hasAttribute("name") ? "[name=" + shell.getAttribute("name") + "]" : ""}`
      return tagName + id + className + attr;
    }

    const buildElement = (namedKey: string, data: any, _metadata: any, shell: HTMLElement) => {
      const parentKey = getShellSelector(shell!);
      const el = this.compile(data);
      const meta = el?.getMetadata!({ scopeId: route, parentKey })
      _metadata.records.push(meta[0]);
      if (el) {
        this.#nodes.set(namedKey, el);
        shell?.appendChild(el);
        const builderName = data?.builder || data?.raw?.builder || data?.content?.builder || "manual";
        DataLogger(DISPLAY_LOG, { functionName: "🧱 [LandingPage]", action: "Attach" },
          {
            route, slot: namedKey,
            builder: builderName,
            element: describeElement(el),
            records: `${metadata.records.length} item(s)`,
            shellChildren: `${shell.children.length} element(s)`,
            payloadType: `${Array.isArray(data?.content) ? "array" : typeof data?.content}`
          }
        )
      }
    }

    // 1. Jalankan Kompilasi & Penempelan Navbar Menu
    if (this.useMenu && payload?.menu) {
      buildElement("system-navbar", payload.menu, metadata, this.shell!)
    }

    // 2. Jalankan Kompilasi & Penempelan Seluruh Urutan Blok Halaman
    payload?.pages.forEach((block: any, index: number) => {
      const nodeKey = block.id || block.name || `section-block-${index}`;
      buildElement(nodeKey, block, metadata, this.shell!)
    });

    // 3. Jalankan Kompilasi & Penempelan Footer
    if (this.useFooter && payload?.footer) {
      buildElement("system-footer", payload.footer, metadata, this.shell!)
    }

    console.log(`📚 [LandingPage -> Metadata Stats]: route=${route} totalRecords=${metadata.records.length}`, metadata.records);
    console.log("domtreememory #nodes", DOMTreeMemory.getAll().entries())

    // SCROLL ANCHOR & ONREADY
    window.setTimeout(() => {
      // console.log(`[Lifecycle Scroll Lock] Invoking smooth glide animation to section anchor: #${this.pendingFragment}`);
      this._handleScrollSection();
    });

    this.events.emit("ready", {
      shell: this.shell as HTMLElement,
      elements: new Map(this.#nodes),
      context: payload?.context
    });
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
    // Unlock body scroll in case a modal or overlay left it locked
    document.body.style.overflow = "";

    if (!this.shell) {
      this.shell = document.createElement("main");
      this.shell.className = "page";
    }

    const previousRoute = this.currentRoute || route;
    const detachHandler = RenderingEventBus.handler(previousRoute, this.shell, this.container);

    if (this.shell.parentElement) {
      detachHandler.detach();
    }

    this.currentRoute = this.normalizeRoute(route);

    this._isInternalRendering = true;

    const payload = await this.prepare();

    this._isInternalRendering = false;

    (this.shell as HTMLElement).innerHTML = "";
    this.#nodes.clear();

    RenderingEventBus.broadcast("beforeRender", {
      route,
      shell: this.shell,
      payload
    });

    this.onPageRebuild(route, payload) // <= ini proses penyatuan metadatanya dengan parameter metadata dari page

    const attachHandler = RenderingEventBus.handler(this.currentRoute, this.shell, this.container);
    attachHandler.attach();
    if (this.shell.parentElement === this.container) {
      this.events.emit("elementAdded", { element: this.shell, parent: this.container });
    }

    RenderingEventBus.broadcast("ready", {
      route,
      shell: this.shell,
      payload
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
      // 0. Clean up previous page/route node registries & instance identity counters
      this.component?.clear();

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
      // console.log({ metaReport, snapshot })
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

    const DOMSchema = NodeTransformer.resolveContentNode(node);

    const buildComponent = (name: keyof iBuilderRegistry, data: any): HTMLElement | null => {
      if (this.component && this.component.has(name)) {
        const boundBuildFn = this.component.build.bind(this.component);
        return boundBuildFn(name as keyof iBuilderRegistry, data);
      }
      console.warn(`[Component Launcher] Builder "${name}" is missing from core pool.`);
      return null;
    };

    // console.log({ DOMSchema })

    this.renderComponent([DOMSchema]);

    const DOMTree = this.factory?.render(DOMSchema, this.compile.bind(this), buildComponent as any);

    if (DOMTree instanceof HTMLElement && this.shell instanceof HTMLElement) {
      this.events.emit("elementAdded", { element: DOMTree, parent: this.shell });
      return DOMTree as HTMLElement;
    }

    return null;
  }

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
    this.component?.clear();
    EventBus.shutdown();
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



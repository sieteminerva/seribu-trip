import { type BuilderRegistry } from "./BuilderRegistry";
import type { iBasicNode, iLandingPageBuilderSource, iNodeContent } from "./interface";
import { DOMRenderer } from "./Renderers/DOMRenderer";
import { EventEmitter } from "./Utils/EventEmitter";
import { NodeTransformer } from "./Utils/NodeTransformer";

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
  private container!: HTMLElement;
  private shell: HTMLElement | null = null;
  private pages: Record<string, (iNodeContent<any> | iBasicNode)[]> = {};
  private currentRoute!: string;
  private menu: HTMLElement | iBasicNode | null = null;
  private footer: HTMLElement | iBasicNode | null = null;
  private useMenu!: boolean;
  private useFooter!: boolean;
  private defaultRoute!: string;
  private pendingFragment: string = "";
  currentThemeId: string = "default";
  private renderedNodesMap = new Map<string, HTMLElement>();

  // Core Render Engine
  private factory!: DOMRenderer;
  private builder!: BuilderRegistry | null;
  public events = new EventEmitter();

  constructor(source: iLandingPageBuilderSource, config: iLandingPageBuilderConfig, builder: BuilderRegistry | null = null) {
    try {
      const resolved = typeof config.container === "string" ? document.querySelector(config.container) : config.container;
      if (!resolved || !(resolved instanceof HTMLElement)) {
        throw new Error("Target container not found.");
      }

      this.factory = new DOMRenderer();
      this.builder = builder;

      this.container = resolved;
      this.useMenu = config.useMenu ?? true;
      this.useFooter = config.useFooter ?? true;
      this.menu = source.menu ?? null;
      this.footer = source.footer ?? null;
      this.pages = source.pages || {};

      this.currentThemeId = config.theme || "default";

      this.defaultRoute = this.normalizeRoute(config.defaultRoute || "home");

      const initialRoute = this.resolveRouteFromHash();
      this.currentRoute = initialRoute.route;
      this.pendingFragment = initialRoute.fragment;

      window.addEventListener("hashchange", this.handleHashChange);
    } catch (error: any) {
      // 💡 EVENT TRIGGER: onError
      this.events.emit("onError", { message: "Failed to initialize LandingPageBuilder", error, context: "constructor" });
    }
  }

  private restore(element: HTMLElement | null): iBasicNode | null {
    if (!element) return null;
    element.removeAttribute("style");
    return { content: element } as any;
  }

  /**
   * Publik API untuk mengganti tema secara reaktif di level runtime
   */
  public changeTheme(themeId: string) {
    this.currentThemeId = themeId;
    if (this.shell) {
      // 💡 EVENT TRIGGER: onThemeChanged
      this.events.emit("onThemeChanged", { themeId, shell: this.shell });
    }
    this.render(); // Picu re-render otomatis untuk menerapkan transformasi visual tema
  }

  /**
   * REFACTOR TOTAL: Metode render menjadi super pendek dan linear!
   */
  public render(route: string = this.currentRoute): void {
    try {
      if (!this.shell) {
        this.shell = document.createElement("main");
        this.shell.className = "page";
      }

      this.currentRoute = this.normalizeRoute(route);

      if (this.shell.parentElement !== this.container) {
        this.container.appendChild(this.shell);
        this.events.emit("onElementAdded", { element: this.shell, parent: this.container });
      }

      // 1. Ambil salinan data mentah asal rute aktif saat ini (Gunakan Deep Clone agar data asli aman)
      let rawBlocks = JSON.parse(JSON.stringify(this.pages[this.currentRoute] || this.pages[this.defaultRoute] || []));
      let rawMenu = this.menu instanceof HTMLElement ? this.restore(this.menu) : this.menu; // Representasi objek basic menu
      let rawFooter = this.footer instanceof HTMLElement ? this.restore(this.footer) : this.footer;

      // 2. Bungkus ke dalam satu paket objek referensi
      const renderPayload = { pages: rawBlocks, menu: rawMenu, footer: rawFooter };

      // 🧙‍♂️ EMIT: Pancarkan event sebelum render! 
      // Siapapun yang mendengarkan event ini (termasuk modul tema) diberikan hak memutasi isi 'renderPayload'
      this.events.emit("beforeRender", renderPayload);

      this.renderedNodesMap.clear();

      // const blocks = this.pages[this.currentRoute] || this.pages[this.defaultRoute] || [];

      // Simulasikan pembersihan elemen lama untuk memicu onElementRemoved
      if (this.shell.children.length > 0) {
        Array.from(this.shell.children).forEach((child) => {
          // 💡 EVENT TRIGGER: onElementRemoved
          this.events.emit("onElementRemoved", { element: child as HTMLElement });
        });
      }

      this.shell.innerHTML = "";


      if (this.useMenu && renderPayload.menu) {
        const renderedMenu = this.factory.render(NodeTransformer.resolveContentNode(renderPayload.menu), this.builder);
        this.shell.appendChild(renderedMenu);
        this.renderedNodesMap.set("system-navbar", renderedMenu);
        this.events.emit("onElementAdded", { element: renderedMenu, parent: this.shell });
      }


      renderPayload.pages.forEach((block: iNodeContent, index: number) => {
        let DOMSchema: iNodeContent<any>;

        // JEMBATAN OTOMATIS: Deteksi apakah block menggunakan format ramah pemula
        if ("tagName" in block || ("content" in block && !Object.keys(block)[0].includes('.'))) {
          // Jika ya, konversi otomatis menjadi format core engine di balik layar
          DOMSchema = NodeTransformer.resolveContentNode(block as iBasicNode);
        } else {
          // Jika tidak (berarti format string selector milik senior), langsung pakai
          DOMSchema = block as iNodeContent<any>;
        }

        // Jalankan render menggunakan core engine abadi
        const renderedBlock = this.factory.render(DOMSchema as any, this.builder);

        const nodeKey = block.id || block.name || `section-block-${index}`;
        this.renderedNodesMap.set(nodeKey, renderedBlock);

        this.shell?.appendChild(renderedBlock);
        this.events.emit("onElementAdded", { element: renderedBlock, parent: this.shell! });
      });

      if (this.useFooter && renderPayload.footer) {
        const renderedFooter = this.factory.render(NodeTransformer.resolveContentNode(renderPayload.footer), this.builder);
        this.renderedNodesMap.set("system-footer", renderedFooter);
        this.shell.appendChild(renderedFooter);
        this.events.emit("onElementAdded", { element: renderedFooter, parent: this.shell });
      }

      // 💡 EVENT TRIGGER: onPageChanged
      this.events.emit("onPageChanged", { route: this.currentRoute, activeNodes: Array.from(this.renderedNodesMap.values()) });

      // 💡 EVENT TRIGGER: onReady (Seluruh halaman selesai dijahit total ke DOM)
      this.events.emit("onReady", { shell: this.shell, components: new Map(this.renderedNodesMap) });

      // Logika scroll pendingFragment bawaan Anda tetap konsisten berjalan di bawah ini...
      if (this.pendingFragment) {
        const fragment = this.pendingFragment;
        this.pendingFragment = "";
        window.requestAnimationFrame(() => {
          const target = document.getElementById(fragment);
          target?.scrollIntoView({ block: "start", behavior: "auto" });
        });
      }
    } catch (error: any) {
      this.events.emit("onError", { message: "Rendering cycle crash", error, context: "render" });
    }
  }

  public destroy(): void {
    window.removeEventListener("hashchange", this.handleHashChange);
    if (this.shell && this.shell.parentElement) {
      this.shell.parentElement.removeChild(this.shell);
      this.events.emit("onElementRemoved", { element: this.shell });
    }
    this.events.clear(); // Bersihkan seluruh memory listeners
    this.container.innerHTML = "";
  }

  // =============================
  //      Hash Route handler 
  // =============================

  private normalizeRoute(route: string): string {
    const resolved = route.trim().replace(/^#/, "");
    return resolved || "home";
  }


  private resolveRouteFromHash(): { route: string; fragment: string } {
    const rawHash = window.location.hash;
    const hash = rawHash.replace(/^#/, "");

    if (!hash) {
      return { route: this.defaultRoute, fragment: "" };
    }

    const [routePart, ...fragmentParts] = hash.split("#");
    const route = this.normalizeRoute(routePart);
    const fragment = fragmentParts.join("#");

    if (this.pages[route]) {
      return { route, fragment };
    }

    return { route: this.defaultRoute, fragment: hash };
  }

  private handleHashChange = (): void => {
    this.syncRouteFromHash();
  };

  private syncRouteFromHash(): void {
    const { route, fragment } = this.resolveRouteFromHash();
    this.currentRoute = route;
    this.pendingFragment = fragment;
    this.render(route);
  }
}


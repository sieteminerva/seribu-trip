import { BuilderRegistry } from "./BuilderRegistry";
import type { iBasicNode, iLandingPageBuilderSource, iNodeContent } from "./interface";
import { DOMRenderer } from "./Renderers/DOMRenderer";
import { ThemeRenderer } from "./Renderers/ThemeRenderer";
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
  /* NODE/ELEMENT  */
  private container!: HTMLElement;
  public shell: HTMLElement | null = null;

  private menu: HTMLElement | iBasicNode | null = null;
  private footer: HTMLElement | iBasicNode | null = null;
  private pages: Record<string, (iNodeContent<any> | iBasicNode)[]> = {};
  private renderedNodesMap = new Map<string, HTMLElement>();

  /* ROUTE */
  private defaultRoute!: string;
  private currentRoute!: string;
  private pendingFragment: string = "";

  /* CONFIG */
  private useMenu!: boolean;
  private useFooter!: boolean;
  public currentThemeId: string = "default";

  // Core Render Engine
  public factory: DOMRenderer | null = null;
  public component: BuilderRegistry | null = null;
  public theme: ThemeRenderer | null = null;
  public events = new EventEmitter();

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
      this.component = new BuilderRegistry();

      this.container = resolved;
      this.useMenu = config.useMenu ?? true;
      this.useFooter = config.useFooter ?? true;

      this.menu = source.menu ?? null;
      this.footer = source.footer ?? null;
      this.pages = source.pages || {};


      // activate theme
      this.theme.attachBuilder(this);

      this.defaultRoute = this.normalizeRoute(config.defaultRoute || "home");
      const initialRoute = this.resolveRouteFromHash();
      this.currentRoute = initialRoute.route;
      this.pendingFragment = initialRoute.fragment;

      // const urlState = this.parseUrlHash();

      // 2. 🧙‍♂️ JALUR HIBRIDA: Cek URL dulu, kalau kosong cek localStorage, kalau kosong baru pakai config default!
      this.currentThemeId = localStorage.getItem("cms_active_theme") as string || config.theme as string;

      window.addEventListener("hashchange", this.handleHashChange);
    } catch (error: any) {
      // 💡 EVENT TRIGGER: onError
      this.events.emit("onError", { message: "Failed to initialize LandingPageBuilder", error, context: "constructor" });
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
    this.currentThemeId = themeId;

    localStorage.setItem("cms_active_theme", themeId);

    window.location.hash = `${this.currentRoute}?theme=${themeId}`;

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
      let rawMenu = this.restore(this.menu as HTMLElement | null);
      let rawFooter = this.restore(this.footer as HTMLElement | null);

      // 2. Bungkus ke dalam satu paket objek referensi
      const renderPayload = { pages: rawBlocks, menu: rawMenu, footer: rawFooter };

      // 🧙‍♂️ EMIT: Pancarkan event sebelum render! 
      // Siapapun yang mendengarkan event ini (termasuk modul tema) diberikan hak memutasi isi 'renderPayload'
      this.events.emit("beforeRender", renderPayload);

      this.renderedNodesMap.clear();

      // Simulasikan pembersihan elemen lama untuk memicu onElementRemoved
      if (this.shell.children.length > 0) {
        Array.from(this.shell.children).forEach((child) => {
          // 💡 EVENT TRIGGER: onElementRemoved
          this.events.emit("onElementRemoved", { element: child as HTMLElement });
        });
      }

      this.shell.innerHTML = "";


      if (this.useMenu && renderPayload.menu) {
        const renderedMenu = this.factory?.render(NodeTransformer.resolveContentNode(renderPayload.menu), this.component) as HTMLElement;
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
        const renderedBlock = this.factory?.render(DOMSchema as any, this.component) as HTMLElement;

        const nodeKey = block.id || block.name || `section-block-${index}`;
        this.renderedNodesMap.set(nodeKey, renderedBlock);

        this.shell?.appendChild(renderedBlock);
        this.events.emit("onElementAdded", { element: renderedBlock, parent: this.shell! });
      });

      if (this.useFooter && renderPayload.footer) {
        const renderedFooter = this.factory?.render(NodeTransformer.resolveContentNode(renderPayload.footer), this.component) as HTMLElement;
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

  /**
   * Handler otomatis saat user mengetik URL baru atau klik link
   */
  private handleHashChange = (): void => {
    const urlState = this.parseUrlHash();

    // Jika tema di URL berubah (misal user klik link eksternal yang membawa token tema)
    if (urlState.theme && urlState.theme !== this.currentThemeId) {
      this.currentThemeId = urlState.theme;
      this.events.emit("onThemeChanged", { themeId: this.currentThemeId, shell: this.shell! });
    }

    this.render(urlState.route);
  };

  // private syncRouteFromHash(): void {
  //   const { route, fragment } = this.resolveRouteFromHash();
  //   this.currentRoute = route;
  //   this.pendingFragment = fragment;
  //   this.render(route);
  // }

  private parseUrlHash(): { route: string; theme: string | null; fragment: string } {
    // Ambil string hash mentah dan bersihkan tanda # di depan
    const rawHash = window.location.hash.trim().replace(/^#/, "");

    if (!rawHash) {
      return { route: "home", theme: null, fragment: "" };
    }

    // 1. Pisahkan fragment ID internal (#section-id) jika ada di ujung belakang
    const [mainPath, fragment = ""] = rawHash.split("#");

    // 2. Pisahkan Rute Utama dengan Parameter Tema menggunakan tanda tanya (?)
    const [routePath, queryString = ""] = mainPath.split("?");

    let extractedTheme: string | null = null;

    // 3. Jika ada query string, cari parameter 'theme=' secara aman tanpa library luar
    if (queryString) {
      const params = queryString.split("&");
      for (const param of params) {
        const [key, value] = param.split("=");
        if (key === "theme" && value) {
          extractedTheme = value.trim();
          break;
        }
      }
    }

    return {
      route: this.normalizeRoute(routePath),
      theme: extractedTheme,
      fragment: fragment.trim()
    };
  }


}


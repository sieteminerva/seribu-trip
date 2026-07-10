import type { BuilderRegistry } from "./BuilderRegistry";
import type { iBasicNode, iLandingPageBuilderSource, iNodeContent } from "./interface";
import { DOMRenderer } from "./Renderers/DOMRenderer";

export interface iLandingPageBuilderConfig {
  container: HTMLElement | string;
  theme?: 'light' | 'dark' | string;
  useMenu?: boolean;
  useFooter?: boolean;
  defaultRoute?: string;
  allowCustomClasses?: boolean;
  onSectionRendered?: (sectionId: string, element: HTMLElement) => void;
}

export function resolveContentObj(nodeObj: iBasicNode): any {
  const tagName = nodeObj.tagName || "div";
  const idToken = nodeObj.id ? `#${nodeObj.id.trim()}` : "";
  const classToken = nodeObj.className ? `.${nodeObj.className.trim().replace(/\s+/g, '.')}` : "";

  const generatedKey = `${tagName}${idToken}${classToken}`;
  const result: any = { [generatedKey]: {} };
  const innerBlock = result[generatedKey];

  // 1. Salin properti operasional utama jika ada
  if (nodeObj.builder) innerBlock.builder = nodeObj.builder;
  if (nodeObj.onCreated) innerBlock.onCreated = nodeObj.onCreated;
  if (nodeObj.onDestroy) innerBlock.onDestroy = nodeObj.onDestroy;
  if (nodeObj.isRoot !== undefined) innerBlock.isRoot = nodeObj.isRoot;

  // 2. Kumpulkan semua atribut kustom (seperti src, href, alt) selevel tag dasar
  const reservedKeys = ['tag', 'tagName', 'id', 'className', 'builder', 'content', 'onCreated', 'onDestroy', 'attrs'];
  const extractedAttrs = { ...(nodeObj.attrs || {}) };

  Object.keys(nodeObj).forEach(key => {
    if (!reservedKeys.includes(key)) {
      extractedAttrs[key] = nodeObj[key];
    }
  });

  if (Object.keys(extractedAttrs).length > 0) {
    innerBlock.attrs = extractedAttrs;
  }

  // 3. PERBAIKAN LOGIKA: Proses Konversi Konten secara Selektif
  if (nodeObj.content !== undefined) {
    const payload = nodeObj.content;

    if (payload instanceof HTMLElement || typeof payload === "string") {
      // Jika berupa HTML element hidup atau teks mentah
      innerBlock.content = payload;
    } else if (nodeObj.builder) {
      // 💡 FIX: Jika objek saat ini memiliki properti 'builder', 
      // JANGAN LAKUKAN KONVERSI REKURSIF pada content-nya! Biarkan payload data aslinya lewat secara utuh.
      innerBlock.content = payload;
    } else if (Array.isArray(payload)) {
      // Jika berupa array berisi anak-anak layout (iBasicNode[])
      const childLayoutObj: any = {};
      payload.forEach((childItem, index) => {
        const resolvedChild = resolveContentObj(childItem);
        const childKey = Object.keys(resolvedChild)[0];
        childLayoutObj[`${childKey}$child-${index}`] = resolvedChild[childKey];
      });
      innerBlock.content = childLayoutObj;
    } else if (typeof payload === "object" && payload !== null) {
      // Jika berupa objek tata letak standar tunggal tanpa builder
      innerBlock.content = resolveContentObj(payload);
    }
  }

  return result;
}



export class LandingPageBuilder {
  private container: HTMLElement;
  private shell: HTMLElement | null = null;
  private pages: Record<string, (iNodeContent<any> | iBasicNode)[]> = {};
  private currentRoute: string;
  private menuElement: HTMLElement | null = null;
  private footerElement: HTMLElement | null = null;
  private useMenu: boolean;
  private useFooter: boolean;
  private defaultRoute: string;
  private pendingFragment: string = "";

  // Core Render Engine
  private factory: DOMRenderer;
  private builder: BuilderRegistry | null;

  constructor(source: iLandingPageBuilderSource, config: iLandingPageBuilderConfig, builder: BuilderRegistry | null = null) {
    const resolved = typeof config.container === "string" ? document.querySelector(config.container) : config.container;
    if (!resolved || !(resolved instanceof HTMLElement)) {
      throw new Error("Target container not found.");
    }

    this.container = resolved;
    this.useMenu = config.useMenu ?? true;
    this.useFooter = config.useFooter ?? true;
    this.menuElement = source.menu ?? null;
    this.footerElement = source.footer ?? null;

    this.factory = new DOMRenderer(); // Instantiasi tunggal renderer abadi kita
    this.builder = builder;

    this.defaultRoute = this.normalizeRoute(config.defaultRoute || "home");
    this.pages = this.buildPages(source?.pages as any);

    const initialRoute = this.resolveRouteFromHash();
    this.currentRoute = initialRoute.route;
    this.pendingFragment = initialRoute.fragment;

    window.addEventListener("hashchange", this.handleHashChange);
  }

  /**
   * REFACTOR TOTAL: Metode render menjadi super pendek dan linear!
   */
  public render(route: string = this.currentRoute): void {
    if (!this.shell) {
      this.shell = document.createElement("main");
      this.shell.className = "page";
    }

    this.currentRoute = this.normalizeRoute(route);

    if (this.shell.parentElement !== this.container) {
      this.container.appendChild(this.shell);
    }

    const blocks = this.pages[this.currentRoute] || this.pages[this.defaultRoute] || [];
    this.shell.innerHTML = "";

    if (this.useMenu && this.menuElement) {
      this.shell.appendChild(this.menuElement);
    }

    blocks.forEach((block) => {
      let DOMSchema: iNodeContent<any>;

      // JEMBATAN OTOMATIS: Deteksi apakah block menggunakan format ramah pemula
      if ("tagName" in block || ("content" in block && !Object.keys(block)[0].includes('.'))) {
        // Jika ya, konversi otomatis menjadi format core engine di balik layar
        DOMSchema = resolveContentObj(block as iBasicNode);
      } else {
        // Jika tidak (berarti format string selector milik senior), langsung pakai
        DOMSchema = block as iNodeContent<any>;
      }

      // Jalankan render menggunakan core engine abadi
      const renderedBlock = this.factory.render(DOMSchema as any, this.builder);
      this.shell?.appendChild(renderedBlock);
    });

    if (this.useFooter && this.footerElement) {
      this.shell.appendChild(this.footerElement);
    }

    // Logika scroll pendingFragment bawaan Anda tetap konsisten berjalan di bawah ini...
    if (this.pendingFragment) {
      const fragment = this.pendingFragment;
      this.pendingFragment = "";
      window.requestAnimationFrame(() => {
        const target = document.getElementById(fragment);
        target?.scrollIntoView({ block: "start", behavior: "auto" });
      });
    }
  }

  public destroy(): void {
    window.removeEventListener("hashchange", this.handleHashChange);
    this.container.innerHTML = "";
  }

  // =============================
  //      Hash Route handler 
  // =============================
  private buildPages(pages: Record<string, iBasicNode[]>): Record<string, iBasicNode[]> {
    const resolved: Record<string, iBasicNode[]> = {};

    for (const [route, nodes] of Object.entries(pages)) {
      resolved[this.normalizeRoute(route)] = Array.isArray(nodes) ? [...nodes] : [];
    }

    if (!resolved[this.defaultRoute]) {
      const firstRoute = Object.keys(resolved)[0];
      if (firstRoute) {
        this.defaultRoute = firstRoute;
      } else {
        resolved[this.defaultRoute] = [];
      }
    }

    return resolved;
  }


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
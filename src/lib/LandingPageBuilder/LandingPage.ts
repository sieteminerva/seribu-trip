import { SectionBuilder } from "./Builders/Section";
import type { iLandingPageBuilderConfig, iLandingPageNode, iSectionHeader } from "./interface";

export class LandingPageBuilder {
  private container: HTMLElement;
  private shell: HTMLElement | null = null;
  private pages: Record<string, iLandingPageNode[]> = {};
  private currentRoute: string;
  private menuElement: HTMLElement | null = null;
  private footerElement: HTMLElement | null = null;
  private useMenu: boolean;
  private useFooter: boolean;
  private defaultRoute: string;
  private pendingFragment: string = "";

  constructor(content: iLandingPageNode[], config: iLandingPageBuilderConfig) {
    const resolved = typeof config.container === "string" ? document.querySelector(config.container) : config.container;
    if (!resolved || !(resolved instanceof HTMLElement)) {
      throw new Error("Target container not found.");
    }

    this.container = resolved;
    this.useMenu = config.useMenu ?? true;
    this.useFooter = config.useFooter ?? true;
    this.menuElement = config.menu ?? null;
    this.footerElement = config.footer ?? null;
    this.defaultRoute = this.normalizeRoute(config.defaultRoute || "home");
    this.pages = this.buildPages(content, config.pages);
    const initialRoute = this.resolveRouteFromHash();
    this.currentRoute = initialRoute.route;
    this.pendingFragment = initialRoute.fragment;

    window.addEventListener("hashchange", this.handleHashChange);
  }

  /**
   * Internal Method: Standardizes header elements consistently across all sections
   */
  private buildSectionHeader(headerData: iSectionHeader): HTMLElement {
    const headerEl = document.createElement("div");
    headerEl.className = headerData.className || "column";

    headerEl.innerHTML = `
      ${headerData.eyebrow ? `<p class="eyebrow">${headerData.eyebrow}</p>` : ""}
      ${headerData.title ? `<h2 class="title">${headerData.title}</h2>` : ""}
      ${headerData.description ? `<p class="description">${headerData.description}</p>` : ""}
    `;
    return headerEl;
  }

  private normalizeRoute(route: string): string {
    const resolved = route.trim().replace(/^#/, "");
    return resolved || "home";
  }

  private buildPages(content: iLandingPageNode[], pages?: Record<string, iLandingPageNode[]>): Record<string, iLandingPageNode[]> {
    const resolved: Record<string, iLandingPageNode[]> = {};

    if (pages) {
      for (const [route, nodes] of Object.entries(pages)) {
        resolved[this.normalizeRoute(route)] = Array.isArray(nodes) ? [...nodes] : [];
      }
    }

    if (!resolved[this.defaultRoute]) {
      resolved[this.defaultRoute] = Array.isArray(content) ? [...content] : [];
    }

    return resolved;
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

  private buildNode(node: iLandingPageNode, tagName = "section"): HTMLElement {
    if ("group" in node) {
      const element = document.createElement("section");
      element.id = node.id || "";
      element.className = node.className || "section row stackable";
      if (node.header) {
        element.append(this.buildSectionHeader(node.header));
      }
      for (const subNode of node.group) {
        element.appendChild(this.buildNode(subNode, "div"));
      }
      return element;
    }

    if (node.content instanceof HTMLElement) {
      if (node.header) {
        const wrapper = document.createElement("section");
        if (node.id) wrapper.id = node.id;
        if (node.className) wrapper.className = node.className;
        wrapper.append(this.buildSectionHeader(node.header), node.content);
        return wrapper;
      }
      return node.content;
    }

    const element = SectionBuilder.create(node.content as any, { tagName });
    if (node.header) {
      element.prepend(this.buildSectionHeader(node.header));
    }
    return element;
  }

  public render(route: string = this.currentRoute): void {
    if (!this.shell) {
      this.shell = document.createElement("main");
      this.shell.className = "page";
    }

    this.currentRoute = this.normalizeRoute(route);

    if (this.shell.parentElement !== this.container) {
      this.container.appendChild(this.shell);
    }

    const nodes = this.pages[this.normalizeRoute(route)] || this.pages[this.defaultRoute] || [];

    this.shell.innerHTML = "";
    if (this.useMenu && this.menuElement) {
      this.shell.appendChild(this.menuElement);
    }
    nodes.forEach((node) => this.shell?.appendChild(this.buildNode(node)));
    if (this.useFooter && this.footerElement) {
      this.shell.appendChild(this.footerElement);
    }

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

  public navigateTo(route: string): void {
    const normalized = this.normalizeRoute(route);
    const nextHash = `#${normalized}`;

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
      return;
    }

    this.syncRouteFromHash();
  }
}

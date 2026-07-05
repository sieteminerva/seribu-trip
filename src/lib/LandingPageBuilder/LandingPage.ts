import { SectionBuilder } from "./Builders/Section";
import type { iLandingPageBuilderConfig, iLandingPageNode, iSectionBlock, iSectionHeader } from "./interface";

export class LandingPageBuilder {
  private container: HTMLElement;
  private shell: HTMLElement | null = null;
  private nodes: iLandingPageNode[] = [];
  private menuElement: HTMLElement | null = null;
  private footerElement: HTMLElement | null = null;
  private useMenu: boolean;
  private useFooter: boolean;

  constructor(content: iLandingPageNode[], config: iLandingPageBuilderConfig) {
    const resolved = typeof config.container === 'string' ? document.querySelector(config.container) : config.container;
    if (!resolved || !(resolved instanceof HTMLElement)) {
      throw new Error("Target container not found.");
    }
    this.container = resolved;
    this.useMenu = config.useMenu ?? true;
    this.useFooter = config.useFooter ?? true;
    this.menuElement = config.menu ?? null;
    this.footerElement = config.footer ?? null;
    this.nodes = this.normalizeNodes(Array.isArray(content) ? [...content] : []);
  };

  /**
   * Internal Method: Standardizes header elements consistently across all sections
   */
  private buildSectionHeader(headerData: iSectionHeader): HTMLElement {
    const headerEl = document.createElement('div');
    headerEl.className = headerData.className || "column";

    headerEl.innerHTML = `
      ${headerData.eyebrow ? `<p class="eyebrow">${headerData.eyebrow}</p>` : ''}
      ${headerData.title ? `<h2 class="title">${headerData.title}</h2>` : ''}
      ${headerData.description ? `<p class="description">${headerData.description}</p>` : ''}
    `;
    return headerEl;
  }

  private isMenuNode(node: iLandingPageNode): boolean {
    return node.name.trim().toLowerCase() === "menu";
  }

  private isFooterNode(node: iLandingPageNode): boolean {
    return node.name.trim().toLowerCase() === "footer";
  }

  private normalizeNodes(nodes: iLandingPageNode[]): iLandingPageNode[] {
    const pageNodes: iLandingPageNode[] = [];

    for (const node of nodes) {
      if (this.useMenu && this.isMenuNode(node)) {
        if (!this.menuElement && ((node as iSectionBlock).content) instanceof HTMLElement) {
          this.menuElement = (node as iSectionBlock).content as HTMLElement;
        }
        continue;
      }

      if (this.useFooter && this.isFooterNode(node)) {
        if (!this.footerElement && (node as iSectionBlock).content instanceof HTMLElement) {
          this.footerElement = (node as iSectionBlock).content as HTMLElement;
        }
        continue;
      }

      pageNodes.push(node);
    }

    return pageNodes;
  }

  // private mountContent(payload: any, mountPoint: HTMLElement): void {
  //   // Array composition support if content contains multiple blocks
  //   if (Array.isArray(payload)) {
  //     payload.forEach(item => this.mountContent(item, mountPoint));
  //     return;
  //   }
  //   if (typeof payload === 'string') {
  //     mountPoint.innerHTML += payload.trim();
  //     return;
  //   }
  //   if (payload instanceof HTMLElement) {
  //     mountPoint.appendChild(payload);
  //     return;
  //   }
  //   if (payload && typeof payload === 'object' && 'builder' in payload) {
  //     // AppEngine.compile(mountPoint, payload);
  //     return;
  //   }
  // }


  private buildNode(node: iLandingPageNode, tagName = "section"): HTMLElement {
    if ('group' in node) {
      const element = document.createElement('section');
      element.id = node.id || '';
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
        const wrapper = document.createElement('section');
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

  public render(): void {
    if (!this.shell) {
      this.shell = document.createElement('main');
      this.shell.className = 'page';
    }

    if (this.shell.parentElement !== this.container) {
      this.container.appendChild(this.shell);
    }

    this.shell.innerHTML = '';
    if (this.useMenu && this.menuElement) {
      this.shell.appendChild(this.menuElement);
    }
    this.nodes.forEach(node => this.shell?.appendChild(this.buildNode(node)));
    if (this.useFooter && this.footerElement) {
      this.shell.appendChild(this.footerElement);
    }
  }

  public destroy() {
    this.container.innerHTML = ""
  }

  public switchPage(node: iLandingPageNode | iLandingPageNode[]): void {
    this.nodes = this.normalizeNodes(Array.isArray(node) ? [...node] : [node]);
    this.render();
  }

}

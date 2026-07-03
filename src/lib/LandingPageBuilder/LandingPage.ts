import { SectionBuilder } from "./Builders/Section";
import type { iLandingPageBuilderConfig, iLandingPageNode, iSectionHeader } from "./interface";

export class LandingPageBuilder {
  private container: HTMLElement;
  private nodes: iLandingPageNode[] = [];
  private config: iLandingPageBuilderConfig;

  constructor(content: iLandingPageNode[], config: iLandingPageBuilderConfig) {
    const resolved = typeof config.container === 'string' ? document.querySelector(config.container) : config.container;
    if (!resolved || !(resolved instanceof HTMLElement)) {
      throw new Error("Target container not found.");
    }
    this.container = resolved;
    this.config = { theme: 'light', allowCustomClasses: true, ...config };
    this.nodes = Array.isArray(content) ? [...content] : [];

    window.addEventListener('landing-page-theme-change', this._handleThemeChange);
    this._applyTheme(this.config.theme);
  }

  public setTheme(theme?: string | null): void {
    const resolvedTheme = this._normalizeTheme(theme);
    this.config.theme = resolvedTheme;
    this._applyTheme(resolvedTheme);
  }

  public getTheme(): string {
    return this.config.theme || 'light';
  }

  private _normalizeTheme(theme?: string | null): string {
    return theme?.toLowerCase() === 'dark' ? 'dark' : 'light';
  }

  private _applyTheme(theme: string | undefined): void {
    const resolvedTheme = this._normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.body.setAttribute('data-theme', resolvedTheme);
    this.container.setAttribute('data-theme', resolvedTheme);
    this.container.classList.toggle('theme-dark', resolvedTheme === 'dark');
  }

  private _handleThemeChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{ theme?: string }>;
    if (customEvent.detail?.theme) {
      this.setTheme(customEvent.detail.theme);
    }
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
    let element: HTMLElement | null = null;
    // 1. Check If it's a group node, recursively build its children and wrap them in a container
    if ('group' in node) {
      // console.log("1 called to buiid:", node.name)
      element = document.createElement('section');
      element.id = node.id || '';
      element.className = node.className || "section row stackable";
      for (const subNode of node.group) {
        // console.log('Building subNode:', subNode);
        element.appendChild(this.buildNode(subNode, "div"))
      }

    }
    else {
      // 2. If it's not a group node and has a section flag and its false, which indicates it should not be wrapped in a <section> element
      if ("isSection" in node && !node.isSection && node.content instanceof HTMLElement) {
        element = node.content;
        // console.log("2 called to buiid:", node.name)
      }
      else {
        // console.log({ element, node })
        if (node.content instanceof HTMLElement) {
          element = node.content;
          // console.log("3 called to buiid:", node.name)
        } else if (typeof node.content === 'object') {
          element = SectionBuilder.create(node.content as any, { tagName });
          // console.log("4 called to buiid:", node.name)
        }
        if (node.header) {
          if (!element) element = document.createElement('section');
          element.prepend(this.buildSectionHeader(node.header));
          // console.log("5 called to buiid:", node.name)
        }
      }
    }

    return element as HTMLElement;
  }

  public render(): void {
    this.container.innerHTML = '';
    const shell = document.createElement('main');
    shell.className = 'page';
    this.nodes.forEach(node => shell.appendChild(this.buildNode(node)));
    this.container.appendChild(shell);
  }



}
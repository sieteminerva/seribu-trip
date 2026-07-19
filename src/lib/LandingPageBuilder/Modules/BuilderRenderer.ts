import type { iBuilderRegistry, iBuilderConfig, iBasicNode } from "../interface";
import { TemplateRegistry, type TemplateHandler } from "./TemplateRegistry";

export interface iBuilder<T extends string = string> {
  readonly builderId: keyof iBuilderRegistry;
  readonly name: string;
  readonly stylesheet: string;
  config: Required<iBuilderConfig<T>>;
  create(content: iBasicNode, config?: Partial<iBuilderConfig<T>>): HTMLElement;
  initialize(root: HTMLElement): void;
}

/**
 * 🔒 KONTRAK INTERNAL SAKRAL (Hanya dikonsumsi oleh BuilderEngine)
 */
export interface iEngineHydrator<T extends string = string> {
  readonly defaultTemplate: TemplateHandler<T>;
  resolvePayload(content: iBasicNode): Record<T | string, any>;
  template(typeKey: T, el: HTMLElement, payload: any, selector: any): void;
}


/**
 * 👑 THE SOVEREIGN DEPENDENCY ENGINE
 * Stateless utility engine yang bertugas memproses siklus hidup rendering 
 * komponen mana pun murni via dependency injection.
 */
export class BuilderRenderer {

  /**
   * Consolidates default specifications with third-party configurations into a unified data structure,
   * performing an accurate deep-merge execution specifically isolated for selector dictionaries and HTML attributes.
   * 
   * @param defaultOptions - The structural default parameters including core properties and blueprint selectors.
   * @param userConfig - Incoming contextual overrides sent dynamically by themes or framework controllers.
   * @returns A strictly typed, fully populated configuration object ready for runtime ingestion.
   * @template C - Menangkap tipe Interface Config anak secara penuh (e.g. iMenuConfig)
   * @public
   */
  public static resolveConfig<C extends iBuilderConfig<any>>(
    defaultOptions: Required<C> | any,
    userConfig: Partial<C> = {}
  ): Required<C> {

    // 🧙‍♂️ THE MAGIC INFERENCE INJECTION (SOLUSI MUTLAK ANDA!)
    // Ekstrak tipe kunci selectors asli milik anak secara otomatis (keyof C["selectors"])
    // Tanpa perlu lagi mendeklarasikan parameter tipe T di kepala fungsi!
    type TargetKeys = keyof C["selectors"];

    const mergedSelectors = { ...(defaultOptions.selectors || {}) } as Record<TargetKeys, any>;

    if (userConfig.selectors) {
      Object.entries(userConfig.selectors).forEach(([key, selectorValue]) => {
        if (selectorValue && typeof selectorValue === "object") {
          // Las dan timpa kuncinya dengan casting dinamis yang selamat mengunci tipe TargetKeys
          mergedSelectors[key as TargetKeys] = {
            ...(mergedSelectors[key as TargetKeys] || {}),
            ...selectorValue,
            attrs: {
              ...((mergedSelectors[key as TargetKeys] || {}).attrs || {}),
              ...((selectorValue as any).attrs || {})
            }
          };
        }
      });
    }

    return {
      ...defaultOptions,
      ...userConfig,
      selectors: mergedSelectors
    } as Required<C>;
  }

  /**
   * Universal Compiler Gateway that executes the 5-phase lifecycle stream on any given builder contract.
   */
  public static compile(builder: iBuilder<any> & iEngineHydrator<any>, content: iBasicNode): HTMLElement {
    const rootSelectorKey = `@${String(builder.builderId)}`;

    if (!content || typeof content !== "object") {
      return document.createElement(builder.config.selectors[rootSelectorKey]?.tagName || "div");
    }

    // Phase 1: Create flat HTMLElement dictionary
    const renderedNodes = this.renderElements(builder);

    // Phase 2: Assemble DOM Tree Hierarchy
    this.attachHierarchy(renderedNodes);

    // Phase 3: Hydrate content and resolve cascading template overrides
    this.hydrate(builder, renderedNodes, content);

    const rootElement = renderedNodes.get(rootSelectorKey) as HTMLElement;

    // Phase 4: Emit Genesis report
    this.emitElements(builder, renderedNodes, content);

    // Phase 5: Bind interaction event listeners
    builder.initialize(rootElement);

    return rootElement;
  }

  private static renderElements(builder: iBuilder<any>): Map<string, HTMLElement> {
    const renderedNodes = new Map<string, HTMLElement>();

    Object.entries(builder.config.selectors).forEach(([key, selector]: [string, any]) => {
      const pathParts = key.split(">");
      if (pathParts.length > 1) {
        const parentKey = pathParts.slice(0, -1).join(">");
        const parentSelector = builder.config.selectors[parentKey];
        if (parentSelector && parentSelector.isArray) return;
      }

      const el = document.createElement(selector.tagName || "div");
      if (selector.id) el.id = selector.id;
      if (selector.className) el.className = selector.className;
      if (selector.innerHTML) el.innerHTML = selector.innerHTML;

      if (selector.attrs) {
        Object.entries(selector.attrs).forEach(([aKey, aValue]) => el.setAttribute(aKey, String(aValue)));
      }

      renderedNodes.set(key, el);
    });

    return renderedNodes;
  }

  private static attachHierarchy(renderedNodes: Map<string, HTMLElement>): void {
    renderedNodes.forEach((el, key) => {
      const pathParts = key.split(">");
      if (pathParts.length > 1) {
        const parentKey = pathParts.slice(0, -1).join(">");
        renderedNodes.get(parentKey)?.appendChild(el);
      }
    });
  }

  private static hydrate(builder: iBuilder<any> & iEngineHydrator<any>, renderedNodes: Map<string, HTMLElement>, content: any): void {
    const payloadMap = builder.resolvePayload(content);

    const activeLiveThemeId = document.documentElement.dataset.theme?.replace(/^theme-/, "")
      || document.body.dataset.theme?.replace(/^theme-/, "")
      || "default";

    renderedNodes.forEach((el, key) => {
      const selector = builder.config.selectors[key];
      const payloadData = payloadMap[key];

      if (selector && selector.isArray) {
        const childTemplateKey = `${key}>item`;
        const itemTemplateSelector = builder.config.selectors[childTemplateKey];
        const dataItemsArray = Array.isArray(payloadData) ? payloadData : [];

        dataItemsArray.forEach((itemData) => {
          const childEl = document.createElement(itemTemplateSelector?.tagName ?? "div");
          if (itemTemplateSelector.className) childEl.className = itemTemplateSelector.className;
          if (itemTemplateSelector.attrs) {
            Object.entries(itemTemplateSelector.attrs).forEach(([k, v]) => childEl.setAttribute(k, String(v)));
          }

          // Panggil Cascade Resolver secara stateless
          const activeHandler = TemplateRegistry.resolve(activeLiveThemeId, childTemplateKey, builder.defaultTemplate);
          activeHandler(childTemplateKey, childEl, itemData, itemTemplateSelector);

          el.appendChild(childEl);
        });
      }
      else {
        const activeHandler = TemplateRegistry.resolve(activeLiveThemeId, key, builder.defaultTemplate);
        activeHandler(key, el, payloadData, selector);
      }
    });
  }

  private static emitElements(builder: iBuilder<any> & iEngineHydrator<any>, renderedNodes: Map<string, HTMLElement>, rawDataNode: any): void {
    renderedNodes.forEach((el, key) => {
      builder.config.emit?.("elementAdded", {
        builder: builder.builderId, type: key, element: el, data: rawDataNode
      });
    });
  }
}

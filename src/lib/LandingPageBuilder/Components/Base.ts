// Modules/BuilderBase.ts (The Definitive Abstract Generic Master Engine)
import type { iBuilderConfig, iBuilderRegistry } from "../interface";
import { TemplateRegistry, type TemplateHandler } from "../Modules/TemplateRegistry";


export abstract class Builder {
  // Kontrak identitas wajib yang harus disuplai oleh setiap kelas anak
  abstract readonly builderId: keyof iBuilderRegistry;
  abstract readonly name: string;
  abstract readonly stylesheet: string;
  public abstract readonly config: Required<iBuilderConfig>;

  protected abstract rawDataNode: any;
  protected abstract readonly defaultTemplate: TemplateHandler;

  // ====================================================
  // 👑 1. THE UNIFORM LIFECYCLE PIPELINE (100% GENERIC & LOCKED)
  // Tidak boleh di-override oleh kelas anak karena merupakan alur suci framework!
  // ====================================================
  public create(content: any): HTMLElement {
    const rootSelectorKey = `@${String(this.builderId)}`;
    if (!content || typeof content !== "object") {
      return document.createElement(this.config.selectors[rootSelectorKey]?.tagName || "div");
    }

    this.rawDataNode = content;

    // Eksekusi rantai 5 pipa daur hidup secara berurutan secepat cahaya!
    const renderedNodes = this.createElements();
    this.attachHierarchy(renderedNodes);
    this.hydrate(renderedNodes, content);

    const rootElement = renderedNodes.get(rootSelectorKey) as HTMLElement;
    this.emitElements(renderedNodes);

    // Pemicu akhir pengikatan event runtime lokal milik masing-masing builder
    this.initialize(rootElement);

    return rootElement;
  }

  // ====================================================
  // 🧱 2. GENERIC WORKER METHODS (WARISAN GRATIS UNTUK ANK-ANAK BUILDER)
  // ====================================================

  /**
   * Murni mekanis: Membaca selectors registry dan mencetak HTMLElement statis
   */
  protected createElements(): Map<string, HTMLElement> {
    const renderedNodes = new Map<string, HTMLElement>();
    // const rootSelectorKey = `@${String(this.builderId)}`;

    Object.entries(this.config.selectors).forEach(([key, selector]: [string, any]) => {
      // Aturan No 6: Lewatkan template anak loop dinamis multi-instance dari Phase 1
      if (key.endsWith(">item") || selector.isArrayItem) return;

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

  /**
   * Murni mekanis: Merakit silsilah rantai pohon DOM berdasarkan tanda pembelahan '>'
   */
  protected attachHierarchy(renderedNodes: Map<string, HTMLElement>): void {
    renderedNodes.forEach((el, key) => {
      const pathParts = key.split(">");
      if (pathParts.length > 1) {
        const parentKey = pathParts.slice(0, -1).join(">");
        renderedNodes.get(parentKey)?.appendChild(el);
      }
    });
  }

  /**
   * Murni mekanis: Menyiarkan status kelahiran seluruh elemen ke pusat orkestrator terpusat
   */
  protected emitElements(renderedNodes: Map<string, HTMLElement>): void {
    renderedNodes.forEach((el, key) => {
      this.config.emit?.("elementAdded", {
        builder: this.builderId,
        type: key,
        element: el,
        data: this.rawDataNode
      });
    });
  }

  /**
   * Murni mekanis: Pengalir data yang memicu TemplateRegistry resolution secara cascading
   */
  protected hydrate(renderedNodes: Map<string, HTMLElement>, content: any): void {
    const payloadMap = this.resolvePayload(content);

    // Deteksi identitas tema live dari level dataset dokumen HTML terluar secara real-time
    const activeLiveThemeId = this.config.themeId
      || document.documentElement.dataset.theme?.replace(/^theme-/, "")
      || document.body.dataset.theme?.replace(/^theme-/, "")
      || "default";

    renderedNodes.forEach((el, key) => {
      const selector = this.config.selectors[key];
      const payloadData = payloadMap[key];

      // KONDISI LOOP MULTI-INSTANCE DINAMIS (ARRAY SEKSIONS)
      if (selector && (selector as any).isArray) {
        const childTemplateKey = `${key}>item`;
        const itemTemplateSelector = this.config.selectors[childTemplateKey];
        const dataItemsArray = Array.isArray(payloadData) ? payloadData : [];

        dataItemsArray.forEach((itemData) => {
          const childEl = document.createElement(itemTemplateSelector.tagName || "div");
          if (itemTemplateSelector.className) childEl.className = itemTemplateSelector.className;
          if (itemTemplateSelector.attrs) {
            Object.entries(itemTemplateSelector.attrs).forEach(([k, v]) => childEl.setAttribute(k, String(v)));
          }

          const activeHandler = TemplateRegistry.resolve(activeLiveThemeId, childTemplateKey, this.defaultTemplate);
          activeHandler(childTemplateKey, childEl, itemData, itemTemplateSelector);

          el.appendChild(childEl);
        });
      }
      // KONDISI ELEMEN TUNGGAL STANDARD
      else {
        const activeHandler = TemplateRegistry.resolve(activeLiveThemeId, key, this.defaultTemplate);
        activeHandler(key, el, payloadData, selector);
      }
    });
  }

  // ====================================================
  // 🔮 3. ABSTRACT HOOKS (WAJIB DI-OVERRIDE / DIISI OLEH KELAS ANAK)
  // ====================================================

  protected abstract resolvePayload(content: any): Record<string, any>;
  protected abstract template(typeKey: string, el: HTMLElement, payload: any, selector: any): void;
  public abstract initialize(root: HTMLElement): void;
}

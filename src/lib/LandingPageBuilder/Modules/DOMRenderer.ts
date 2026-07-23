
import type { DefaultSelectors, iBuilderRegistry, iNodeContent } from "../interface";
import { TemplateRegistry } from "./TemplateRegistry";

export class DOMRenderer<
  C extends Partial<any> = {},
  S extends string = DefaultSelectors
> {
  config!: any;
  private cleanupMap = new Map<HTMLElement, (element: HTMLElement) => void>();

  constructor(config?: C) {
    const defaultConfig: any = {
      selectors: {
        grid: { tagName: 'div', isClass: true, name: 'grid', className: 'grid' },
        row: { tagName: 'div', isClass: true, name: 'row', className: 'row' },
        column: { tagName: 'div', isClass: true, name: 'column', className: 'column' }
      },
      separator: { id: '#', class: '.', ignored: '$', include: '-' }
    };

    this.config = {
      ...defaultConfig,
      ...config,
      selectors: { ...defaultConfig.selectors, ...config?.selectors }
    };
  }

  private parseKey(key: string): { id?: string; classNames: string[]; baseName: string; parsedAttrs: Record<string, string> } {
    const { id: idSep, class: classSep, ignored } = this.config.separator;

    // 1. Clean the key string from the ignored token delimiter ($) if present
    let cleanKey = key.includes(ignored) ? key.split(ignored)[0] : key;

    const parsedAttrs: Record<string, string> = {};

    // ====================================================
    // 🧙‍♂️ THE ATTRIBUTE BRACKET EXTRACTOR (SIHIR REGEX PILIHAN JENIUS ANDA!)
    // Mendeteksi dan memeras semua pola [attr='value'] atau [attr="value"] di dalam key string
    // ====================================================
    const attrRegex = /\[\s*([a-zA-Z0-8_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(cleanKey)) !== null) {
      const attrName = attrMatch[1];
      const attrValue = attrMatch[2];
      parsedAttrs[attrName] = attrValue;
    }

    // Bersihkan seluruh blok kurung siku [...] dari key utama agar tidak mengacaukan parsing ID dan Class
    cleanKey = cleanKey.replace(/\[[^\]]*\]/g, '');

    // Escape karakter separator untuk RegEx
    const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 2. Ambil Base Name / Tag Name (Karakter di awal sebelum bertemu # atau .)
    const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
    let baseName = baseNameMatch ? baseNameMatch[1] : 'div';

    // 3. Ambil ID secara presisi (Karakter setelah # sebelum bertemu . atau [ berikutnya)
    const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
    const id = idMatch ? idMatch[1] : undefined;

    // 4. Ambil Semua Class Names secara berulang (Semua karakter setelah tanda titik)
    const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, 'g');
    let classNames: string[] = [];
    let match;
    while ((match = classRegex.exec(cleanKey)) !== null as any) {
      classNames.push((match as any)[1]);
    }

    return {
      id,
      classNames,
      baseName: baseName.replace(/-/g, ' '),
      parsedAttrs
    };
  }

  // ====================================================
  // 👑 PIPELINE MASTER HUB (THE 5-PHASE SEPARATION ARCHITECTURE)
  // ====================================================

  /**
   * Main compilation gateway that transforms declarative iNodeContent schemas into live DOM trees.
   */
  public render(
    content: iNodeContent<S>,
    renderFn: (node: any) => HTMLElement | null,
    builderFn: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null
  ): HTMLElement {
    const fragment = document.createDocumentFragment();

    this.buildStructure(content, fragment, renderFn, builderFn);

    if (fragment.childNodes.length === 1 && fragment.firstChild instanceof HTMLElement) {
      return fragment.firstChild;
    }

    const rootElement = document.createElement('div');
    rootElement.appendChild(fragment);
    return (rootElement.firstElementChild as HTMLElement) || rootElement;
  }



  private buildStructure(
    structure: any,
    parentNode: HTMLElement | DocumentFragment,
    renderFn?: (node: any) => HTMLElement | null,
    builderFn?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null
  ): void {

    // 💡 PENAMPUNG STORAGE ELEMEN HIDUP UNTUK PASUKAN STRUKTUR FLAT DENGAN TOKEN '>'
    const flatNodesMap = new Map<string, HTMLElement>();

    for (const [key, value] of Object.entries(structure)) {
      if (!value || typeof value !== 'object') continue;

      // ====================================================
      // 🧙‍♂️ THE HOLY CASCADING HIERARCHY ABSORBER (IDE BERLIAN ANDA!)
      // Jika kunci mengandung tanda '>', belah stringnya menggunakan tanda '>' !
      // ====================================================
      const pathParts = key.split(">");
      const isHierarchicalKey = pathParts.length > 1;

      // Ambil kunci asli paling ekor untuk di-parse tag/class/id-nya oleh parseKey()
      const cleanKeyForParsing = isHierarchicalKey ? pathParts[pathParts.length - 1] : key;
      const { id, classNames, baseName, parsedAttrs } = this.parseKey(cleanKeyForParsing);

      // 🚨 ATURAN SAKRAL MULTI-INSTANCE DIRECTIVE:
      // Jika induk dari token ini bertanda array loop, abaikan pencetakan statis di hulu!
      if (isHierarchicalKey) {
        const parentPathKey = pathParts.slice(0, -1).join(">");
        const parentValue = structure[parentPathKey];
        if (parentValue && (parentValue.isArray || key.includes("$isArray"))) continue;
      }

      // Phase 1: 🏗️ NODE FACTORY
      const currentElement = this.nodeFactory(baseName, value);

      // Phase 2: 🧱 ATTRIBUTE PROCESSOR
      this.attributeProcessor(currentElement, value, id, classNames, parsedAttrs);

      // Phase 3: 🔒 LIFECYCLE MANAGER
      this.lifecycleManager(currentElement, value, renderFn, builderFn);

      // Phase 4: 🧙‍♂️ CONTENT EVALUATOR
      this.contentEvaluator(currentElement, value, renderFn, builderFn);

      // Amankan pointer reference elemen hidup ke dalam map lokal selama siklus loop berjalan
      flatNodesMap.set(key, currentElement);

      // ====================================================
      // 🔮 ABAKADABRA AUTOMATED NESTED APPEND (PENYERAPAN TOTAL BUILDERBASE!)
      // Jika dia adalah kunci hierarki '>', temukan induknya di Map, lalu langsung tempelkan!
      // ====================================================
      if (isHierarchicalKey) {
        const parentPathKey = pathParts.slice(0, -1).join(">");
        const parentElement = flatNodesMap.get(parentPathKey);

        if (parentElement) {
          parentElement.appendChild(currentElement);
          continue; // Keluar, tidak perlu menempel ke parentNode terluar!
        }
      }

      // Phase 5: RECURSIVE NESTED KEYS TRAVERSAL (Untuk format objek bersarang bawaan DOMRenderer asli)
      const reservedKeys = ['content', 'onCreated', 'onDestroy', 'builder', 'attrs', 'isRoot', 'isArray'];
      const childKeys = Object.keys(value).filter(k => !reservedKeys.includes(k));

      if (childKeys.length > 0) {
        const subFragment = document.createDocumentFragment();
        const childStructure: any = {};
        for (const childKey of childKeys) {
          childStructure[childKey] = (value as any)[childKey];
        }
        this.buildStructure(childStructure, subFragment, renderFn, builderFn);
        currentElement.appendChild(subFragment);
      }

      // Jika bukan anak hierarki (alias root container), tempelkan ke parentNode utama
      parentNode.appendChild(currentElement);
    }
  }

  // ====================================================
  // 🧱 PIPI KHUSUS SUB-ROUTINES LIFECYCLE POS KEMENTERIAN INDEPENDEN
  // ====================================================

  /**
   * Phase 1: Spawns clean HTMLElement instances or intercepts live hijacked nodes.
   */
  private nodeFactory(baseName: string, value: any): HTMLElement {
    if (value.content instanceof HTMLElement) {
      return value.content;
    }

    return baseName ? document.createElement(baseName) : document.createElement('div');
  }

  /**
   * Phase 2: Stamps IDs, classNames list, and handles custom inline data attributes dictionary.
   */
  private attributeProcessor(el: HTMLElement, value: any, id: string | undefined, classNames: string[], parsedAttrs: Record<string, string>): void {
    if (id && !el.id) el.id = id;

    if (classNames.length > 0) {
      const existingClasses = el.className ? el.className.trim().split(/\s+/) : [];
      const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
      el.className = Array.from(combinedClasses).join(' ');
    }

    // ====================================================
    // 🔮 THE HYBRID BLENDING PIPELINE (PUNCAK EFEKTIVITAS SATU ATAP!)
    // Melebur atribut hasil kupasan dari String Key DAN objek property 'attrs' deklaratif
    // ====================================================

    // 💡 Aliran A: Las atribut hantaran hasil kupasan dari kurung siku key string
    Object.entries(parsedAttrs).forEach(([aName, aValue]) => {
      el.setAttribute(aName, String(aValue));
    });

    // 💡 Aliran B: Las atribut dinamis dari properti 'attrs' bawaan Sheets (menimpa jika ada benturan kunci)
    if (value.attrs && typeof value.attrs === 'object') {
      Object.entries(value.attrs).forEach(([aName, aValue]) => {
        el.setAttribute(aName, String(aValue));
      });
    }
  }

  /**
   * Phase 3: Triggers onCreated lifecycle bindings securely via sandbox proxies closures.
   */
  private lifecycleManager(
    el: HTMLElement,
    value: any,
    renderFn?: (node: any) => HTMLElement | null,
    builderFnArgs?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null
  ): void {
    if (typeof value.onCreated === 'function') {
      const renderProxy = (schema: any): HTMLElement | null => {
        return renderFn ? renderFn(schema) : null;
      };

      const builderProxy = (name: keyof iBuilderRegistry, data: any): any => {
        return builderFnArgs ? builderFnArgs(name, data) : null;
      };


      const templateProxy = {
        /**
         * Mengizinkan komponen mendaftarkan fungsi template override secara manual dari dalam onCreated
         */
        register: (id: string, handler: any) => {
          if (TemplateRegistry && typeof TemplateRegistry.register === "function") {
            console.log(`[DOMRenderer Lifecycle] Manual template registration triggered for token: "${id}"`);
            TemplateRegistry.register(id, handler);
          }
        },
        /**
         * Mengizinkan komponen mencabut fungsi template miliknya saat unmount jika dibutuhkan
         */
        unregister: (id: string) => {
          if (TemplateRegistry && typeof TemplateRegistry.unregister === "function") {
            TemplateRegistry.unregister(id);
          }
        }
      };

      value.onCreated(el, renderProxy, builderProxy, templateProxy);
    }

    if (typeof value.onDestroy === 'function') {
      this.cleanupMap.set(el, value.onDestroy);
    }
  }

  /**
   * Phase 4: Hydrates the inner content node chambers dynamically using polymorphic sniffing.
   */
  private contentEvaluator(
    el: HTMLElement,
    value: any,
    renderFn?: (node: any) => HTMLElement | null,
    builderFn?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null
  ): void {
    if (value.content === undefined) return;
    if (value.builder) {
      return;
    }
    const nodePayload = value.content;
    // console.log({ nodePayload }) // <= ini malah betul masing-masing 1x
    if (nodePayload instanceof Node) {
      if (nodePayload !== el && !el.contains(nodePayload)) {
        el.appendChild(nodePayload);
      }
    }
    else if (Array.isArray(nodePayload)) {
      const subFragment = document.createDocumentFragment();
      nodePayload.forEach((childItem) => {
        if (childItem && typeof childItem === "object") {
          this.buildStructure(childItem, subFragment, renderFn, builderFn);
        }
      });
      el.appendChild(subFragment);
    }
    else if (typeof nodePayload === 'object' && nodePayload !== null) {
      const subFragment = document.createDocumentFragment();
      this.buildStructure(nodePayload, subFragment, renderFn, builderFn);
      el.appendChild(subFragment);
    }
    else {
      el.innerHTML = String(nodePayload);
    }
  }

  /**
   * Safe Destroy Method: Unmounts an element tree from the DOM and recursively executes cleanup hooks.
   */
  public unmount(targetElement: HTMLElement): void {
    this.cleanupMap.forEach((onDestroyFn, element) => {
      if (targetElement.contains(element) || targetElement === element) {
        try {
          onDestroyFn(element);
        } catch (error) {
          console.error("Failed to execute onDestroy lifecycle hook:", error);
        }
        this.cleanupMap.delete(element);
      }
    });

    if (targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}
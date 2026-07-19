
import type { DefaultSelectors, iBuilderRegistry, iNodeContent } from "../interface";
import { TemplateRegistry } from "./TemplateRegistry";

export class DOMRendererLegacy<
  C extends Partial<any> = {},
  S extends string = DefaultSelectors
> {
  config!: any;

  private cleanupMap = new Map<HTMLElement, (element: HTMLElement) => void>();
  // ... Kode constructor, parseKey, dan render tetap sama seperti LayoutRenderer sebelumnya
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

  private parseKey(key: string): { id?: string; classNames: string[]; baseName: string } {
    const { id: idSep, class: classSep, ignored } = this.config.separator;

    // 1. Buang bagian setelah tanda ignored ($) jika ada
    let cleanKey = key;
    if (key.includes(ignored)) {
      cleanKey = key.split(ignored)[0];
    }

    // Escape karakter separator untuk RegEx jika berupa karakter khusus (seperti titik atau pagar)
    const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 2. Ambil Base Name / Tag Name (Karakter apa saja di awal sebelum bertemu # atau .)
    const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
    let baseName = baseNameMatch ? baseNameMatch[1] : 'div';

    // 3. Ambil ID secara presisi (Karakter setelah # sebelum bertemu . berikutnya)
    const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
    const id = idMatch ? idMatch[1] : undefined;

    // 4. Ambil Semua Class Names secara berulang (Semua karakter setelah tanda titik)
    const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, 'g');
    const classNames: string[] = [];
    let match;
    while ((match = classRegex.exec(cleanKey)) !== null) {
      classNames.push(match[1]);
    }

    // Normalisasi nama dasar jika ada tanda hubung kustom bawaan konfigurasi lama Anda
    baseName = baseName.replace(/-/g, ' ');

    return { id, classNames, baseName };
  }

  public render(
    content: iNodeContent<S>,
    renderFn: (node: any) => HTMLElement | null,
    builderFn: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null): HTMLElement {

    // console.log({ builderFn })

    const fragment = document.createDocumentFragment();

    this.buildStructure(content, fragment, renderFn, builderFn)
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
    builderFn?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null): void {

    for (const [key, value] of Object.entries(structure)) {
      if (!value || typeof value !== 'object') continue;

      const { id, classNames, baseName } = this.parseKey(key);
      let currentElement: HTMLElement;

      // FASE A: Jalur Pembajakan HTMLElement Hidup hasil muntahan `.compile()` luar
      if ((value as any).content instanceof HTMLElement) {
        currentElement = (value as any).content;
      } else {
        currentElement = document.createElement(baseName || 'div');
      }

      // FASE B: Proses Peleburan Atribut, Kelas, dan onCreated (Tetap Sinkronus)
      if (id && !currentElement.id) currentElement.id = id;

      this._processLifecycleAndAttributes(currentElement, value, id as string, classNames, renderFn as any, builderFn as any);

      // ====================================================
      // 👑 DI SINI TEMPAT DIEKSEKUSINYA METODE TERSEBUT!
      // ====================================================
      // Langkah 3: Evaluasi Konten Elemen HTML/Template biasa dijalankan 
      // tepat sebelum mesin melakukan pengecekan Rekursi Key Bersarang (. atau #)
      this._evaluateContentNode(currentElement, value, renderFn, builderFn);

      // Langkah 4: Rekursi Key Bersarang Advanced (.title atau #id)
      const reservedKeys = ['content', 'onCreated', 'onDestroy', 'builder', 'attrs', 'isRoot'];
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

      // Tempelkan elemen matang ke parent tree
      parentNode.appendChild(currentElement);
    }
  }

  /**
   * 🧱 SUB-ROUTINE 2: Eksekusi Pengisian Konten Rahim Elemen (100% Suci & Mandiri)
   */
  private _evaluateContentNode(
    el: HTMLElement,
    value: any,
    renderFn?: (node: any) => HTMLElement | null,
    builderFn?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null): void {

    if (value.content === undefined) return;
    const nodePayload = value.content;

    // Jika content berupa Node fisik browser (Kasus A hantaran dari .compile() luar)
    if (nodePayload instanceof Node) {
      if (nodePayload !== el && !el.contains(nodePayload)) {
        el.appendChild(nodePayload);
      }
    }
    // Jika content berupa Array objek data (Kasus Group/Kolom bersarang)
    else if (Array.isArray(nodePayload)) {
      const subFragment = document.createDocumentFragment();
      nodePayload.forEach((childItem) => {
        if (childItem && typeof childItem === "object") {
          // Terus putar hierarki secara linear mematuhi format iNodeContent yang sah!
          this.buildStructure(childItem, subFragment, renderFn, builderFn);
        }
      });
      el.appendChild(subFragment);
    }
    // Jika content berupa Objek bersarang biasa
    else if (typeof nodePayload === 'object' && nodePayload !== null) {
      const subFragment = document.createDocumentFragment();
      this.buildStructure(nodePayload, subFragment, renderFn, builderFn);
      el.appendChild(subFragment);
    }
    // Jika content berupa teks string / HTML template murni biasa
    else {
      el.innerHTML = String(nodePayload);
    }
  }


  private _processLifecycleAndAttributes(
    el: HTMLElement,
    value: any,
    id: string,
    classNames: string[],
    compileFn?: (node: any) => HTMLElement | null,
    builderFnArgs?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null,
  ): void {
    if (id && !el.id) el.id = id;

    if (classNames.length > 0) {
      const existingClasses = el.className ? el.className.trim().split(/\s+/) : [];
      const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
      el.className = Array.from(combinedClasses).join(' ');
    }

    if (value.attrs && typeof value.attrs === 'object') {
      for (const [aName, aValue] of Object.entries(value.attrs)) {
        el.setAttribute(aName, String(aValue));
      }
    }

    // ====================================================
    // 🧙‍♂️ PUSAT INJEKSI PARAMETER KEDUA ONCREATED (SUCI & BERSIH!)
    // ====================================================
    if (typeof value.onCreated === 'function') {
      // Sediakan fungsi trigger lokal yang kebal terhadap pembajakan konteks 'this'
      const renderFn = (schema: any): HTMLElement | null => {
        return compileFn ? compileFn(schema) : null;
      };

      const builderFn = (name: keyof iBuilderRegistry, data: any): any => {
        return builderFnArgs ? builderFnArgs(name, data) : null;
      };

      // Tembakkan callback! Sekarang user bisa mengakses parameter kedua: render()
      value.onCreated(el, renderFn, builderFn);
    }
  }



  /**
   * Safe Destroy Method: Call this to unmount a layout element tree from the DOM.
   * It will recursively trigger onDestroy hooks to prevent memory leaks.
   */
  public unmount(targetElement: HTMLElement) {
    // 1. Scan all child elements inside the target that have registered cleanup hooks
    this.cleanupMap.forEach((onDestroyFn, element) => {
      if (targetElement.contains(element) || targetElement === element) {
        try {
          onDestroyFn(element);
        } catch (error) {
          console.error("Failed to execute onDestroy lifecycle hook:", error);
        }
        this.cleanupMap.delete(element); // Remove from memory tracking
      }
    });

    // 2. Safely remove the element from the live DOM tree
    if (targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}


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

  private parseKey(key: string): { id?: string; classNames: string[]; baseName: string } {
    const { id: idSep, class: classSep, ignored } = this.config.separator;
    let cleanKey = key.includes(ignored) ? key.split(ignored)[0] : key;

    const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
    let baseName = baseNameMatch ? baseNameMatch[1] : 'div';

    const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
    const id = idMatch ? idMatch[1] : undefined;

    const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, 'g');
    const classNames: string[] = [];
    let match;
    while ((match = classRegex.exec(cleanKey)) !== null) {
      classNames.push(match[1]);
    }

    return { id, classNames, baseName: baseName.replace(/-/g, ' ') };
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

  private buildStructure2(
    structure: any,
    parentNode: HTMLElement | DocumentFragment,
    renderFn?: (node: any) => HTMLElement | null,
    builderFn?: (name: keyof iBuilderRegistry, data: any) => HTMLElement | null
  ): void {

    for (const [key, value] of Object.entries(structure)) {
      if (!value || typeof value !== 'object') continue;

      const { id, classNames, baseName } = this.parseKey(key);

      // Phase 1: 🏗️ NODE FACTORY (Melahirkan elemen fisik atau menjemput hantaran luar)
      const currentElement = this.nodeFactory(baseName, value);

      // Phase 2: 🧱 ATTRIBUTE PROCESSOR (Penyiraman ID, Class, dan Custom Attrs)
      this.attributeProcessor(currentElement, value, id, classNames);

      // Phase 3: 🔒 LIFECYCLE MANAGER (Penanganan OnCreated & Callback Emitters)
      this.lifecycleManager(currentElement, value, renderFn, builderFn);

      // Phase 4: 🧙‍♂️ CONTENT EVALUATOR (Pengisian Rahim Internal Konten)
      this.contentEvaluator(currentElement, value, renderFn, builderFn);

      // Phase 5: RECURSIVE NESTED KEYS TRAVERSAL (Penyisiran Kunci Anak)
      const reservedKeys = ['content', 'onCreated', 'onDestroy', 'builder', 'attrs', 'isRoot'];
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

      parentNode.appendChild(currentElement);
    }
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
      const { id, classNames, baseName } = this.parseKey(cleanKeyForParsing);

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
      this.attributeProcessor(currentElement, value, id, classNames);

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
    return document.createElement(baseName || 'div');
  }

  /**
   * Phase 2: Stamps IDs, classNames list, and handles custom inline data attributes dictionary.
   */
  private attributeProcessor(el: HTMLElement, value: any, id: string | undefined, classNames: string[]): void {
    if (id && !el.id) el.id = id;

    if (classNames.length > 0) {
      const existingClasses = el.className ? el.className.trim().split(/\s+/) : [];
      const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
      el.className = Array.from(combinedClasses).join(' ');
    }

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
    const nodePayload = value.content;

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
import type { iBuilderRegistry, iBuilderConfig, iElementProperty, iActionProperty, iBasicNode } from "../interface";
import { TemplateRegistry } from "../Modules/TemplateRegistry";

declare global {
  interface HTMLElement {
    outer?: HTMLElement;
    inner?: HTMLElement;
  }
}
/**
 * Abstract Core Base Class representing the definitive declarative rendering engine blueprint.
 * Orchestrates a unidirectional 5-Phase lifecycle execution stream to parse configurations,
 * traverse hierarchical tree registries, mutate content templates, and emit runtime state safely.
 * 
 * @template TType - A strict string literal union constraining the allowed sub-element tokens for the child component.
 * 
 * @author YMGH
 * @version 1.0.0
 */
export abstract class Builder<TType extends string = string, TConfig extends iBuilderConfig<TType> = iBuilderConfig<TType>> {

  /**
   * The distinct, unique registry identifier allocated to the specific component subclass.
   */
  abstract readonly builderId: keyof iBuilderRegistry;

  /**
   * The human-readable name string designated to characterize the component wrapper class.
   */
  abstract readonly name: keyof iBuilderRegistry;

  /**
   * The file path pointer target referencing the isolated CSS stylesheet asset assigned to this module.
   */
  abstract readonly stylesheet: string;

  /**
   * The frozen state configuration container holding consolidated options, emitters, and structural selectors.
   */
  public config!: Required<TConfig>;

  /**
   * Internal reference holder pointing directly to the raw, unmutated data node extracted from the spreadsheet database.
   */

  #nodes = new Map<TType | string, { element: HTMLElement | HTMLElement[]; payload: any }>();

  protected activeLiveThemeId: string = "default";

  constructor() { }

  /**
   * 👑 THE SEPARATED HYDRATION VALVE (POS KEMENTERIAN PENGISIAN RAHIM DATA)
   * Murni hanya mengurusi penyemprotan teks data spesifik atomik, 
   * terisolasi penuh, rapi, dan kebal dari bug hantu selamanya!
   */
  protected abstract template(typeKey: TType, el: HTMLElement, payload?: any): void;

  /**
   * The public sovereign compiler gateway orchestrating the complete DOM node creation lifecycle stream.
   * Processes input data through a rigid 5-Phase pipeline, returning a live, fully-hydrated HTMLElement.
   * 
   * @param content - The raw payload structural object delivered by the central sheet transformer.
   * @param config - Given builder config.
   * @returns A fully materialized, state-bound graphical DOM tree container element.
   * 
   * @public
   */
  public abstract prepare(content: any, config?: Required<TConfig>): HTMLElement | Record<string, any | HTMLElement>;

  /**
   * Runtime event-binding hook. 
   * Triggered at the very end of the creation lifecycleto lock persistent browser click/drag/swipe 
   * interactive listeners onto the completed DOM structure.
   */
  public abstract initialize(el?: HTMLElement, payload?: any, context?: any): void;

  /**
   * Cleans up instance resources, fires destruction notifications, detaches DOM elements,
   * and clears memory references to guarantee proper garbage collection.
   * 
   * @public
   */
  public destroy(typeKey?: TType): void {
    // 1. Tembakkan emisi laporan kematian struktur ke pusat orkestrator luar
    if (this.config?.emit) {
      this.config.emit("elementRemoved", {
        builder: this.builderId,
        data: null // Bebas dari tracking rawDataNode kotor
      });
    }

    // ====================================================
    // 🔮 THE ANCESTRAL POINTER EXTRACTOR (EVAKUASI DARI MAP POOL)
    // Jemput elemen root hidup dari dalam saku standard identifier @container!
    // ====================================================
    const rootElement = this.#nodes.get(typeKey || "@container")?.element as HTMLElement

    if (rootElement) {
      // Cabut dari silsilah induk bodi HTML jika memiliki parentNode aktif di browser
      if (rootElement.parentNode) {
        rootElement.parentNode.removeChild(rootElement);
      } else {
        // Fallback jika berdiri standalone di dalam RAM fragment memory
        rootElement.remove();
      }

      // console.log(`[Lifecycle Security] DOM Element Node for "${String(this.builderId)}" successfully unmounted.`);
    }

    // ====================================================
    // 🔒 MUTLAK SAKRAL: SAPU RESIK SELURUH REFERENSI MEMORI!
    // Pemicu utama agar Garbage Collector (GC) browser langsung menyapu bersih 
    // sisa bita RAM aplikasi Anda tanpa ada risiko Detached DOM tunggal yang tertinggal!
    // ====================================================
    this.#nodes.clear();
    this.config = null as any;

    // console.log(`[Lifecycle Security] _nodes Map successfully liquidated. Memory state at 0B leak.`);
  }

  public create(content: iBasicNode, config?: Partial<TConfig>): HTMLElement {
    if (config) this.config = this.resolveConfig(this.config, config);

    // 💡 AUTOMATION LIFECYCLE: Bersihkan sisa bita RAM & kunci Tema sebelum anak bersiap!
    this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
    this.#nodes.clear();

    // Jalankan persiapan rajutan silsilah milik komponen anak
    const DOMTree = this.prepare(content, this.config) as HTMLElement;

    // Detonasi event bindings interaktif klik browser
    this.initialize(DOMTree, content);

    return DOMTree;
  }


  /**
   * Consolidates default specifications with third-party configurations into a unified data structure,
   * performing an accurate deep-merge execution specifically isolated for selector dictionaries and HTML attributes.
   * 
   * @param defaultOptions - The structural default parameters including core properties and blueprint selectors.
   * @param userConfig - Incoming contextual overrides sent dynamically by themes or framework controllers.
   * @returns A strictly typed, fully populated configuration object ready for runtime ingestion.
   * @template C - Menangkap tipe Interface Config anak secara penuh (e.g. iMenuConfig)
   * @protected
   */
  protected resolveConfig<C extends TConfig>(
    defaultOptions: Required<C> | any,
    userConfig: Partial<C> = {}): Required<C> {
    // Step 1: Initialize the local layout registry by cloning the component's default structural selector nodes.
    const mergedSelectors = { ...(defaultOptions.selectors || {}) } as Record<TType, any>;

    // Step 2: Validate the existence of third-party selectors overrides hantaran userConfig layers.
    if (userConfig.selectors) {
      // Step 3: Traverse the override dictionary entries linearly to assimilate the specialized structural tokens.
      Object.entries(userConfig.selectors).forEach(([key, selectorValue]) => {
        if (selectorValue && typeof selectorValue === "object") {
          mergedSelectors[key as TType] = {
            ...(mergedSelectors[key as TType] || {}),
            ...selectorValue,
            // Step 5: Secure the critical HTML custom attributes dictionary block to guarantee zero property evaporation.
            attrs: {
              ...((mergedSelectors[key as TType] || {}).attrs || {}),
              ...((selectorValue as iElementProperty | iActionProperty).attrs || {})
            }
          };
        }
      });
    }
    // Step 6: Package the consolidated state metadata container, ensuring selectors are strictly typed and sealed.
    return Object.freeze({
      ...defaultOptions,
      ...userConfig,
      selectors: mergedSelectors
    }) as Required<C>;
  }

  /**
   * The localized internal layout factory. 
   * Contains hardcoded default structuralblueprints to populate HTML content elements if no external override handler is resolved.
   * @rules
   * `Rule 1`: Selectors Are for "Containers Only"
   * When defining the selectors map, only map elements that act as structural layout boxes or repeating array loops. 
   * Never map basic value text nodes or terminal leaf elements.
   * - `Bad`: `@card>header>title`, `@card>actions>button`, `@card>body>features>item>icon`
   * - `Good`: `@card`, `@card>header`, `@card>body`, `@card>body>features` (The loop container), `@card>actions`
   * 
   * `Rule 2`: The Template Method is a `Scoped Decorator`
   * - Since the selectors only generate layout boxes, your template method is `responsible` 
   * for `inserting` the inside contents (text, inline sub-tags, forms) into those specific boxes.
   * - Do not look for `sub-selectors`. Use the container element passed to you, 
   * and build its inner landscape using its clean data payload.
   * @param typeKey - Token nama selektor kaku Anda.
   * @param payload - Data Sheets hantaran yang aktif.
   * @param multiple - True: Elemen loop berulang (Multi-Instance). False: Elemen tunggal (Singleton Guard).
   * 
   */
  protected render(typeKey: TType, payload?: any, multiple: boolean = false): HTMLElement | undefined {

    if (!multiple && this.#nodes.has(typeKey)) {
      console.warn(
        `🚨 [Framework Architectural Violation]: Element key "${String(typeKey)}" has already been rendered!\n` +
        `Re-rendering a Singleton node is strictly prohibited.\n Please use "this.render('${String(typeKey)}', payload, true)" if it multiple item or \n` +
        `"this.load('${String(typeKey)}')" instead to retrieve the active live memory pointer.`
      );

      const recentElement = this.load(typeKey) as HTMLElement;

      if (recentElement) {
        // 3. Tembakkan kembali fungsi template() anak untuk menyiram data payload baru (MENIMPA KONTENSecara JIT!)
        this.template(typeKey, recentElement, payload);

        // console.log(this.#nodes.entries())

        // 4. Potong kompas langsung kembalikan elemen tersebut tanpa melakukan .push() kotor!
        return recentElement;
      }
    }

    const selector = this.config.selectors?.[typeKey];
    if (!selector) return undefined;

    // 1. Cetak fisik elemen dasar asli secara otomatis (HANYA 1X DI SINI!)
    const el = document.createElement(selector.tagName || "div");
    this._applyNodeAttributes(el, selector);

    // 2. Jalankan jembatan hidrasi lokal milik komponen anak untuk menyiram data teks
    this.template(typeKey, el, payload);

    // 3. Jalankan penyiraman JIT Tema luar lintas dimensi kosmetik
    try {
      if (typeof TemplateRegistry !== "undefined" && typeof TemplateRegistry.resolve === "function") {
        const registryLookupKey = (typeKey === "@container") ? `@${String(this.builderId)}:container` : typeKey;

        const activeHandler = TemplateRegistry.resolve(
          this.activeLiveThemeId,
          registryLookupKey as TType,
          null // Sediakan null agar Registry luar tahu tidak ada callback fallback bawaan yang kaku
        );

        // Hanya tembak jika desainer luar memang nyata meregistrasikan fungsi kustom!
        if (typeof activeHandler === "function") {
          activeHandler(registryLookupKey as TType, el, payload, selector);
        }
      }
    } catch (securityError) {
      // Menangkap eror runtime secara sunyi agar eksekusi kompilasi komponen anak tidak terhenti
      console.warn(`[Builder Security Bypass] TemplateRegistry evaluation skipped for key "${String(typeKey)}":`, securityError);
    }

    if (selector.wrapper) {
      const wrapperChain = this._wrapElement(selector.wrapper, el);
      if (wrapperChain) {
        // Kembalikan bungkusan utuh agar anak tahu siapa pintu luar (outer) & pintu dalam (inner)
        el.outer = wrapperChain.outer;
        el.inner = el;
      }
    }

    const tElement = el.outer || el;
    const tPayload = payload && typeof payload === "object" ? Object.freeze({ ...payload }) : payload;

    if (!this.#nodes.has(typeKey)) {
      // Putaran Pertama: Pasang langsung sebagai HTMLElement TUNGGAL (Sangat Direct!)
      this.#nodes.set(typeKey, { element: [tElement], payload: tPayload });
    } else {
      const existingRecord = this.#nodes.get(typeKey)!;
      (existingRecord.element as HTMLElement[]).push(tElement);
    }

    if (this.config?.emit !== undefined) {
      this.config.emit?.("elementAdded", {
        builder: this.builderId,
        type: typeKey as TType,
        element: el,
        data: payload
      });
    }

    return el;
  }


  protected load(key: TType, index?: number | "all"): HTMLElement | HTMLElement[] | null {
    const nodeCtx = this.#nodes.get(key);
    if (nodeCtx && (nodeCtx.element as HTMLElement[]).length > 0) {
      if (index && index === "all") {
        return nodeCtx.element as HTMLElement[]
      } else {
        return ((nodeCtx.element as HTMLElement[])[index ? index : 0] || null) as HTMLElement;
      }
    }
    return null;
  }

  protected getPayload(key: TType | string): any {
    return this.#nodes.get(key)?.payload || null;
  }

  /**
  * 👑 PINTU 3: THE BULK MASS ELEMENT REMOVER (AMPUTASI MASSA SATU ATOP!)
  * Sekarang mendukung parameter tak terbatas via Rest Parameters (...keys)!
  * Mencabut belasan fisik elemen dari DOM Tree sekaligus menguras saku RAM browser 
  * dalam SEKALI KETUKAN baris kode tanpa boilerplate repetitif!
  * 
  * @param keys - Daftar token nama selektor kaku yang mau dihancurkan massal.
  * @protected
  */
  protected remove(...keys: (TType)[]): void {
    // Sisir setiap kunci yang disuapkan dari level komponen anak
    keys.forEach((key) => {
      const nodeCtx = this.#nodes.get(key);

      if (nodeCtx) {
        // 1. Cabut seluruh fisik elemen (Singleton maupun Multi-Instance Loop) dari DOM Tree halaman
        (nodeCtx.element as HTMLElement[]).forEach((el) => {
          if (el) {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            } else {
              el.remove(); // Fallback fragment memory unmount
            }
            // emitter global
            if (this.config?.emit !== undefined) {
              this.config.emit?.("elementRemoved", {
                builder: this.builderId,
                element: el,
                data: null
              });
            }
          }
        });

        // 2. Potong tali referensi memori dari rahim Map pusat agar GC browser mencuci bersih RAM!
        this.#nodes.delete(key);
        // console.log(`🧹 [RAM Bulk Shield]: Key "${String(key)}" liquidated successfully.`);
      }
    });
  }

  /**
   * Recursively parses CSS selector chains (e.g., ".column>neon", "div.col-4>.card-wrapper")
   * into a nested DOM hierarchy.
   */
  private _wrapElement(wrapperStr: string, targetElement: HTMLElement): HTMLElement | null {
    if (!wrapperStr || !targetElement) return null;

    const parts = wrapperStr.split(">").map((s: string) => s.trim()).filter(Boolean);
    if (parts.length === 0) return null;

    const parseNode = (segment: string): HTMLElement => {
      let tagName = "div";
      let className = "";
      let id = "";
      const parsedAttrs: Record<string, string> = {};

      // ====================================================
      // 🧙‍♂️ THE ATTRIBUTE BRACKET EXTRACTOR (SENJATA BARU ANDA!)
      // Peras pola [attr="value"] atau [attr='value'] menggunakan RegEx
      // ====================================================
      const attrRegex = /\[\s*([a-zA-Z0-9_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
      let match;
      while ((match = attrRegex.exec(segment)) !== null) {
        const attrName = match[1];
        const attrValue = match[2];
        parsedAttrs[attrName] = attrValue;
      }

      // Bersihkan segmen string dari blok kurung siku [...] yang sudah diperas
      let cleanSegment = segment.replace(/\[[^\]]*\]/g, "");

      // Ekstrak Kelas dan ID seperti biasa dari sisa string yang sudah bersih
      if (cleanSegment.startsWith(".")) {
        className = cleanSegment.slice(1);
      } else if (cleanSegment.startsWith("#")) {
        id = cleanSegment.slice(1);
      } else if (cleanSegment.includes(".")) {
        [tagName, className] = cleanSegment.split(".");
      } else if (cleanSegment.includes("#")) {
        [tagName, id] = cleanSegment.split("#");
      } else {
        tagName = cleanSegment;
      }

      // Mulai cetak fisik elemen boks pembungkus
      const el = document.createElement(tagName);
      if (className) el.className = className.replace(/\./g, " ");
      if (id) el.id = id;

      // 🟢 DISBURSMENT: Siram seluruh hasil tangkapan atribut kurung siku ke dalam elemen!
      Object.entries(parsedAttrs).forEach(([aName, aValue]) => {
        el.setAttribute(aName, aValue);
      });

      return el;
    };

    // 1. Bangun benteng terluar (Root Wrapper)
    const outer = parseNode(parts[0]);
    let innerPointer = outer;

    // 2. Bangun silsilah rantai bersarang ke dalam
    for (let i = 1; i < parts.length; i++) {
      const child = parseNode(parts[i]);
      innerPointer.appendChild(child);
      innerPointer = child;
    }

    // 3. 🟢 DIRECT ATTACHMENT: Tancapkan elemen asli hidup tepat ke rahim terdalam wrapper
    innerPointer.appendChild(targetElement);

    // 4. Return koordinat dua arah yang jujur sesuai kebutuhan realcase Anda!
    return { outer, inner: targetElement } as HTMLElement;
  }


  /**
   * 🧱 THE ATTR AND METADATA WELDER (POS PENGURUS DATA ATRIBUT)
   * Melumat tuntas ID, ClassName, kustom attrs, hingga data- attributes bawaan database Sheets.
   */
  private _applyNodeAttributes(el: HTMLElement, selector: any): void {
    if (selector.id) el.id = selector.id;
    if (selector.className) el.className = selector.className;

    // Siram seluruh isi kamus attrs kustom (src, href, alt, dll)
    if (selector.attrs && typeof selector.attrs === "object") {
      Object.entries(selector.attrs).forEach(([k, v]) => {
        el.setAttribute(k, String(v));
      });
    }

    // 💡 AUTOMATED REGULAR PROPERTY & DATA- INJECTION PASS-THROUGH
    // Menyapu sisa properti hantaran sheets kustom agar otomatis ter-inject kokoh
    Object.keys(selector).forEach((key) => {
      const isReserved = ["tagName", "id", "className", "attrs", "wrapper"].includes(key);
      if (!isReserved && !key.startsWith("_")) {
        el.setAttribute(key, String(selector[key]));
      }
    });
  }

}

// ====================================================
// 🛡️ BENTENG LAPIS 2: THE SECURE IMMUTABLE PROTOTYPE CHAIN (MAHKOTA PERTAHANAN BARU!)
// Tepat di bawah deklarasi kelas, kita BEKUKAN total cetakan 'BuilderBase.prototype'.
// Ini adalah taktik runtime locking paling legal dan aman di JavaScript. 
// Hacker/script luar GARANSI 100% tidak akan bisa mengganti jeroan .create atau .render!
// ====================================================
Object.freeze(Builder.prototype);
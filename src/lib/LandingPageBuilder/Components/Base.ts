import type { iBuilderRegistry, iBuilderConfig, iElementProperty, iActionProperty, iBasicNode, iNodeRecordItem, iNodeRecords, iBuilderSelectorsConfig } from "../interface";
import { DOMTreeMemory } from "../Modules/DOMTreeMemory";
import { TemplateRegistry } from "../Modules/TemplateRegistry";
import { selectorToTree } from "../Utils/SelectorToTree";

declare global {
  interface HTMLElement {
    __outer?: HTMLElement;
    __inner?: HTMLElement;
    __payload?: any;
    __index?: number;
  }
}

const GLOBAL_INSTANCE_COUNTER = new Map<string, number>();

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

  public static resetCounters(): void {
    GLOBAL_INSTANCE_COUNTER.clear();
    console.log(`🧹 [Builder]: Wiped all instance identity counters.`);
  }

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
  protected instanceId: string = "";

  protected activeLiveThemeId: string = "default";

  protected hierarchy: Record<string, any> = {}

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

  constructor() {
    const isRegistryPresent = typeof DOMTreeMemory !== "undefined";
    // const isRegistryPresent = false;
    if (!isRegistryPresent) {
      this.errorHandler();
    }
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

  private ensureIdentity(config?: TConfig): Record<string, any> {
    if (!this.instanceId) {
      const baseId = this.builderId;

      // Ambil urutan angka kelahiran instansi string ini di dalam RAM
      let currentCount = GLOBAL_INSTANCE_COUNTER.get(baseId) || 0;
      currentCount++;
      GLOBAL_INSTANCE_COUNTER.set(baseId, currentCount);

      // 💥 BUM! Jika instansi lahir lebih dari 1x, otomatis berikan ekor penanda numerik yang konsisten!
      // Contoh: Putaran 1 tetap "product-card", Putaran 2 otomatis menjadi "product-card:instance-2", dst!
      this.instanceId = currentCount > 1
        ? `${baseId}:instance-${currentCount}`
        : baseId;

      // console.log(`🤖 [Instance Fingerprint]: Auto-assigned identity scope: "${this.instanceId}"`);
    }

    const hierarchy = selectorToTree(this.instanceId, config?.selectors as Record<string, any>);
    return hierarchy;
  }

  private errorHandler() {
    const id = this.builderId;
    console.warn(
      `⚠️ [Framework Degraded Mode]: TemplateRegistry is not present!\n` +
      `Global Slotting System and Cross-Builder Live Reactivity are disabled.\n` +
      `Falling back to standalone local memory buffer for builder: "${id}".`
    );
  }

  // nodes builder
  #nodes = new Map<TType | string, iNodeRecords>();
  protected nodes() {
    const isRegistryPresent = typeof DOMTreeMemory !== "undefined";
    // const isRegistryPresent = false;

    const registerTheme = (key: TType, element: HTMLElement, payload: any, selector: iBuilderSelectorsConfig[TType]) => {
      if (typeof TemplateRegistry !== "undefined" && typeof TemplateRegistry.resolve === "function") {
        // Register Template
        try {
          const registryLookupKey = (key === "@container") ? `@${String(this.builderId)}:container` : key;

          const activeHandler = TemplateRegistry.resolve(
            "default",
            registryLookupKey as string,
            null // Sediakan null agar Registry luar tahu tidak ada callback fallback bawaan yang kaku
          );

          // Hanya tembak jika desainer luar memang nyata meregistrasikan fungsi kustom!
          if (typeof activeHandler === "function") {
            activeHandler(registryLookupKey as string, element, payload, selector);
          }

        } catch (securityError) {
          // Menangkap eror runtime secara sunyi agar eksekusi kompilasi komponen anak tidak terhenti
          console.warn(`[Builder Security Bypass] TemplateRegistry evaluation skipped for key "${String(key)}":`, securityError);
        }
      }
      return;
    }

    // 🛡️ BOM PERINGATAN ASAL USUL JELAS PILIHAN ANDA:
    if (!isRegistryPresent) {
      const resolveLocalKey = (k: TType) => k; // `${this.instanceId}:${k as TType}`;
      return {
        has: (key: TType): boolean => this.#nodes.has(resolveLocalKey(key)),
        get: (key: TType, index: number | "all" = 0): any => {
          const node = this.#nodes.get(resolveLocalKey(key));
          if (!node || !node.records || node.records.length === 0) return null;

          // Jika komponen meminta seluruh barisan elemen saudara (e.g. load(..., "all"))
          if (index === "all") {
            return node.records;
          }
          // Kembalikan murni 1 elemen fisik spesifik berdasarkan nomor indeks array-nya!
          return node.records[index] || null;
        },
        set: (key: TType, element: HTMLElement, payload: any, multiple: boolean) => {
          const lKey = resolveLocalKey(key);


          // if (this.builderId === "masonry") console.log({ builder: this.builderId, method: "this.nodes().set()", entries: this.#nodes.entries() })
          if (this.#nodes.has(lKey) && !multiple) {
            console.warn(
              `🚨 [Framework Architectural Violation]: ElemenlKey "${String(lKey)}" has already been rendered in builder "${this.builderId}"!\n` +
              `Re-rendering a Singleton node is strictly prohibited.\n` +
              `Please use "this.render('${String(lKey)}', payload, true)" if it is a multiple item or \n` +
              `"this.load('${String(lKey)}')" instead to retrieve the active live memory pointer.`
            );
            return this.#nodes.get(lKey)?.records[0].proxy
          };

          const rawObj = payload && typeof payload === "object" ? { ...payload } : { value: payload };
          const newItem: iNodeRecordItem = { element, relations: this.hierarchy[key], raw: rawObj, proxy: rawObj }; // Tanpa Proxy penangkap

          if (this.#nodes.has(lKey)) {
            this.#nodes.get(lKey)!.records.push(newItem);
            return rawObj;
          }

          registerTheme(key, element, rawObj, this.config.selectors?.[key]!)

          this.#nodes.set(lKey, { records: [newItem] });

          return rawObj;
        },
        delete: (key: TType, index: number | "all" = "all"): void => {
          const lKey = resolveLocalKey(key);
          const rec = this.#nodes.get(lKey);
          if (index === "all") {
            rec?.records.forEach(item => item.element?.remove());
            this.#nodes.delete(lKey);
          } else if (typeof index === "number") {
            rec?.records[index]?.element?.remove();
            rec?.records.splice(index, 1);
          }
        },
        clear: () => {
          this.#nodes.forEach(rec => rec.records.forEach(item => item.element?.remove()));
          this.#nodes.clear();
          console.log(`🧹 [Local Memory Guard]: Wiped 100% standalone RAM buffer for "${this.instanceId}"`);
        },
        restore: (typeKey: TType, incomingPayload: any): HTMLElement | null => {
          const lKey = resolveLocalKey(typeKey);
          const rec = this.#nodes.get(lKey);
          if (!rec || rec.records.length === 0) return null;
          const cachedItem = rec.records[rec.records.length - 1];
          if (cachedItem.raw !== incomingPayload && JSON.stringify(cachedItem.raw) !== JSON.stringify(incomingPayload)) {
            this.nodes().delete(typeKey, "all"); // Overwrite hapus jika data Sheets berubah!
            return null;
          }
          return cachedItem.element;
        },
        payload: (key: TType, index: number | "all" = 0): any => {
          const mainRecord = this.#nodes.get(resolveLocalKey(key));
          if (!mainRecord || !mainRecord.records || mainRecord.records.length === 0) return null;
          // Periksa parameter string "all" secara eksplisit pada array .records!
          if (index === "all") return mainRecord.records.map(n => n.proxy);
          return mainRecord.records[index as number]?.proxy || null;
        },
        load: (key: TType, index: number | "all" = 0): any => {
          const mainRecord = this.#nodes.get(resolveLocalKey(key));
          if (!mainRecord || !mainRecord.records || mainRecord.records.length === 0) return null;
          if (index === "all") return mainRecord.records.map(n => n.element);
          return mainRecord.records[index as number]?.element || null;
        }
      }
    }
    return {
      has: (key: TType): boolean => DOMTreeMemory.has(this.hierarchy[key as TType]),
      get: (key: TType, index: number | "all" = 0): HTMLElement | HTMLElement[] => DOMTreeMemory.get(this.hierarchy[key as TType], index),
      set: (key: TType, element: HTMLElement, payload: any, multiple: boolean) => {
        registerTheme(key, element, payload, this.config.selectors?.[key]!)
        return DOMTreeMemory.set(this.hierarchy[key as TType], element, payload, multiple);
      },
      delete: (key: TType, index: number | "all" = "all"): void => DOMTreeMemory.delete(this.hierarchy[key as TType], index),
      clear: (): void => DOMTreeMemory.clear(),
      payload: (key: TType, index: number | "all" = 0): any => {
        // Panggil TemplateRegistry.nodes.get secara legal
        const nodes = DOMTreeMemory.get(this.hierarchy[key as TType], index);
        if (!nodes) return null;
        // Jika pusat mengembalikan array (karena index === "all")
        if (Array.isArray(nodes)) return nodes.map(n => n.proxy);
        return nodes.proxy; // Mengambil properti .proxy dari dalam boks iNodeRecordItem sejati!
      },
      load: (key: TType, index: number | "all" = 0): any => {
        const nodes = DOMTreeMemory.get(this.hierarchy[key as TType], index);
        if (!nodes) return null;
        if (Array.isArray(nodes)) return nodes.map(n => n.element);
        return nodes.element;
      }
    };
  }


  public create(content: iBasicNode, config?: Partial<TConfig>): HTMLElement {
    const effectiveConfig = config || (content && typeof content === "object" ? (content as any).config : undefined);
    if (effectiveConfig) this.config = this.resolveConfig(this.config, effectiveConfig);
    this.hierarchy = this.ensureIdentity(this.config);
    try {

      // console.count(`📊 [Core Lifecycle Audit] ${this.builderId.toUpperCase()} .create() called`);
      // const trace = new Error();
      // console.log(`🧭 [Stack Trace for ${this.builderId}]:`, trace.stack?.split("\n").slice(1, 4).join("\n"));

      // 💡 AUTOMATION LIFECYCLE: Bersihkan sisa bita RAM & kunci Tema sebelum anak bersiap!
      this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
      this.nodes().clear();
      // Jalankan persiapan rajutan silsilah milik komponen anak
      const DOMTree = this.prepare(content, this.config) as HTMLElement;
      if (this.builderId === "tab") console.log(`${this.builderId} Elements Map`, this.#nodes.entries())

      // Detonasi event bindings interaktif klik browser
      this.initialize(DOMTree, content);

      return DOMTree;
    } finally {

    }

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
    // if (this.builderId === "pricing-card") console.log(this.builderId, "this.render", payload);
    const selector = this.config.selectors?.[typeKey];


    // ====================================================
    // 🧙‍♂️ THE RE-HYDRATION OVERWRITE INTERCEPTOR (NOT SURE IT IS WORKING!)
    // ====================================================
    if (selector?.isRoot && !multiple) {

      const restoredDOM = this.nodes().restore!(typeKey, payload);
      if (restoredDOM) {
        console.log(`🎉 [Framework Restore Hit]: Successfully re-attached full memory matrix tree for "${this.instanceId}"`);
        return restoredDOM; // Bypass total rebuild visual visual!
      }
    }



    if (!selector) return undefined;

    const el = document.createElement(selector.tagName || "div");
    this._applyNodeAttributes(el, selector);

    // Setor instansi dan daftarkan langsung ke rahim pusat lewat katup .set() proxy nodes!
    const activePayload = this.nodes().set(typeKey, el, payload, multiple);

    this.template(typeKey, el, activePayload);

    if (selector.wrapper) {
      const wrapperChain = this._wrapElement(selector.wrapper, el);
      if (wrapperChain) {
        // Kembalikan bungkusan utuh agar anak tahu siapa pintu luar (outer) & pintu dalam (inner)
        (el as any).__outer = wrapperChain.__outer;
        (el as any).__inner = el;
      }
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

  protected load(key: TType, index: number | "all" = 0): HTMLElement | HTMLElement[] | null {
    // if (this.builderId === "pricing-card") console.log(this.builderId, "this.load", nodes);
    return this.nodes().load(key, index);
  }

  protected getPayload(key: TType, index: number | "all" = 0): any {
    return this.nodes().payload(key, index) || null;
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
  protected remove(...typeKeys: TType[]): void {
    typeKeys.forEach((key) => {
      const liveElement = this.load(key) as HTMLElement;
      if (liveElement) liveElement.remove();
      this.nodes().delete(key, "all");
    });
  }

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
    const rootElement = this.nodes().load(typeKey || "@container" as TType) as HTMLElement

    console.log({ rootElement })

    if (rootElement) {
      // Cabut dari silsilah induk bodi HTML jika memiliki parentNode aktif di browser
      if (rootElement.parentNode) {
        rootElement.parentNode.removeChild(rootElement);
      } else {
        // Fallback jika berdiri standalone di dalam RAM fragment memory
        rootElement.remove();
      }

      console.log(`[Lifecycle Security] DOM Element Node for "${String(this.builderId)}" successfully unmounted.`);
    }

    this.nodes().clear();
    this.config = null as any;

    // console.log(`[Lifecycle Security] _nodes Map successfully liquidated. Memory state at 0B leak.`);
  }

  /**
   * 👶 METODE ADOPT MANUAL (GERBANG PENJAHIT SILSILAH EKSPLISIT HASIL IDE DEWA ANDA!)
   * 0% Pukul rata prototype! 100% Mengontrol penandaan elemen fisik secara sadar!
   * 
   * @param childTarget Elemen fisik HTMLElement milik komponen anak yang mau diadopsi daur hidupnya.
   * @public
   */
  public adopt(root: HTMLElement | TType | any, ...targets: Array<HTMLElement | TType | any>): this {
    if (!targets || targets.length === 0) return this;

    const parentScopeId = this.instanceId || this.builderId;
    const parentGlobalKey = `${parentScopeId}:${root}`;
    const allNodesMap = DOMTreeMemory.getAll();

    // Loop massal menyisir barisan target hantaran batch Anda
    targets.forEach((target) => {
      if (!target) return;

      let childEl: HTMLElement | null = null;
      let targetLookupKey: string | null = null;

      // Saringan Kasus A: Jika target yang dikirim adalah string token kustom (e.g. "@form>body")
      if (typeof target === "string") {
        const resolvedEl = this.nodes().get(target as TType);
        childEl = resolvedEl?.element || resolvedEl;
        targetLookupKey = `${parentScopeId}:${target}`;
      } else {
        // Saringan Kasus B: Jika target berupa elemen fisik HTMLElement asli atau return wrapper
        childEl = target.element || target;
      }

      if (!(childEl instanceof HTMLElement)) return;

      let childGlobalKey: string | null = targetLookupKey;
      let childRecordItem: any = null;

      // Jika belum memegang kunci koordinat (kasus elemen fisik anonim dari cara ketiga)
      if (!childGlobalKey) {
        for (const [globalKey, record] of allNodesMap.entries()) {
          const matchItem = record.records?.find((rec: any) => rec.element === childEl);
          if (matchItem) {
            childGlobalKey = globalKey;
            childRecordItem = matchItem;
            break;
          }
        }
      } else {
        // Jika kunci koordinat sudah diketahui dari string token, jemput boks item-nya
        const record = allNodesMap.get(childGlobalKey);
        childRecordItem = record?.records?.find((rec: any) => rec.element === childEl);
      }

      // LAUNCH PENJAHITAN GRAF SILSILAH DUA ARAH REAKTIF!
      if (parentGlobalKey && childGlobalKey && childRecordItem) {
        const parentRecord = allNodesMap.get(parentGlobalKey);

        if (parentRecord && parentRecord.records.length > 0) {
          const activeParentItem = parentRecord.records[parentRecord.records.length - 1];

          if (activeParentItem) {
            // A. Las silsilah bapak ke dalam tubuh internal si anak!
            childRecordItem.relations.parent = parentGlobalKey;

            // B. Dorong token kunci si anak masuk ke saku Array children milik si bapak!
            if (!activeParentItem?.relations!.children.includes(childGlobalKey)) {
              activeParentItem?.relations!.children.push(childGlobalKey);
              console.log(`📌 [Batch Graph Weld]: "${parentGlobalKey}" adopted child node "${childGlobalKey}" successfully.`);
            }
          }
        }
      }
    });

    return this;
  }

  public _setRelations(rootSelector: TType, childSelectors: Array<TType | string | HTMLElement | any>): this {
    if (!childSelectors || childSelectors.length === 0) return this;

    const scopeId = this.instanceId;
    const isRegistryPresent = typeof DOMTreeMemory !== "undefined";

    if (!isRegistryPresent) return this;

    // 1. Rangkai kunci komposit global sejati milik si bapak
    const parentGlobalKey = `${scopeId}:${rootSelector as string}`;
    const allNodesMap = DOMTreeMemory.getAll();

    // Pastikan boks record bapaknya memang nyata-nyata eksis di RAM
    const parentRecord = allNodesMap.get(parentGlobalKey);
    if (!parentRecord || parentRecord.records.length === 0) {
      console.warn(`⚠️ [setRelations Cache Miss]: Parent key "${parentGlobalKey}" not found in RAM yet.`);
      return this;
    }

    const activeParentItem = parentRecord.records[parentRecord.records.length - 1];
    if (!activeParentItem) return this;

    // 2. Loop linear menyisir barisan anak hantaran parameter Anda
    childSelectors.forEach((childTarget) => {
      if (!childTarget) return;

      let childGlobalKey: string | null = null;
      let childRecordItem: any = null;

      // Kasus A: Jika anak dikirim berupa string token selektor (e.g. "@form")
      if (typeof childTarget === "string") {
        // Jika token anak membawa nama klan builder lain (e.g. "form:inst-1:@form")
        if (childTarget.includes(":")) {
          childGlobalKey = childTarget;
        } else {
          childGlobalKey = `${scopeId}:${childTarget}`;
        }

        const record = allNodesMap.get(childGlobalKey);
        childRecordItem = record?.records?.[record.records.length - 1];
      }
      // Kasus B: Jika anak dikirim dalam wujud fisik HTMLElement asli atau return wrapper
      else {
        const childEl = childTarget.element || childTarget;
        if (!(childEl instanceof HTMLElement)) return;

        // Hunt pointer koordinat anak di level RAM
        for (const [globalKey, record] of allNodesMap.entries()) {
          const matchItem = record.records?.find((rec: any) => rec.element === childEl);
          if (matchItem) {
            childGlobalKey = globalKey;
            childRecordItem = matchItem;
            break;
          }
        }
      }

      // 3. 💥 EKSEKUSI LAS MANUAL (STABILISASI PIPELINE SEPATU EMAS ANDA!)
      if (childGlobalKey && childRecordItem) {
        // A. Sambungkan penunjuk alamat bapak ke tubuh si anak
        childRecordItem.relations.parent = parentGlobalKey;

        // B. Masukkan nama kunci si anak ke dalam saku gerbong children milik si bapak
        if (!activeParentItem.relations!.children.includes(childGlobalKey)) {
          activeParentItem.relations!.children.push(childGlobalKey);
          console.log(`🔒 [setRelations Link Secured]: Wrapped "${childGlobalKey}" into parent trunk "${parentGlobalKey}"`);
        }
      }
    });

    return this;
  }


  public attach(childElement: HTMLElement | any, globalSlotPathKey: string): void {
    if (!childElement) return;
    const el = childElement.element || childElement;
    if (!(el instanceof HTMLElement)) return;

    const [targetIdentifier, slotName] = globalSlotPathKey.split("~");
    const [targetBuilderId, targetTypeKey] = targetIdentifier.split(":");

    if (!targetBuilderId || !targetTypeKey || !slotName) {
      console.error(`🚨 [Slotting Error]: Expected "builderId:typeKey~slotName", got: "${globalSlotPathKey}"`);
      return;
    }

    // Memanggil fungsi .load() pusat milik registry yang sudah Anda sinkronkan!
    const parentElement = DOMTreeMemory.get(this.hierarchy[targetTypeKey as TType]) as HTMLElement;

    if (!parentElement) {
      console.warn(`⚠️ [Slotting Warning]: Target semesta "${targetBuilderId}:${targetTypeKey}" tidak aktif di RAM.`);
      return;
    }

    let slotTarget: HTMLElement | null = parentElement.getAttribute("data-slot") === slotName
      ? parentElement
      : parentElement.querySelector(`[data-slot="${slotName}"]`);

    if (slotTarget) {
      console.log(`🚀 [Independent Slotting]: Welding "${this.builderId}" node into target "${globalSlotPathKey}"`);
      slotTarget.appendChild(el);
    } else {
      parentElement.appendChild(el);
    }
  }

  public detach(childElement: HTMLElement | any): void {
    if (!childElement) return;
    const el = childElement.element || childElement;
    if (el && el.parentElement) el.remove();
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
    const __outer = parseNode(parts[0]);
    let innerPointer = __outer;

    // 2. Bangun silsilah rantai bersarang ke dalam
    for (let i = 1; i < parts.length; i++) {
      const child = parseNode(parts[i]);
      innerPointer.appendChild(child);
      innerPointer = child;
    }

    // 3. 🟢 DIRECT ATTACHMENT: Tancapkan elemen asli hidup tepat ke rahim terdalam wrapper
    innerPointer.appendChild(targetElement);

    // 4. Return koordinat dua arah yang jujur sesuai kebutuhan realcase Anda!
    return { __outer, __inner: targetElement } as HTMLElement;
  }


  /**
   * 🧱 THE ATTR AND METADATA WELDER (POS PENGURUS DATA ATRIBUT)
   * Melumat tuntas ID, ClassName, kustom attrs, hingga data- attributes bawaan database Sheets.
   */
  private _applyNodeAttributes(el: HTMLElement, selector: any): void {
    if (!selector) return;

    // 1. Suntikkan Identitas ID jika didefinisikan kaku di dalam selektor preset
    if (selector.id) {
      el.id = selector.id;
    }

    // 2. Suntikkan Kosmetik ClassName standar secara aman
    if (selector.className) {
      el.className = selector.className;
    }

    // 3. 🧙‍♂️ SAFE ATTRS EXTRACTOR: Menyisir dan menancapkan atribut HTML legal JIT
    // Hanya memproses boks 'attrs' khusus, memblokir buta loop properti config luar!
    if (selector.attrs && typeof selector.attrs === "object") {
      Object.entries(selector.attrs).forEach(([attrName, attrValue]) => {
        el.setAttribute(attrName, String(attrValue));
      });
    }
  }

}

// ====================================================
// 🛡️ BENTENG LAPIS 2: THE SECURE IMMUTABLE PROTOTYPE CHAIN (MAHKOTA PERTAHANAN BARU!)
// Tepat di bawah deklarasi kelas, kita BEKUKAN total cetakan 'BuilderBase.prototype'.
// Ini adalah taktik runtime locking paling legal dan aman di JavaScript. 
// Hacker/script luar GARANSI 100% tidak akan bisa mengganti jeroan .create atau .render!
// ====================================================
Object.freeze(Builder.prototype);
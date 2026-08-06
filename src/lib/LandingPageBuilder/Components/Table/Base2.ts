import type { iBuilderRegistry, iBuilderConfig, iElementProperty, iActionProperty, iBasicNode, iBuilderSelectorsConfig, iNodeRecordRelations } from "../../interface";
import { TemplateRegistry } from "../../Modules/TemplateRegistry";
import { buildNamespace, setMetadata } from "../../Utils/Metadata";
import { ElementCreatedEventBus, StateMutationEventBus } from "../../Services/EventBus";
import { selectorToTree } from "../../Utils/SelectorToTree";
export interface iNodeRecordItem<T = any> {
  key: string;          // Key unik/lokal (misal: "@table>trow" atau "@table>trow#101")
  element: HTMLElement; // DOM Fisik Composite
  raw: T;              // Raw Payload
  proxy: T;            // Objek Proxy Reaktif
  relations: iNodeRecordRelations
}
export const GLOBAL_INSTANCE_COUNTER = new Map<string, number>();
const IS_PROXY = Symbol("IS_PROXY");
/**
 * @classdesc
 * Builder is the abstract foundation for declarative landing-page components.
 * It provides a unified lifecycle for resolving configuration, generating stable namespaces,
 * creating reactive DOM node records, and managing component teardown without leaking state.
 *
 * Concrete builders extend this class to define their own builder identity, stylesheet,
 * render strategy, and initialization behavior while inheriting the shared lifecycle engine.
 *
 * Builder — core lifecycle engine for component-based page rendering
 *
 * @example
 * class HeroBuilder extends Builder<"container" | "title", HeroConfig> {
 *   readonly builderId = "hero";
 *   readonly name = "hero";
 *   readonly stylesheet = "/hero.css";
 *
 *   protected template(typeKey, el, payload) {
 *     if (typeKey === "title") el.textContent = payload?.value ?? "Welcome";
 *   }
 *
 *   public prepare(content, config) {
 *     return this.render("container", content);
 *   }
 *
 *   public initialize() {}
 * }
 *
 * const builder = new HeroBuilder();
 * const element = builder.create({ title: "Hello" });
 *
 * ========== Public Lifecycle API ==========
 *
 * @example
 * builder.create(data, config);
 * builder.destroy();
 * builder.attach(node, "slot.path");
 * builder.detach(node);
 *
 * @template TType - A string literal union representing the allowed selector tokens for the child component.
 * @template TConfig - The builder-specific configuration interface compatible with iBuilderConfig.
 *
 * @author YMGH
 * @version 1.0.0
 */
export abstract class Builder2<TType extends string = string, TConfig extends iBuilderConfig<TType> = iBuilderConfig<TType>> {
  static #namespaceStack: string[] = [];

  public static resetCounters(): void {
    GLOBAL_INSTANCE_COUNTER.clear();
    this.#namespaceStack = [];
    console.log(`🧹 [Builder]: Wiped all instance identity counters.`);
  }

  /**
   * @description
   * Resolves the component's stable runtime identity by generating a deterministic seed,
   * combining it with the current namespace context, and building a selector hierarchy tree.
   * This method also manages a static namespace stack for nested builders and supports
   * explicit overrides when a caller needs to pin a namespace manually.
   *
   * @param content - The source payload used to derive the namespace seed.
   * @param config - Optional builder configuration that can contribute selectors or namespace metadata.
   * @param options - Optional overrides for namespace stack behavior, explicit namespace assignment,
   *   or custom seed generation input.
   *
   * @returns An object containing the resolved namespace, selector hierarchy, seed, and whether
   *   the namespace was pushed to the internal stack during resolution.
   *
   * @protected
   */
  protected ensureIdentity(
    content: any,
    config?: TConfig,
    options?: {
      /** Push resolved namespace onto static stack (for nested builders) */
      pushNamespace?: boolean;
      /** Pop namespace from stack after resolution (for nested builders) */
      popNamespace?: boolean;
      /** Explicit namespace to use instead of resolving */
      explicitNamespace?: string;
      /** Optional config overrides for seed generation */
      seedConfig?: Partial<TConfig>;
    }
  ): {
    /** The resolved unique namespace string */
    namespace: string;
    /** Selector hierarchy tree for this identity */
    hierarchy: Record<string, any>;
    /** The stable hash seed used for namespace generation */
    seed: string;
    /** Whether a new namespace was pushed onto the stack */
    pushed: boolean;
  } {
    // 1. Generate stable hash seed from content + config
    const seed = buildNamespace(content, (options?.seedConfig ?? config) as TConfig | undefined);

    // 2. Resolve namespace (explicit > parent stack > builderId:seed)
    const explicitNamespace = options?.explicitNamespace ?? (config as any)?.namespace ? String((config as any).namespace).trim() : "";
    const parentNamespace = Builder2.#namespaceStack[Builder2.#namespaceStack.length - 1] || null;
    const baseNamespace = explicitNamespace || (
      parentNamespace
        ? `${parentNamespace}:${String(this.builderId)}:${seed}`
        : `${String(this.builderId)}:${seed}`
    );

    // 3. Cache resolved namespace on instance
    this.instanceNamespace = baseNamespace;

    // 4. Optionally push onto static namespace stack for nested builders
    let pushed = false;
    if (options?.pushNamespace) {
      Builder2.#namespaceStack.push(baseNamespace);
      // Builder.pushNamespace(baseNamespace);
      pushed = true;
    }

    // 5. Build selector hierarchy tree from namespace + config selectors
    const hierarchy = selectorToTree(baseNamespace, (config as any)?.selectors as Record<string, any>);

    // 6. Optionally pop namespace (for nested builder cleanup)
    if (options?.popNamespace && pushed) {
      Builder2.#namespaceStack.pop();
    }

    return { namespace: baseNamespace, hierarchy, seed, pushed };
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
  protected instanceNamespace: string | null = null;

  /**
   * Internal reference holder pointing directly to the raw, unmutated data node extracted from the spreadsheet database.
   */
  protected activeLiveThemeId: string = "default";
  #staticHierarchy: Record<string, any> = {};
  /**
   * 👑 LAZY HIERARCHY ENGINE
   * Mengisolasi pengerjaan rekonsiliasi silsilah agar tidak membebani loop render()
   */
  protected hierarchy = {
    get: (): Record<string, any> => {
      return this.#staticHierarchy;
    },

    /**
     * ⚡ BATCH REBUILD RELATIONS (Clean & Fast)
     * Menggunakan properti internal JS __templateId, DOM tetap bersih 100%!
     */
    update: (explicitRootKey?: TType): Record<string, any> => {
      const rootKey = explicitRootKey || ("@container" as TType);
      const rootEl = this.#nodes.get(rootKey)?.element as HTMLElement;

      if (!rootEl) return this.#staticHierarchy;

      // Scan seluruh node yang tersimpan di memori lokal #nodes
      this.#nodes.forEach((_nodeData, _key) => {

      });

      return this.#staticHierarchy;
    }
  };

  /**
 * 👑 THE SEPARATED HYDRATION VALVE (POS KEMENTERIAN PENGISIAN RAHIM DATA)
 * Murni hanya mengurusi penyemprotan teks data spesifik atomik,
 * terisolasi penuh, rapi, dan kebal dari bug hantu selamanya!
 */
  protected abstract template(typeKey: TType, el: HTMLElement, payload?: any, props?: iActionProperty): void;

  /**
   * @description
   * The public entry point for materializing a component tree from input data.
   * Subclasses implement this method to transform the incoming payload into a DOM fragment
   * or a structured collection of elements while preserving the shared builder lifecycle.
   *
   * @param content - The raw data payload or structural object delivered by the caller.
   * @param config - The resolved builder configuration used to shape the rendered output.
   *
   * @returns A fully hydrated DOM element or a record of DOM elements keyed by their logical role.
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

  }

  /**
   * @description
   * Merges the component's default configuration with runtime overrides into a single
   * immutable configuration object. Selector maps are merged deeply so structural rules
   * and HTML attributes from the user config can augment the defaults without replacing
   * them wholesale.
   *
   * @param defaultOptions - The default structural configuration for the builder, including
   *   core properties and selector definitions.
   * @param userConfig - Incoming runtime overrides provided by the caller, theme layer,
   *   or framework controller.
   *
   * @returns A strictly typed, fully populated configuration object ready for runtime ingestion.
   *
   * @template C - The concrete child configuration type that extends the builder's base config.
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

  public setConfig(config: Partial<TConfig>) {
    this.config = this.resolveConfig(this.config, config)
  }

  public errorHandler() {
    const id = this.builderId;
    console.warn(
      `⚠️ [Framework Degraded Mode]: TemplateRegistry is not present!\n` +
      `Global Slotting System and Cross-Builder Live Reactivity are disabled.\n` +
      `Falling back to standalone local memory buffer for builder: "${id}".`
    );
  }

  #cache = new Map<string, HTMLElement>();

  #nodes = new Map<string, iNodeRecordItem>();

  #updates = new Map<TType, { target: any, element: HTMLElement }>

  // 0. Siapkan cache global di luar class atau sebagai private property class untuk cegah memory leak
  #proxyCache = new WeakMap<any, any>();

  protected setProxy(
    key: TType,
    payload: any,
    element: HTMLElement,
    onUpdateCallback?: (target: any, prop: string | symbol, value: any, el: HTMLElement) => void
  ): any {
    function _isProxy(obj: any): boolean {
      return Boolean(obj && typeof obj === "object" && obj[IS_PROXY] === true);
    }

    function _isPlainObjectOrArray(obj: any): boolean {
      if (obj === null || typeof obj !== "object") return false;
      if (obj instanceof String || obj instanceof Number || obj instanceof Boolean) {
        return false;
      }
      if (Array.isArray(obj)) return true;

      const proto = Object.getPrototypeOf(obj);
      return proto === Object.prototype || proto === null;
    }

    if (payload == null || typeof payload !== "object") return payload;
    if (!_isPlainObjectOrArray(payload)) return payload;
    if (_isProxy(payload)) return payload;
    if (payload instanceof Node) return payload;

    // 🟢 CEK CACHE
    if (this.#proxyCache.has(payload)) {
      return this.#proxyCache.get(payload);
    }

    const self = this;

    const updateNodes = (tkey: TType, proxyObj: any) => {
      this.#nodes.set(tkey, {
        key: tkey,
        element: element,
        raw: payload,
        proxy: proxyObj,
        relations: this.hierarchy?.get()?.[tkey]
      });
    };

    const singleProxyObj = new Proxy(payload, {
      get: (target, prop, receiver) => {
        if (prop === IS_PROXY) return true;

        const value = Reflect.get(target, prop, receiver);

        // 🟢 PERBAIKAN 1: Jangan daftarkan nested child ke #nodes induk!
        // Cukup bungkus value dengan Proxy (Gunakan Cache jika ada)
        if (value !== null && _isPlainObjectOrArray(value) && !(value instanceof Node)) {
          // Jika sudah di-cache, langsung ambil dari cache
          if (self.#proxyCache.has(value)) {
            return self.#proxyCache.get(value);
          }
          // Jika belum, panggil setProxy TANPA merusak pendaftaran node induk
          return self.setProxy(key, value, element);
        }
        return value;
      },

      set: (target: any, prop: string | symbol, value: any, receiver: any) => {
        const isArray = Array.isArray(target);
        const oldValue = target[prop];
        const isValueEqual = oldValue === value;

        const success = Reflect.set(target, prop, value, receiver);

        if (success) {
          // 🟢 PERBAIKAN 2: Tangani mutasi Array (seperti splice/length) dengan tepat
          const isArrayLengthChange = isArray && prop === "length";
          const isArrayMutated = isArray && !isNaN(Number(prop));

          // Trigger update jika nilai berubah ATAU jika terjadi mutasi Array
          if (!isValueEqual || isArrayLengthChange || isArrayMutated) {
            updateNodes(key, singleProxyObj);
            if (typeof onUpdateCallback === "function") {
              onUpdateCallback(target, prop, value, element);
            } else {
              // Fallback default
              self._runUpdate(key, singleProxyObj, element);
            }
          }
        }
        return success;
      },

      deleteProperty: (target: any, prop: string | symbol) => {
        const hasProp = prop in target;
        const success = Reflect.deleteProperty(target, prop);

        if (success && hasProp) {
          updateNodes(key, singleProxyObj);
          self._runUpdate(key, singleProxyObj, element);
        }
        return success;
      }
    });

    // Simpan ke Cache & Daftarkan ke #nodes
    this.#proxyCache.set(payload, singleProxyObj);
    updateNodes(key, singleProxyObj);

    return singleProxyObj;
  }


  private _runUpdate(key: TType, target: any, element: HTMLElement) {
    if (this.#updates.size === 0) {
      queueMicrotask(() => {
        this.#updates.forEach((context, patchKey) => {
          // this.use(patchKey, context.target, context.element);
          StateMutationEventBus.broadcast(String(patchKey), context.target, context.element);
        });
        this.#updates.clear();
      });
      this.#updates.set(key, { target, element });
    }
  }

  /**
   * @description
   * Executes the full builder lifecycle from configuration resolution to DOM initialization.
   * The method resolves the effective configuration, derives a stable identity, clears prior
   * node state, renders the component tree, and calls the subclass initializer so interactive
   * bindings are attached only after the DOM has been materialized.
   *
   * @param content - The source data payload used to construct the component tree.
   * @param config - Optional runtime overrides merged into the builder configuration.
   *
   * @returns The root DOM element produced by the builder's prepare/initialize pipeline.
   *
   * @public
   */
  public create(content: iBasicNode, config?: Partial<TConfig>): HTMLElement {
    console.log(content, config)
    const effectiveConfig = config || (content && typeof content === "object" ? (content as any).config : undefined);
    if (effectiveConfig) this.config = this.resolveConfig(this.config, effectiveConfig);

    // Unified identity orchestration: seed, namespace, hierarchy, stack management
    const identity = this.ensureIdentity(content, this.config, { pushNamespace: true, popNamespace: true });
    this.#staticHierarchy = identity.hierarchy;

    try {

      // console.count(`📊 [Core Lifecycle Audit] ${this.builderId.toUpperCase()} .create() called`);
      // const trace = new Error();
      // console.log(`🧭 [Stack Trace for ${this.builderId}]:`, trace.stack?.split("\n").slice(1, 4).join("\n"));

      // 💡 AUTOMATION LIFECYCLE: Bersihkan sisa bita RAM & kunci Tema sebelum anak bersiap!
      this.activeLiveThemeId = this.config?.themeId || document.body.dataset.theme?.replace(/^theme-/, "") || "default";
      this.#nodes.clear();
      // Jalankan persiapan rajutan silsilah milik komponen anak
      const DOMTree = this.prepare(content, this.config) as HTMLElement;
      // if (this.builderId === "tab") console.log(`${this.builderId} Elements Map`, this.#nodes.entries())

      // Detonasi event bindings interaktif klik browser
      this.initialize(DOMTree, content);

      this.hierarchy.update();
      console.log("hierarchy", this.#staticHierarchy)
      // Panggil free function utils pasif kita, 0% mengotori kesucian return HTMLElement!
      return DOMTree;
    } finally {
      // Namespace stack managed by ensureIdentity({ popNamespace: true })
      console.log("[template cache]", this.#cache.entries())
    }

  }

  /**
   * @description
   * Creates and registers a DOM element for the requested selector token using the builder's
   * render pipeline. This method resolves the selector, applies base attributes, stores the
   * element in the local node registry, invokes the subclass template hook, and optionally wraps
   * the element in a structural wrapper chain defined by the selector configuration.
   *
   * The method is intentionally scoped around layout containers and repeating nodes. The actual
   * content injection is delegated to the subclass `template()` implementation so that each builder
   * can populate the container with its own internal structure.
   *
   * @param typeKey - The selector token that identifies the target node in the current builder.
   * @param payload - The runtime data payload associated with the node.
   * @param multiple - When true, the node is treated as a repeatable instance and can coexist
   *   with other records for the same selector token.
   *
   * @returns The created element, or undefined when the selector is not defined for the current builder.
   *
   * @protected
   */
  render(typeKey: TType, payload?: any): HTMLElement | undefined {
    const registerTheme = (key: TType, element: HTMLElement, payload: any, selector: iBuilderSelectorsConfig[TType]) => {
      if (typeof TemplateRegistry !== "undefined" && typeof TemplateRegistry.resolve === "function") {
        try {
          const registryLookupKey = (key === "@container") ? `@${String(this.builderId)}:container` : key;
          const activeHandler = TemplateRegistry.resolve("default", registryLookupKey as string, null);

          if (typeof activeHandler === "function") {
            activeHandler(registryLookupKey as string, element, payload, selector);
          }
        } catch (securityError) {
          console.warn(`[Builder Security Bypass] TemplateRegistry evaluation skipped for key "${String(key)}":`, securityError);
        }
      }
      return;
    };

    const selector = this.config.selectors?.[typeKey];
    if (!selector) return undefined;

    let el: HTMLElement;

    // 1. Ambil dari template jika sudah pernah di-store, atau buat baru
    if (this.#cache.has(typeKey)) {
      const template = this.#cache.get(typeKey)!;
      const fragment = (template as HTMLTemplateElement).content.cloneNode(true) as DocumentFragment;
      el = fragment.firstElementChild as HTMLElement;
    } else {
      const tagName = selector.tagName || "div";
      el = document.createElement(tagName);
      this._applyNodeAttributes(el, selector);

      if (selector.wrapper) {
        const wrapperChain = this._wrapElement(selector.wrapper, el);
        if (wrapperChain) {
          (el as any).__outer = wrapperChain.__outer;
          (el as any).__inner = el;
        }
      }
    }

    // 2. Bikin Proxy & Otomatis Terdaftar di #nodes
    const activePayload = this.setProxy(typeKey, payload, el);

    // 3. Hidrasi data awal via template()
    this.template(typeKey, el, activePayload, selector);

    // 4. Metadata & Emit Event
    setMetadata(el, [this.#nodes.get(typeKey) || {}], typeKey as string);
    registerTheme(typeKey, el, activePayload, this.config.selectors?.[typeKey]!);

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

  /**
   * 📦 STORE: Bertugas menyimpan cetakan murni <template> ke #cache
   * HANYA dipanggil manual oleh developer untuk Komponen Makro yang berharga!
   */
  store(typeKey: TType, element: HTMLElement) {
    if (!this.#cache.has(typeKey)) {
      const templateEl = document.createElement("template");
      // Clone skeleton murni tanpa data terikat
      templateEl.content.appendChild(element.cloneNode(true));
      // StateMutationEventBus.broadcast(String(typeKey), {}, element);
      this.#cache.set(typeKey, templateEl);
    }
  }

  /**
   * ♻️ USE (Dulu 'reuse'): Mengambil Blueprint <template> dari #cache 
   * dan langsung merender instance baru secara instan
   */
  use(typeKey: TType, payload?: any, targetElement?: HTMLElement, selector?: iActionProperty): HTMLElement | undefined {
    // Mode A: Patching Elemen Eksisting
    if (targetElement) {
      this.template(typeKey, targetElement, payload, selector);
      return targetElement;
    }

    // Mode B: Buat/Clone Elemen Baru dari Cetakan
    return this.render(typeKey, payload);
  }


  protected load(key: TType): HTMLElement | null {
    // if (this.builderId === "pricing-card") console.log(this.builderId, "this.load", nodes);
    const node = this.#nodes.get(key)
    console.log({ node })

    return node?.element!;
  }

  protected payload(key: TType): any {
    return this.#nodes.get(key) || null;
  }

  /**
   * @description
   * Removes one or more registered nodes from the active builder instance in a single call.
   * The method detaches the underlying DOM elements from the page and clears the matching
   * records from the local node registry so the builder state stays consistent.
   *
   * @param typeKeys - One or more selector tokens whose live DOM nodes should be removed.
   *
   * @protected
   */
  protected remove(...typeKeys: TType[]): void {
    typeKeys.forEach((key) => {
      const liveElement = this.load(key) as HTMLElement;
      if (liveElement) liveElement.remove();
      this.#nodes.delete(key);
    });
  }

  /**
   * @description
   * Cleans up the builder instance by notifying listeners, removing the root DOM element,
   * clearing the internal node registry, and releasing references held by the instance.
   * This method is the lifecycle termination point for a builder and should be invoked when
   * the component is unmounted or discarded.
   *
   * @param typeKey - Optional selector token used to target a specific root node for removal.
   *   When omitted, the builder attempts to remove the default container node.
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
    const rootElement = this.#nodes.get(typeKey || "@container" as TType)?.element

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

    this.#nodes.clear();
    this.config = null as any;
    this.instanceNamespace = null;

    // console.log(`[Lifecycle Security] _nodes Map successfully liquidated. Memory state at 0B leak.`);
  }


  public attachGlobal(childElement: HTMLElement | any, globalSlotPathKey: string): void {
    if (!globalSlotPathKey) return;

    const attached = ElementCreatedEventBus.attach(childElement, globalSlotPathKey);
    if (!attached) {
      console.warn(`⚠️ [Slotting Warning]: Failed to attach node into target "${globalSlotPathKey}".`);
      return;
    }

    console.log(`🚀 [Independent Slotting]: Welding "${this.builderId}" node into target "${globalSlotPathKey}"`);
  }

  public detachGlobal(childElement: HTMLElement | any): void {
    if (!childElement) return;
    const detached = ElementCreatedEventBus.detach(childElement);
    if (!detached) {
      const el = childElement.element || childElement;
      if (el && el.parentElement) el.remove();
    }
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
      const parsedAttrs: Record<string, string> = {};

      // ====================================================
      // 🧙‍♂️ THE ATTRIBUTE BRACKET EXTRACTOR
      // ====================================================
      const attrRegex = /\[\s*([a-zA-Z0-9_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
      let match;
      while ((match = attrRegex.exec(segment)) !== null) {
        const attrName = match[1];
        const attrValue = match[2];
        parsedAttrs[attrName] = attrValue;
      }

      // Bersihkan segmen string dari blok kurung siku [...] yang sudah diperas
      const cleanSegment = segment.replace(/\[[^\]]*\]/g, "");

      // ====================================================
      // ⚡ FIX TOKENIZER: Memecah berdasarkan batasan penanda . atau #
      // ====================================================
      const tokens = cleanSegment.split(/(?=[.#])/);

      let tagName = "div";
      let id = "";
      const classList: string[] = [];

      // Jika token pertama tidak diawali . atau #, berarti itu adalah Nama Tag
      if (tokens.length > 0 && !tokens[0].startsWith(".") && !tokens[0].startsWith("#")) {
        tagName = tokens[0];
      }

      // Iterasi seluruh token untuk mengumpulkan ID dan Multi-Class secara dinamis
      tokens.forEach((token) => {
        if (!token) return;
        if (token.startsWith("#")) {
          id = token.slice(1);
        } else if (token.startsWith(".")) {
          classList.push(token.slice(1));
        }
      });

      // Mulai cetak fisik elemen boks pembungkus

      const el = document.createElement(tagName);
      if (id) el.id = id;
      if (classList.length > 0) el.className = classList.join(" ");

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
    // 4. 👑 RETURN ASLI ANDA DIIPERTAHANKAN 100%
    // Format objek literal koordinat dua arah tetap utuh sesuai arsitektur framework Anda
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
Object.freeze(Builder2.prototype);

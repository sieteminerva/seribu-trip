
import type { iActionProperty, iBasicNode, iBuilderConfig } from "../../interface";
import { Builder } from "../Base";
import { TemplateRegistry, type TemplateHandler } from "../../Modules/TemplateRegistry";
import "./Menu.css";

export type MenuElementType =
  | "@menu"
  | "@menu>brand"
  | "@menu>hamburger"
  | "@menu>navigations"
  | "@menu>navigations>item"
  | "@menu>actions";

export interface iMenuConfig extends iBuilderConfig<MenuElementType> {
  /** 
   * TOTAL EXTRACTED SELECTORS (Semua elemen diekstrak utuh ke sini!)
   */
  selectors: Record<string, iActionProperty>;

  /** Default route */
  defaultRoute?: string;
  /** Default route */
  themeId?: string;

  /** Valid application routes */
  routes?: string[];

  onNavigate?: (href?: string) => boolean
}

export class MenuBuilderLegacy {
  readonly name: string = "menu";
  readonly stylesheet: string = "";

  readonly config: Required<iMenuConfig>;
  protected isMenuOpened: boolean = false;

  constructor(config: Partial<iMenuConfig> = {}) {
    // DEFAULT SELECTORS PRESET
    const defaultSelectors: Record<string, iActionProperty> = {
      "@menu": { tagName: "nav", className: "nav" },
      "@menu>brand": { tagName: "div", className: "brand", src: "" },
      "@menu>hamburger": { tagName: "button", className: "hamburger-btn" },
      "@menu>navigations": { tagName: "ul", className: "navigations" },
      "@menu>actions": { tagName: "div", className: "actions" }
    };

    const mergedSelectors = { ...defaultSelectors };

    for (const key in config.selectors) {
      mergedSelectors[key] = {
        ...mergedSelectors[key],
        ...config.selectors[key]
      };
    }

    this.config = {
      selectors: mergedSelectors,
      defaultRoute: "home",
      routes: ["home", "package", "gallery", "form"],
      onNavigate(href?: string) {
        if (href) {
          console.info("Navigation handled manually! to:", href);
          return true;
        }
        return false
      },
      ...config
    } as Required<iMenuConfig>;

  }

  //==================================================
  // Public Compiler Entry
  //==================================================

  public create(content: iBasicNode): HTMLElement {
    if (!content || typeof content !== "object") {
      return document.createElement(this.config.selectors["@menu"].tagName!);
    }

    const actionsArray: iActionProperty[] = Array.isArray(content.actions)
      ? content.actions
      : content.actions ? [content.actions] : [];

    const brandPayload = actionsArray[0] || { label: "Brand", href: "#home" };
    const menuLinksPayload = actionsArray.slice(1);

    // Bangun kontainer pembungkus utama berdasarkan selector dinamis
    const navContainer = this.createContainer(content);

    // Susun secara modular
    navContainer.append(
      this.createBrand(brandPayload),
      this.createHamburger(),
      this.createMenuItems(menuLinksPayload),
      this.createActions(menuLinksPayload)
    );

    this.initialize(navContainer);

    return navContainer;
  }

  //==================================================
  // Initialization & Interaction Loop
  //==================================================

  protected initialize(nav: HTMLElement): void {
    const hamburgerSel = this.config.selectors["@menu>hamburger"];
    const itemsSel = this.config.selectors["@menu>navigations"];

    const hamburgerBtn = nav.querySelector(`.${hamburgerSel.className!.split(" ")[0]}`);
    const itemsList = nav.querySelector(`.${itemsSel.className!.split(" ")[0]}`);

    if (hamburgerBtn && itemsList) {
      hamburgerBtn.addEventListener("click", () => {
        this.isMenuOpened = !this.isMenuOpened;

        /* overrides */
        const handled = true;
        if (handled === true) {
          // console.log("[Menu Engine] Navigation toggle logic intercepted by external controller. Internal animation bypassed.");
          return;
        }

        // small viewport action
        itemsList.classList.toggle("active", this.isMenuOpened);
        hamburgerBtn.classList.toggle("open", this.isMenuOpened);
      });
    }
  }

  // Navigation
  public navigate(href?: string): void {
    if (href) {
      window.location.hash = href.replace(/^#/, "");
    }
  }

  // Headless Element Builders
  protected createContainer(content: any): HTMLElement {
    const selector = this.config.selectors["@menu"];
    const nav = document.createElement(selector.tagName!);
    nav.className = selector.className as string;

    if (content.id) nav.id = content.id;
    if (content.className) nav.classList.add(content.className);

    this.config.emit?.("elementAdded", {
      builder: "menu", type: "@menu", element: nav, data: {}
    });

    return nav;
  }

  protected createBrand(action: iActionProperty): HTMLElement {
    const selector = this.config.selectors["@menu>brand"];
    const el = document.createElement(selector.tagName!);
    el.className = selector.className as string;

    const link = document.createElement("a");
    link.href = action.href || "#home";

    // LOGO SRC DIGANDENG MASUK KE SELECTORS 
    if (selector.src) {
      const img = document.createElement("img");
      img.src = selector.src;
      img.alt = action.label || "logo";
      link.appendChild(img);
    } else {
      link.textContent = action.label || "Brand";
    }

    this.bindNavigation(link, link.href);
    el.appendChild(link);

    this.config.emit?.("elementAdded", {
      builder: "menu", type: "@menu>brand", element: el, data: {}
    });

    return el;
  }

  protected createHamburger(): HTMLElement {
    const selector = this.config.selectors["@menu>hamburger"];
    const el = document.createElement(selector.tagName!);
    el.className = selector.className as string;
    el.setAttribute('aria-label', 'Toggle menu');

    // Jika tag berupa button bawaan, pasang tipe datanya secara tertib
    if (selector.tagName!.toLowerCase() === "button") {
      (el as HTMLButtonElement).type = 'button';
    }

    // Berikan inner HTML bawaan jika desainer malas menyuapkan SVG kustom dari luar
    el.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';

    this.config.emit?.("elementAdded", {
      builder: "menu", type: "@menu>hamburger", element: el, data: {}
    });

    return el;
  }

  protected createMenuItems(actions: iActionProperty[]): HTMLElement {
    const selector = this.config.selectors["@menu>navigations"];
    const linksContainer = document.createElement(selector.tagName!);
    linksContainer.className = selector.className as string;

    // Saring tautan menu standar yang bukan bertindak sebagai tombol aksi visual button
    const standardLinks = actions.filter(link => link.className !== "button" && !link.href?.includes("tel:"));

    for (const link of standardLinks) {
      const li = document.createElement('li');
      // reserved li.className
      const a = document.createElement('a');

      if (link?.id) a.id = link.id;
      if (link?.className) a.className = link.className;

      a.href = link?.href || "#";
      a.textContent = link?.label || "";

      this.bindNavigation(a, a.href);
      li.appendChild(a);
      linksContainer.appendChild(li);
    }

    this.config.emit?.("elementAdded", {
      builder: "menu", type: "@menu>navigations", element: linksContainer, data: actions
    });

    return linksContainer;
  }

  protected createActions(actionsPayload: iActionProperty[]): HTMLElement {
    const selector = this.config.selectors["@menu>actions"];
    const actionsContainer = document.createElement(selector.tagName!);
    actionsContainer.className = selector.className as string;

    const ctaPayload = actionsPayload.find(link => link.className === "button" || link.href?.includes("tel:"));

    if (ctaPayload) {
      // Pasang tombol aksi kustom dinamis bawaan data Sheets
      const el = document.createElement('a');
      el.className = ctaPayload.className || 'button small';
      el.href = ctaPayload.href || '#form';
      el.textContent = ctaPayload.label || 'Hubungi';
      if (ctaPayload.id) el.id = ctaPayload.id;

      this.bindNavigation(el, el.href);
      actionsContainer.appendChild(el);
    }

    this.config.emit?.("elementAdded", {
      builder: "menu", type: "@menu>actions", element: actionsContainer, data: actionsPayload
    });

    return actionsContainer;
  }


  protected bindNavigation(
    element: HTMLAnchorElement,
    href?: string
  ): void {
    let targetHref = (href || element.getAttribute("href") || this.config.defaultRoute || "home").trim();

    if (targetHref.includes(window.location.origin) || targetHref.includes(window.location.host)) {
      if (targetHref.includes("#")) {
        const parts = targetHref.split("#").filter(Boolean);
        const validPathParts = parts.filter(part => !part.includes("://") && !part.includes("localhost") && !part.includes(".com"));
        targetHref = validPathParts.join("#").trim();
      }
    }

    // Set visualisasi href di level DOM agar address bar browser tetap rapi bawa tanda pagar
    element.href = targetHref.startsWith("#") ? targetHref : `#${targetHref}`;

    element.addEventListener("click", (e: MouseEvent) => {
      // 🔒 LOCK VETO UTLAK: Browser native dilarang keras melompat liar/buka tab baru!
      e.preventDefault();

      const isExternalLink = targetHref.includes("://") || targetHref.startsWith("//") || targetHref.startsWith("www.");

      if (!isExternalLink) {

        const cleanRoutePayload = targetHref.replace(/^#/, "").trim();

        // Tembakkan eksekusi callback luar milik LandingPageBuilder Anda
        const handled = this.config.onNavigate(cleanRoutePayload);

        // Jika dari luar mengembalikan true (sudah dihandle penuh), matikan fungsi fallback internal!
        if (handled === true) {
          return;
        }

        // Fallback internal hanya berjalan jika MenuBuilder dipakai terpisah tanpa router luar
        // Ambil nama halaman terdepannya saja jika terpaksa meluncur terpisah
        const [routePart] = cleanRoutePayload.split("#");
        this.navigate(routePart || "home");
      } else {
        // Hanya tautan luar pihak ketiga asli yang diizinkan melesat membuka tab baru!
        window.open(targetHref, "_blank");
      }
    });
  }

}

export class MenuBuilder2 {
  readonly builderId = "menu";
  readonly name: string = "menu";
  readonly stylesheet: string = "";
  readonly config: Required<iMenuConfig>;

  protected isMenuOpened: boolean = false;
  protected rawDataNode: any = null;

  protected readonly defaultTemplate: TemplateHandler = this.template.bind(this);

  constructor(config: Partial<iMenuConfig> = {}) {
    // 💡 DEKLARASI DEKLARATIF TERTIZZ: Tambahkan 'isArray: true' sesuai instruksi cerdas Anda!
    // Ini menandakan bahwa elemen setelah tanda '>' adalah cetakan loop dinamis.
    const defaultSelectors: Record<MenuElementType, iActionProperty> = {
      "@menu": { tagName: "nav", className: "nav" },
      "@menu>brand": { tagName: "div", className: "brand", src: "" },
      "@menu>hamburger": { tagName: "button", className: "hamburger-btn", attrs: { "aria-label": "Toggle menu" } },
      "@menu>navigations": { tagName: "ul", className: "navigations", isArray: true }, // 💡 Penanda Loop Dinamis!
      "@menu>navigations>item": { tagName: "li", className: "item" }, // Otomatis dilewati Phase 1 karena induknya isArray!
      "@menu>actions": { tagName: "div", className: "actions" }
    };

    const mergedSelectors = { ...defaultSelectors };
    if (config.selectors) {
      for (const key in config.selectors) {
        if (Object.prototype.hasOwnProperty.call(config.selectors, key)) {
          mergedSelectors[key as MenuElementType] = { ...mergedSelectors[key as MenuElementType], ...config.selectors[key] };
        }
      }
    }

    this.config = {
      selectors: mergedSelectors,
      defaultRoute: "home",
      routes: ["home", "package", "gallery", "form"],
      emit: undefined,
      onNavigate(href?: string) { return href ? true : false; },
      ...config
    } as Required<iMenuConfig>;
  }

  //==================================================
  // 👑 PIPELINE LIFECYCLE V2 (MURNI METAMORFORSIS ALUR)
  //==================================================

  public create(content: iBasicNode): HTMLElement {
    if (!content || typeof content !== "object") return document.createElement(this.config.selectors["@menu"].tagName || "nav");
    this.rawDataNode = content;

    // 1. Pembuatan Element secara murni Generic
    const renderedNodes = this.createElements();

    // 2. Perakitan Pohon Hierarki secara murni Generic
    this.attachHierarchy(renderedNodes);

    // 3. Penyuntikan Konten & Logika Bisnis (Hydration Zone)
    this.hydrate(renderedNodes, content);

    const rootElement = renderedNodes.get("@menu") as HTMLElement;

    // 4. Pemancaran Event Daur Hidup Terpisah
    this.emitElements(renderedNodes);

    // 5. Pengikatan Event Interaksi Runtime
    this.initialize(rootElement);

    return rootElement;
  }

  // ====================================================
  // 🧱 GENERIC PLATFORM CORE METHODS (BAKAL CALON UTAMA BUILDERBASE)
  // ====================================================

  /**
   * PHASE 1: Membuat HTMLElement statis secara murni generic
   */
  protected createElements(): Map<string, HTMLElement> {
    const renderedNodes = new Map<string, HTMLElement>();

    Object.entries(this.config.selectors).forEach(([key, selector]: [string, any]) => {
      // 🧙‍♂️ SENSOR INTELLIGENT LINEAGE ISARRAY (RADIKAL DAN AMAN!)
      // Pecah kuncinya. Cari tahu apakah induknya memiliki properti 'isArray: true'?
      const pathParts = key.split(">");
      if (pathParts.length > 1) {
        const parentKey = pathParts.slice(0, -1).join(">");
        const parentSelector = this.config.selectors[parentKey];
        // 🚨 JIKA INDUKNYA ISARRAY, MAKA ELEMEN INI ADALAH TEMPLATE LOOP DINAMIS! 
        // Stop, dilarang keras dicetak di Phase 1 karena harus menunggu semburan data database Sheets!
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

  /**
   * PHASE 2: Menyusun silsilah penempelan pohon DOM secara murni generic
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
   * PHASE 4: Memancarkan event daur hidup secara terpusat setelah seluruh DOM matang
   */
  protected emitElements(renderedNodes: Map<string, HTMLElement>): void {
    renderedNodes.forEach((el, key) => {
      this.config.emit?.("elementAdded", { builder: this.builderId, type: key as MenuElementType, element: el, data: this.rawDataNode });
    });
  }

  // ====================================================
  // 🧙‍♂️ PHASE 3: THE HYDRATE ORCHESTRATOR (MURNI HANYA PENGATUR DATA)
  // Menghancurkan total semua if-else pengecekan string kaku! 
  // Murni hanya memetakan payload dan mengalirkan proses ke rahim .template()!
  // ====================================================
  protected hydrate(renderedNodes: Map<string, HTMLElement>, content: any): void {
    const payloadMap = this.resolvePayload(content);

    // Tarik nilai identitas tema live dari level dataset dokumen HTML asli peramban
    renderedNodes.forEach((el, key) => {
      const selector = this.config.selectors[key];
      const payloadData = payloadMap[key];

      if (selector && selector.isArray) {
        const childTemplateKey = `${key}>item`;
        const itemTemplateSelector = this.config.selectors[childTemplateKey];
        const standardLinks = (payloadData as iActionProperty[]).filter(link => link.className !== "button" && !link.href?.includes("tel:"));

        standardLinks.forEach((linkItemData) => {
          const childLi = document.createElement(itemTemplateSelector.tagName || "li");
          if (itemTemplateSelector.className) childLi.className = itemTemplateSelector.className;
          if (itemTemplateSelector.attrs) {
            Object.entries(itemTemplateSelector.attrs).forEach(([k, v]) => childLi.setAttribute(k, String(v)));
          }

          // 💡 SINKRONISASI CACHED: Panggil this.defaultTemplate secara hemat memori!
          const activeHandler = TemplateRegistry.resolve(this.config.themeId, childTemplateKey, this.defaultTemplate);
          activeHandler(childTemplateKey, childLi, linkItemData, itemTemplateSelector);

          el.appendChild(childLi);
        });
      }
      else {
        // 💡 SINKRONISASI CACHED: Panggil this.defaultTemplate secara hemat memori!
        const activeHandler = TemplateRegistry.resolve(this.config.themeId, key, this.defaultTemplate);
        activeHandler(key, el, payloadData, selector);
      }
    });
  }

  protected resolvePayload(content: any): Record<string, any> {
    const actionsArray: iActionProperty[] = Array.isArray(content.actions) ? content.actions : content.actions ? [content.actions] : [];
    return {
      "@menu": content,
      "@menu>brand": actionsArray || { label: "Brand", href: "#home" },
      "@menu>hamburger": {},
      "@menu>navigations": actionsArray,
      "@menu>navigations>item": {},
      "@menu>actions": actionsArray
    };
  }

  // ====================================================
  // 🧙‍♂️ THE SOVEREIGN META-TEMPLATE FACTORY (IDE BERLIAN ANDA!)
  // Wadah satu pintu tempat merakit isi perut HTML secara spesifik (Sementara di-hardcoding)
  // Menghilangkan 100% polusi perkondisian di dalam metode hydrate()!
  // ====================================================
  /**
 * 🏗️ ADAPTASI SAKRAL 2: THE IMMUTABLE DEFAULT STRUCTURAL FACTORY
 * Mengunci logika bisnis default komponen Menu dengan asupan bentuk objek yang 100% selaras!
 */
  protected template(typeKey: string, el: HTMLElement, payload: any, selector: any): void {

    // 🧪 KASUS A: KONTAINER UTAMA NAVBAR (@menu)
    if (typeKey === "@menu") {
      if (payload.id) el.id = payload.id;
      if (payload.className) el.classList.add(payload.className);
    }

    // 🧪 KASUS B: LOGO BRAND (@menu>brand)
    else if (typeKey === "@menu>brand") {
      const link = document.createElement("a");
      link.href = payload.href || "#home";

      if (selector.src) {
        const img = document.createElement("img");
        img.src = selector.src;
        img.alt = payload.label || "logo";
        link.appendChild(img);
      } else {
        link.textContent = payload.label || "Brand";
      }

      this.bindNavigation(link, link.href);
      el.appendChild(link);
    }

    // 🧪 KASUS C: TOMBOL HAMBURGER (@menu>hamburger)
    else if (typeKey === "@menu>hamburger") {
      if (selector.tagName?.toLowerCase() === "button") (el as HTMLButtonElement).type = "button";
      if (!el.innerHTML) {
        el.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      }
    }

    // 🧪 KASUS D: BARIS BUTIR ITEM NAVIGASI LOOPING (@menu>navigations>item)
    // 💡 FIX SAKRAL: Sekarang payload dijamin 100% bertipe objek item tunggal hasil semburan loop dari hydrate()!
    else if (typeKey === "@menu>navigations>item") {
      const a = document.createElement("a");
      if (payload.id) a.id = payload.id;
      if (payload.className) a.className = payload.className;

      a.href = payload.href || "#";
      a.textContent = payload.label || "";

      this.bindNavigation(a, a.href);
      el.appendChild(a); // Tempelkan tag <a> ke dalam kulit <li> hantaran parameter el
    }

    // 🧪 KASUS E: TOMBOL AKSEN HUBUNGI KANAN (@menu>actions)
    else if (typeKey === "@menu>actions") {
      const actionsList = Array.isArray(payload) ? payload : [];
      // Saring secara akurat untuk mencari tombol CTA di dalam array hantaran resolvePayload
      const ctaPayload = actionsList.find(link => link.className === "button" || link.href?.includes("tel:"));

      if (ctaPayload) {
        const btn = document.createElement("a");
        btn.className = ctaPayload.className || "button small";
        btn.href = ctaPayload.href || "#form";
        btn.textContent = ctaPayload.label || "Hubungi";

        if (ctaPayload.id) btn.id = ctaPayload.id;

        this.bindNavigation(btn, btn.href);
        el.appendChild(btn);
      }
    }
  }

  //==================================================
  // 🪐 REQUIRED PUBLIC APIS (TIDAK BERUBAH)
  //==================================================

  public initialize(nav: HTMLElement): void {
    const hamburgerSel = this.config.selectors["@menu>hamburger"];
    const itemsSel = this.config.selectors["@menu>navigations"];

    const hamburgerBtn = nav.querySelector(`.${hamburgerSel.className!.split(" ")[0]}`) as HTMLElement;
    const itemsList = nav.querySelector(`.${itemsSel.className!.split(" ")[0]}`) as HTMLElement;

    if (hamburgerBtn && itemsList) {
      hamburgerBtn.addEventListener("click", () => {
        this.isMenuOpened = !this.isMenuOpened;
        let isDefaultPrevented = false;

        this.config.emit?.("builder:menu-toggle" as any, {
          opened: this.isMenuOpened, element: hamburgerBtn, preventDefault: () => { isDefaultPrevented = true; }
        });

        if (isDefaultPrevented) return;
        itemsList.classList.toggle("active", this.isMenuOpened);
        hamburgerBtn.classList.toggle("open", this.isMenuOpened);
      });
    }
  }


  public navigate(href?: string): void {
    if (href) window.location.hash = href.replace(/^#/, "");
  }

  protected bindNavigation(element: HTMLAnchorElement, href?: string): void {
    let rawTargetHref = (href || element.getAttribute("href") || this.config.defaultRoute || "home").trim();
    if (rawTargetHref.includes(window.location.origin) || rawTargetHref.includes(window.location.host)) {
      if (rawTargetHref.includes("#")) {
        rawTargetHref = rawTargetHref.split("#").filter(Boolean).filter(part => !part.includes("://") && !part.includes("localhost") && !part.includes(".com")).join("#").trim();
      }
    } element.href = rawTargetHref.startsWith("#") ? rawTargetHref : `#${rawTargetHref}`;
    element.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      if (!rawTargetHref.includes("://") && !rawTargetHref.startsWith("//") && !rawTargetHref.startsWith("www.")) {
        let cleanRoute: string = String(rawTargetHref).replace(/^#/, "").trim();
        if (cleanRoute.includes(":")) cleanRoute = String(cleanRoute.split(":")[0]).trim();
        if (cleanRoute.includes("?")) cleanRoute = String(cleanRoute.split("?")[0]).trim();
        const finalRouteString = cleanRoute || "home";
        const handled = this.config.onNavigate(finalRouteString);
        if (handled === true) return; this.navigate(finalRouteString);
      } else {
        window.open(rawTargetHref, "_blank");
      }
    });
  }
}


export class MenuBuilder extends Builder {
  readonly builderId = "menu";
  readonly name = "menu";
  readonly stylesheet = "";
  readonly config: Required<iMenuConfig>;

  // Caching internal bind(this) hemat memori
  protected readonly defaultTemplate: TemplateHandler = this.template.bind(this);

  protected isMenuOpened: boolean = false;
  protected rawDataNode: any = null;


  constructor(config: Partial<iMenuConfig> = {}) {
    super(); // Wajib mengetuk pintu rahim induk BuilderBase

    const defaultSelectors: Record<MenuElementType, any> = {
      "@menu": { tagName: "nav", className: "nav" },
      "@menu>brand": { tagName: "div", className: "brand", src: "" },
      "@menu>hamburger": { tagName: "button", className: "hamburger-btn", attrs: { "aria-label": "Toggle menu" } },
      "@menu>navigations": { tagName: "ul", className: "navigations", isArray: true },
      "@menu>navigations>item": { tagName: "li", className: "item" },
      "@menu>actions": { tagName: "div", className: "actions" }
    };

    const mergedSelectors = { ...defaultSelectors };
    if (config.selectors) {
      for (const key in config.selectors) {
        if (Object.prototype.hasOwnProperty.call(config.selectors, key)) {
          mergedSelectors[key as MenuElementType] = { ...mergedSelectors[key as MenuElementType], ...config.selectors[key] };
        }
      }
    }

    this.config = {
      selectors: mergedSelectors,
      defaultRoute: "home",
      routes: ["home", "package", "gallery", "form"],
      emit: undefined,
      onNavigate(href?: string) { return href ? true : false; },
      ...config
    } as Required<iMenuConfig>;
  }

  // ====================================================
  // 🧙‍♂️ OVERRIDE 1: ABSTRAKSI PETA DATA (MURNI KHUSUS UNTUK DATA MENU)
  // ====================================================
  // Inside MenuBuilder.ts

  /**
   * 🏗️ RE-ENGINEERING DATA RESOLVER (PERBAIKAN KUNCI UTAMA ANDA!)
   * Memotong, mengiris (slice), dan memisahkan data linear Sheets menjadi 3 seksi bersih.
   * Menjamin level TemplateRegistry dan Tema Kustom murni hanya menerima data yang sudah matang!
   */
  protected resolvePayload(content: any): Record<string, any> {
    const actionsArray: iActionProperty[] = Array.isArray(content.actions)
      ? content.actions
      : content.actions ? [content.actions] : [];

    // 🔬 SEKSI 1: Ekstrak Brand Data (Murni hanya mengambil indeks pertama)
    const brandPayload = actionsArray[0] || { label: "Brand", href: "#home" };

    // 🔬 SEKSI 2: Ekstrak Link Navigasi (Buang indeks [0] logo, dan buang tombol CTA)
    const navigationLinksPayload = actionsArray.slice(1).filter(
      link => link.className !== "button" && !link.href?.includes("tel:")
    );

    // 🔬 SEKSI 3: Ekstrak Tombol Aksi CTA (Murni hanya mengambil objek tombol)
    const ctaPayload = actionsArray.slice(1).find(
      link => link.className === "button" || link.href?.includes("tel:")
    ) || null;

    return {
      "@menu": content,
      "@menu>brand": brandPayload,             // 🟢 Sudah berupa Objek Brand Tunggal Bersih!
      "@menu>hamburger": {},
      "@menu>navigations": navigationLinksPayload, // 🟢 Sudah berupa Array Links Bersih tanpa polusi logo/CTA!
      "@menu>navigations>item": {},            // Dikonsumsi per-item saat loop dinamis di dalam hydrate()
      "@menu>actions": ctaPayload              // 🟢 Sudah berupa Objek CTA Tunggal Bersih (atau null)!
    };
  }


  // ====================================================
  // 🧙‍♂️ OVERRIDE 2: PERAKIT STRUKTUR CONTENT DEFAULT FALLBACK KOMPONEN MENU
  // ====================================================
  protected template(typeKey: string, el: HTMLElement, payload: any, selector: any): void {

    // 🧪 KASUS A: KONTAINER UTAMA NAVBAR (@menu)
    if (typeKey === "@menu") {
      if (payload.id) el.id = payload.id;
      if (payload.className) el.classList.add(payload.className);
    }

    // 🧪 KASUS B: LOGO BRAND (@menu>brand)
    else if (typeKey === "@menu>brand") {

      const link = document.createElement("a");
      link.href = payload.href || "#home";

      if (selector.src) {
        const img = document.createElement("img");
        img.src = selector.src;
        img.alt = payload.label || "logo";
        link.appendChild(img);
      } else {
        link.textContent = payload.label || "Brand";
      }

      this.bindNavigation(link, link.href);
      el.appendChild(link);
    }

    // 🧪 KASUS C: TOMBOL HAMBURGER (@menu>hamburger)
    else if (typeKey === "@menu>hamburger") {
      if (selector.tagName?.toLowerCase() === "button") (el as HTMLButtonElement).type = "button";
      if (!el.innerHTML) {
        el.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      }
    }

    // 🧪 KASUS D: BARIS BUTIR ITEM NAVIGASI LOOPING (@menu>navigations>item)
    // 💡 FIX SAKRAL: Sekarang payload dijamin 100% bertipe objek item tunggal hasil semburan loop dari hydrate()!
    else if (typeKey === "@menu>navigations>item") {
      const a = document.createElement("a");
      if (payload.id) a.id = payload.id;
      if (payload.className) a.className = payload.className;

      a.href = payload.href || "#";
      a.textContent = payload.label || "";

      this.bindNavigation(a, a.href);
      el.appendChild(a); // Tempelkan tag <a> ke dalam kulit <li> hantaran parameter el
    }

    // 🧪 KASUS E: TOMBOL AKSEN HUBUNGI KANAN (@menu>actions)
    else if (typeKey === "@menu>actions") {
      const actionsList = Array.isArray(payload) ? payload : [];
      // Saring secara akurat untuk mencari tombol CTA di dalam array hantaran resolvePayload
      const ctaPayload = actionsList.find(link => link.className === "button" || link.href?.includes("tel:"));

      if (ctaPayload) {
        const btn = document.createElement("a");
        btn.className = ctaPayload.className || "button small";
        btn.href = ctaPayload.href || "#form";
        btn.textContent = ctaPayload.label || "Hubungi";

        if (ctaPayload.id) btn.id = ctaPayload.id;

        this.bindNavigation(btn, btn.href);
        el.appendChild(btn);
      }
    }
  }

  // ====================================================
  // OVERRIDE 3: INTERAKSI RUNTIME TOMBOL HAMBURGER NAVBAR
  // ====================================================
  public initialize(nav: HTMLElement): void {
    const hamburgerSel = this.config.selectors["@menu>hamburger"];
    const itemsSel = this.config.selectors["@menu>navigations"];

    const hamburgerBtn = nav.querySelector(`.${hamburgerSel.className!.split(" ")}`) as HTMLElement;
    const itemsList = nav.querySelector(`.${itemsSel.className!.split(" ")}`) as HTMLElement;

    if (hamburgerBtn && itemsList) {
      hamburgerBtn.addEventListener("click", () => {
        this.isMenuOpened = !this.isMenuOpened;
        let isDefaultPrevented = false;
        this.config.emit?.("builder:menu-toggle" as any, {
          opened: this.isMenuOpened, element: hamburgerBtn, preventDefault: () => { isDefaultPrevented = true; }
        });
        if (isDefaultPrevented) return;
        itemsList.classList.toggle("active", this.isMenuOpened);
        hamburgerBtn.classList.toggle("open", this.isMenuOpened);
      });
    }
  }

  public navigate(href?: string): void {
    if (href) window.location.hash = href.replace(/^#/, "");
  }

  protected bindNavigation(element: HTMLAnchorElement, href?: string): void {
    let rawTargetHref = (href || element.getAttribute("href") || this.config.defaultRoute || "home").trim();
    if (rawTargetHref.includes(window.location.origin) || rawTargetHref.includes(window.location.host)) {
      if (rawTargetHref.includes("#")) {
        rawTargetHref = rawTargetHref.split("#").filter(Boolean).filter(part => !part.includes("://") && !part.includes("localhost") && !part.includes(".com")).join("#").trim();
      }
    } element.href = rawTargetHref.startsWith("#") ? rawTargetHref : `#${rawTargetHref}`;
    element.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      if (!rawTargetHref.includes("://") && !rawTargetHref.startsWith("//") && !rawTargetHref.startsWith("www.")) {
        let cleanRoute: string = String(rawTargetHref).replace(/^#/, "").trim();
        if (cleanRoute.includes(":")) cleanRoute = String(cleanRoute.split(":")[0]).trim();
        if (cleanRoute.includes("?")) cleanRoute = String(cleanRoute.split("?")[0]).trim();
        const finalRouteString = cleanRoute || "home";
        const handled = this.config.onNavigate(finalRouteString);
        if (handled === true) return; this.navigate(finalRouteString);
      } else {
        window.open(rawTargetHref, "_blank");
      }
    });
  }
}
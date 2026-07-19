
import type { iActionProperty, iBasicNode, iBuilderConfig } from "../../interface";
import { BuilderRenderer, type iBuilder } from "../../Modules/BuilderRenderer";
import { type TemplateHandler } from "../../Modules/TemplateRegistry";
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
  selectors: Record<MenuElementType, iActionProperty>;

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

  public config: Required<iMenuConfig>;
  protected isMenuOpened: boolean = false;

  constructor(config: Partial<iMenuConfig> = {}) {
    // DEFAULT SELECTORS PRESET
    const defaultSelectors: Record<MenuElementType, iActionProperty> = {
      "@menu": { tagName: "nav", className: "nav" },
      "@menu>brand": { tagName: "div", className: "brand", src: "" },
      "@menu>hamburger": { tagName: "button", className: "hamburger-btn" },
      "@menu>navigations": { tagName: "ul", className: "navigations" },
      "@menu>navigations>item": { tagName: "li", className: "item" },
      "@menu>actions": { tagName: "div", className: "actions" }
    };

    const mergedSelectors = { ...defaultSelectors } as Record<MenuElementType, iActionProperty>;

    for (const key in config.selectors) {
      mergedSelectors[key as MenuElementType] = {
        ...mergedSelectors[key as MenuElementType],
        ...config.selectors[key as MenuElementType]
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

export class MenuBuilder implements iBuilder<MenuElementType> {
  readonly builderId = "menu";
  readonly name = "menu";
  readonly stylesheet = "./Menu.css";
  public config!: Required<iMenuConfig>;

  // Caching internal bind(this) hemat memori
  protected readonly defaultTemplate: TemplateHandler = this.template.bind(this);

  protected isMenuOpened: boolean = false;
  protected rawDataNode: any = null;

  constructor(config: Partial<iMenuConfig> = {}) {
    const defaultSelectors: Record<MenuElementType, iActionProperty> = {
      "@menu": { tagName: "nav", className: "nav" },
      "@menu>brand": { tagName: "div", className: "brand", src: "" },
      "@menu>hamburger": { tagName: "button", className: "hamburger-btn", attrs: { "aria-label": "Toggle menu" } },
      "@menu>navigations": { tagName: "ul", className: "navigations", isArray: true },
      "@menu>navigations>item": { tagName: "li", className: "item" },
      "@menu>actions": { tagName: "div", className: "actions" }
    };

    const defaultConfig: Required<iMenuConfig> = {
      themeId: "default",
      selectors: defaultSelectors,
      defaultRoute: "home",
      routes: ["home", "package", "gallery", "form"],
      emit: () => { },
      onNavigate(href?: string) { return href ? true : false; },
      ...config
    };


    this.config = BuilderRenderer.resolveConfig<iMenuConfig>(defaultConfig, config);

  }

  create(content: iBasicNode, config?: Partial<iBuilderConfig<MenuElementType>> | undefined): HTMLElement {
    this.config = BuilderRenderer.resolveConfig<iMenuConfig>(this.config, config);
    return BuilderRenderer.compile(this as any, content);
  }

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
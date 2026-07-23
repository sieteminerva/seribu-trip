
import type { iActionProperty, iBasicNode, iBuilderConfig } from "../../interface";
import { Builder } from "../Base";
import "./Menu.css";


export type MenuElementType =
  | "@container"
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

export class MenuBuilder extends Builder<MenuElementType, iMenuConfig> {
  readonly builderId = "menu";
  readonly name = "menu";
  readonly stylesheet = "./Menu.css";
  public config: Required<iMenuConfig>;


  protected isMenuOpened: boolean = false;

  constructor(config: Partial<iMenuConfig> = {}) {
    super(); // Wajib mengetuk pintu rahim induk BuilderBase

    const defaultSelectors: Record<MenuElementType, iActionProperty> = {
      "@container": {},
      "@menu": { tagName: "nav", className: "nav" },
      "@menu>brand": { tagName: "div", className: "brand", attrs: { src: "" } },
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


    this.config = this.resolveConfig(defaultConfig, config);

  }

  public prepare(content: iBasicNode, _config?: Partial<iMenuConfig>): HTMLElement {

    const payload = this.resolvePayload(content);

    const nav = this.render("@menu", payload["@menu"]);
    const brand = this.render("@menu>brand", payload["@menu>brand"]);
    const navigations = this.render("@menu>navigations", payload["@menu>navigations"]);
    for (const p of payload["@menu>navigations>item"]) {
      const item = this.render("@menu>navigations>item", p, true);
      navigations?.append(item!)
    }
    const actions = this.render("@menu>actions", payload["@menu>actions"]);
    const hamburger = this.render("@menu>hamburger", payload["@menu>hamburger"]);

    nav?.append(brand!, hamburger!, navigations!, actions!);

    return this.load("@menu") as HTMLElement;
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
  protected resolvePayload(content: iBasicNode): Record<MenuElementType, any> {
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
      "@menu>brand": brandPayload,
      "@menu>hamburger": {},
      "@menu>navigations": null,
      "@menu>navigations>item": navigationLinksPayload,
      "@menu>actions": ctaPayload
    } as Record<MenuElementType, any>;

  }

  public initialize(): void {
    // ====================================================
    // 🧙‍♂️ DIRECT ELEMENT REF RETRIEVAL (SIHIR MAP OBJECT ANDA!)
    // Karena _nodes mengembalikan Array (mendukung multi-instance), 
    // ambil indeks ke-0 secara aman karena Menu bersifat singleton makro halaman!
    // ====================================================
    const hamburgerBtn = this.load("@menu>hamburger") as HTMLButtonElement;
    const itemsList = this.load("@menu>navigations") as HTMLElement;

    // Kunci gerbang interaksi jika kedua elemen fisik hidup sukses terambil dari saku RAM
    if (hamburgerBtn && itemsList) {
      hamburgerBtn.addEventListener("click", () => {
        this.isMenuOpened = !this.isMenuOpened;
        let isDefaultPrevented = false;

        // Picu emisi event eksternal framework kustom Anda
        this.config.emit?.("builder:menu-toggle" as any, {
          opened: this.isMenuOpened,
          element: hamburgerBtn,
          preventDefault: () => { isDefaultPrevented = true; }
        });

        if (isDefaultPrevented) return;

        // Manipulasi kelas visual secara lurus, linear, dan direct!
        itemsList.classList.toggle("active", this.isMenuOpened);
        hamburgerBtn.classList.toggle("open", this.isMenuOpened);
      });

      console.log("[Menu Lifecycle] Interactive hamburger event bindings attached securely.");
    } else {
      console.warn("[Menu Lifecycle] Initialization skipped. Hamburger or navigation node missing in _nodes storage.");
    }
  }

  // ====================================================
  // 🧙‍♂️ OVERRIDE 2: PERAKIT STRUKTUR CONTENT DEFAULT FALLBACK KOMPONEN MENU
  // ====================================================
  protected template(typeKey: MenuElementType, el: HTMLElement, payload: any): void {
    if (!payload) return;

    // 🧪 KASUS A: KONTAINER UTAMA NAVBAR (@menu)
    if (typeKey === "@menu") {

      if (payload.id) el.id = payload.id;
      if (payload.className) el.classList.add(payload.className);
    }

    // 🧪 KASUS B: LOGO BRAND (@menu>brand)
    else if (typeKey === "@menu>brand") {

      const link = document.createElement("a");
      link.href = payload.href || "#home";

      if (payload.src) {
        const img = document.createElement("img");
        img.src = payload.src;
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

      if (payload.tagName?.toLowerCase() === "button") (el as HTMLButtonElement).type = "button";
      if (!el.innerHTML) {
        el.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
      }
    }

    // 🧪 KASUS D: BARIS BUTIR ITEM NAVIGASI LOOPING (@menu>navigations>item)
    // 💡 FIX SAKRAL: Sekarang payload dijamin 100% bertipe objek item tunggal hasil semburan loop dari template()!
    else if (typeKey === "@menu>navigations") {

    }

    else if (typeKey === "@menu>navigations>item") {
      if (payload.className) el.className = payload.className;

      const a = document.createElement("a");
      if (payload.id) a.id = payload.id;
      if (payload.className) a.className = payload.className;
      a.href = payload.href || "#";
      a.textContent = payload.label || "";

      this.bindNavigation(a, a.href);
      el.appendChild(a);
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



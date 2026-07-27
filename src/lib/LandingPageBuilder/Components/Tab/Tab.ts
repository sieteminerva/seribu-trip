import type { iBasicNode, iBuilderConfig, iBuilderRegistry } from "../../interface";
import { Builder } from "../Base";
import "./Tab.css";

export type TabElementType =
  | "@container"
  | "@tab"
  | "@tab>menu"
  | "@tab>menu>item"
  | "@tab>menu>item>label"
  | "@tab>menu>item>title"
  | "@tab>body"
  | "@tab>panel"
  | "@tab>panel>content"
  | "@tab>panel>content>eyebrow"
  | "@tab>panel>content>title"
  | "@tab>panel>content>desc"
  | "@tab>footer"
  | "@tab>spinner";

export interface iTabConfig extends iBuilderConfig<TabElementType> {
  container?: string | HTMLElement | null;
  menuPosition: "top" | "left" | "bottom" | "right";
  lazyload: boolean;
  minHeight: string;
}


export type iTabMenuProperty = { label: string; title: string; link?: string; id?: string, className?: string } | iBasicNode;
export type iTabItemContent = { title?: string; eyebrow?: string; description?: string; } | iBasicNode;
export type iTabItemProperty = { id?: string; className?: string; content: iTabItemContent } | HTMLElement;
export type iTabFooterProperty = { id?: string; className?: string; text: string };

export interface iTabContent {
  menu?: HTMLElement[] | iTabMenuProperty[] | null;
  body: iTabItemProperty[] | HTMLElement[];
  footer?: HTMLElement | iTabFooterProperty | null;
}

export class TabBuilder extends Builder<TabElementType, iTabConfig> {
  builderId: keyof iBuilderRegistry = "tab";
  name: keyof iBuilderRegistry = "tab";
  stylesheet: string = "./Tab.css";

  // ENKAPSULASI: Menyimpan data body tab secara aman & terisolasi
  #items: iTabItemProperty[] = [];

  // STATE MANAGEMENT INTERNAL
  private currentTabIndex = 0;

  private _listenersTabChanged: ((detail: { index: number; label: string; title: string }) => void)[] = [];
  private _listenersContentLoaded: ((detail: { index: number; element: HTMLElement }) => void)[] = [];
  private _boundKeyDownHandler?: (e: KeyboardEvent) => void;

  constructor(config: Partial<iTabConfig> = {}) {
    super();

    const defaultTabSelectors = {
      "@container": { tagName: "div", className: "tab-widget-wrapper" },
      "@tab": { tagName: "div", className: "tab" },
      "@tab>menu": { tagName: "div", className: "menu" },
      "@tab>menu>item": { tagName: "button", className: "button" },
      "@tab>menu>item>label": { tagName: "span", className: "btn-label" },
      "@tab>menu>item>title": { tagName: "span", className: "btn-title" },
      "@tab>body": { tagName: "div", className: "body" },
      "@tab>panel": { tagName: "div", className: "panel hidden" },
      "@tab>panel>content": { tagName: "div", className: "content" },
      "@tab>panel>content>eyebrow": { tagName: "span", className: "eyebrow" },
      "@tab>panel>content>title": { tagName: "h3", className: "title" },
      "@tab>panel>content>desc": { tagName: "p", className: "desc" },
      "@tab>footer": { tagName: "div", className: "footer" },
      "@tab>spinner": { tagName: "div", className: "spinner hidden" }
    };

    const defaultConfig: Required<iTabConfig> = {
      themeId: "default",
      container: null,
      menuPosition: "top",
      lazyload: true,
      minHeight: "400px",
      selectors: defaultTabSelectors,
      emit: () => { }
    };

    this.config = this.resolveConfig(defaultConfig, config);
  }

  // SETTER PUSAT: Mengamankan data dari manipulasi pihak ketiga
  private set items(newItems: iTabItemProperty[]) {
    if (!Array.isArray(newItems)) {
      console.error("TabBuilder validation failed: Items must be an array.");
      return;
    }
    this.#items = newItems.map(item => {
      if (item instanceof HTMLElement) return item; //<= THE FIX
      return Object.freeze({ ...item })
    });
  }

  private get rootElement(): HTMLElement { return this.load("@tab") as HTMLElement; }
  private get footerElement(): HTMLElement | null { return this.load("@tab>footer") as HTMLElement; }

  public prepare(data: any, _config?: Partial<iTabConfig>): HTMLElement {
    if (_config) this.config = this.resolveConfig(this.config, _config);

    const content: iTabContent = data?.content || data || { body: [] };  // {menu: string[], body: HTMLElement[]}
    // Amankan payload utuh ke rahim @tab di memori pusat agar bisa dijemput getPayload nanti
    const tabRoot = this.render("@tab", null)!;

    this.items = content.body || [];
    this.currentTabIndex = 0;

    const spinner = this.render("@tab>spinner", null);
    if (spinner && tabRoot) tabRoot.appendChild(spinner);

    // Lahirkan boks menu kosong (akan diisi oleh setter jika data datang telat)
    if (content.menu && Array.isArray(content.menu)) {
      const menuElement = this._createMenu(content.menu);
      if (menuElement && tabRoot) tabRoot.appendChild(menuElement);
    }
    const bodyElement = this.render("@tab>body", null)!;

    this._createTabPanels(bodyElement);

    if (content.footer) {
      const footerElement = this.render("@tab>footer", content.footer);
      if (footerElement && tabRoot) tabRoot.appendChild(footerElement);
    }

    this._assembleDOM(tabRoot, bodyElement, this.load("@tab>menu") as HTMLElement);

    // console.log("tab loader:", this.load("@tab"))
    return this.load("@tab") as HTMLElement;

  }

  protected template(typeKey: TabElementType, el: HTMLElement, payload?: any): void {
    switch (typeKey) {
      case "@tab":
        // Kelas tata letak dinamis mengikuti orientasi menu (top/bottom/left/right)
        el.className = `tab position-${this.config.menuPosition} ${el.className || ""}`.trim();
        el.style.minHeight = this.config.minHeight;

        if (this.config.container instanceof HTMLElement) {
          el.id = this.config.container.id || el.id;
        }
        break;

      case "@tab>menu":
        el.setAttribute("role", "tablist");
        el.setAttribute("aria-label", "Tab Navigation");
        break;

      case "@tab>menu>item>label":
        el.textContent = !payload.value ? payload?.label : payload.value || "";
        break;

      case "@tab>menu>item>title":
        el.title = !payload.value ? payload?.label : payload.value || "";
        break;

      case "@tab>panel":
        // console.log("panel", { payload }) // <= ini payloadnya sdh bener form element. 
        // const form = new FormBuilder().create(payload.content)
        el.setAttribute("role", "tabpanel");
        if (payload?.id) el.id = payload.id;
        if (payload?.className) el.className = `${el.className} ${payload.className}`.trim();
        if (payload instanceof HTMLElement) el.appendChild(payload)
        break;

      case "@tab>panel>content>eyebrow":
        el.textContent = payload?.eyebrow || "";
        break;

      case "@tab>panel>content>title":
        el.textContent = payload?.title || "";
        break;

      case "@tab>panel>content>desc":
        el.textContent = payload?.description || "";
        break;

      case "@tab>footer":
        if (payload?.id) el.id = payload.id;
        if (payload?.className) el.className = `${el.className} ${payload.className}`.trim();
        el.textContent = payload?.text || "";
        break;
    }
  }


  public initialize(): void {
    const menuElement = this.load("@tab>menu") as HTMLElement;

    if (menuElement) {
      this._boundKeyDownHandler = (e: KeyboardEvent) => this._handleKeyDown(e);
      menuElement.addEventListener("keydown", this._boundKeyDownHandler);
    }

    // Jalankan navigasi awal ke indeks 0 secara otomatis tanpa merusak sirkuit
    this.navigateTo(0);
    console.log("[Tabs v2] Dynamic accessibility tab list initialized successfully.");
  }

  /**
   * Menyusun posisi tumpukan DOM mengikuti orientasi menuPosition
   */
  private _assembleDOM(root: HTMLElement, body: HTMLElement, menu: HTMLElement | null): void {
    const fragment = document.createDocumentFragment();
    // console.log("Tab prepare", { root, body, menu })
    if (this.config.menuPosition === "bottom") {
      fragment.appendChild(body);
      if (menu) fragment.appendChild(menu);
    } else {
      if (menu) fragment.appendChild(menu);
      fragment.appendChild(body);
    }

    // Ambil footer via getter untuk dicek keberadaannya
    if (this.footerElement) {
      fragment.appendChild(this.footerElement);
    }

    root.appendChild(fragment);
  }


  private _createMenu(menuContent: any[]): HTMLElement {
    // console.log({ menuContent })
    const menu = this.render("@tab>menu")!;

    menuContent.forEach((meta, idx) => {
      if (meta instanceof HTMLElement) {
        menu.appendChild(meta);
        return;
      }

      const isLink = !!meta.link;

      // ====================================================
      // 🧙‍♂️ THE MULTI-INSTANCE DETONATOR (PERBAIKAN SAKRAL ANDA!)
      // Wajib suapkan parameter ketiga 'true' secara eksplisit!
      // Memaksa mesin pusat melompati cache singleton dan mencetak 
      // baris tombol menu segar baru sebanyak panjang array Sheets!
      // ====================================================
      const btn = this.render("@tab>menu>item", meta, true) as HTMLElement;

      if (isLink) {
        const a = document.createElement("a");
        a.className = btn.className;
        if (meta.id) a.id = btn.id;
        a.href = meta.link;
        btn.replaceWith(a);
      }

      const rootId = this.rootElement.id || 'gen';
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("tabindex", "-1");
      btn.setAttribute("aria-controls", `tabpanel-${rootId}-${idx}`);
      if (!meta.id) btn.id = `tabbtn-${rootId}-${idx}`;

      // 🟢 Pasang parameter 'true' juga untuk label & judul anak yang ikut ter-loop!
      const spanLabel = this.render("@tab>menu>item>label", meta, true)!;
      const spanTitle = this.render("@tab>menu>item>title", meta, true)!;

      btn.append(spanLabel, spanTitle);

      if (meta.className) btn.classList.add(...meta.className.split(" "));

      btn.onclick = (e) => {
        if (!meta.link) e.preventDefault();
        this.navigateTo(idx);
      };

      menu?.appendChild(btn);
    });

    return this.load("@tab>menu") as HTMLElement;
  }

  private _createTabPanels(body: HTMLElement): void {
    this.#items.forEach((item, idx) => {

      // 🧙‍♂️ MULTI-INSTANCE DETONATOR: Suapkan parameter ketiga 'true' murni khusus loop!
      const panel = this.render("@tab>panel", item, true) as HTMLElement;
      const rootId = this.rootElement.id || 'gen';

      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tabbtn-${rootId}-${idx}`);
      if (!item.id) panel.id = `tabpanel-${rootId}-${idx}`;

      panel.classList.add("hidden");
      panel.style.display = "none";

      if (!this.config.lazyload) {
        this._renderPanelContent(panel, item, idx);
      }

      body.appendChild(panel);
    });
  }


  /**
   * Mengisi dan merender konten item ke dalam tab panel fisik
   */
  private _renderPanelContent(panel: HTMLElement, item: any, index: number): void {
    if (panel.dataset.loaded === "true") return;

    const content = item?.content ? item.content : item;

    // console.log("_renderPanelContent:", { content, item }) // doconvert jadi object ya? {[index: number]: HTMLElement}

    if (content instanceof HTMLElement) {
      panel.append(content);
    } else {
      // 🟢 Pasang parameter 'true' murni karena konten ini meletup di dalam siklus loop detail!
      const contentWrapper = this.render("@tab>panel>content", content, true) as HTMLElement;

      if (content.eyebrow) {
        const span = this.render("@tab>panel>content>eyebrow", content, true)!;
        contentWrapper.appendChild(span);
      }
      if (content.title) {
        const h3 = this.render("@tab>panel>content>title", content, true)!;
        contentWrapper.appendChild(h3);
      }
      if (content.description) {
        const p = this.render("@tab>panel>content>desc" as any, content, true)!;
        contentWrapper.appendChild(p);
      }
      panel.appendChild(contentWrapper);
    }

    panel.dataset.loaded = "true";
    this.config.emit?.("tabs:content-loaded" as any, { index, element: panel });
  }

  public navigateTo(target: number | string): void {
    let targetIndex = -1;

    // A. Skenario Jalur Indeks Angka (Direct Index Targetting)
    if (typeof target === "number") {
      targetIndex = target;
    }
    // B. Skenario Jalur String ID (Custom Identity Targetting)
    else {
      // 🧙‍♂️ DIRECT MEMORY ACCESIBILITY: Jepret seluruh barisan tombol secara instan dari saku RAM!
      const buttons = this.load("@tab>menu>item", "all") as HTMLElement[] || [];
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].id === target) {
          targetIndex = i;
          break;
        }
      }
    }

    // Gerbang Pengaman: Cegah eksekusi jika nomor indeks melompat di luar pagar batas array
    if (targetIndex < 0 || targetIndex >= this.#items.length) return;

    // Nyalakan boks spinner pemuat internal sesaat sebelum perpindahan wajah halaman dimulai
    const spinner = this.load("@tab>spinner") as HTMLElement;
    if (spinner) spinner.classList.remove("hidden");

    // Tembakkan eksekutor mutasi visual tunggal
    this._handleChange(targetIndex);

    // Berikan jeda mikro yang estetik agar efek transisi visual terasa sehalus sutra
    setTimeout(() => {
      if (spinner) spinner.classList.add("hidden");
    }, 150);
  }

  private _handleChange(index: number): void {
    // Jemput seluruh pasukan elemen hidup secara adil dan bersih menggunakan tanda "all"
    const buttons = this.load("@tab>menu>item", "all") as HTMLElement[] || [];
    const panels = this.load("@tab>panel", "all") as HTMLElement[] || [];

    // ====================================================
    // 🫗 FASE 1: LIKUIDASI KONDISI AKTIF PADA TAB SEBELUMNYA
    // ====================================================
    if (buttons[this.currentTabIndex]) {
      const prevBtn = buttons[this.currentTabIndex];
      prevBtn.classList.remove("active"); // Gunakan standard token kelas active v2 Anda
      prevBtn.setAttribute("aria-selected", "false");
      prevBtn.setAttribute("tabindex", "-1");
    }

    if (panels[this.currentTabIndex]) {
      const prevPanel = panels[this.currentTabIndex];
      prevPanel.classList.add("hidden");
      prevPanel.style.display = "none";
    }

    // ====================================================
    // 🌟 FASE 2: DETONASI NYALA PADA TAB BARU TUJUAN USER
    // ====================================================
    this.currentTabIndex = index;

    if (buttons[index]) {
      const activeBtn = buttons[index];
      activeBtn.classList.add("active");
      activeBtn.setAttribute("aria-selected", "true");
      activeBtn.setAttribute("tabindex", "0");

      // Fokuskan mata kursor jika user sedang menggunakan navigasi keyboard arrow keys
      if (document.activeElement && document.activeElement.parentElement === activeBtn.parentElement) {
        activeBtn.focus();
      }
    }

    if (panels[index]) {
      const activePanel = panels[index];

      // 🔮 LAZY-LOAD HYDRATION TRIGGER: Gambar isi rahim konten murni HANYA sesaat sebelum dibuka!
      if (this.config.lazyload) {
        this._renderPanelContent(activePanel, this.#items[index], index);
      }

      activePanel.classList.remove("hidden");
      activePanel.style.display = "block";
    }

    // ====================================================
    // 📢 FASE 3: PIPELINE EMITTER GLOBAL KAYA INFORMASI
    // Semburkan event ke level luar lengkap dengan teks label dan judul tombolnya!
    // ====================================================
    if (buttons[index]) {
      // const btn = buttons[index];
      // const labelText = btn.querySelector(".btn-label")?.textContent || "";
      // const titleText = btn.querySelector(".btn-title")?.textContent || "";
      if (this.config.emit && typeof this.config.emit === "function") {
        this.config.emit?.("elementChanged" as any, {
          builder: this.builderId,
          type: "tab:changed",
          data: index,
          element: panels[index]
        });
      }
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    const buttons = this.load("@tab>menu>item", "all") as HTMLElement[];
    if (!buttons || !buttons.length) return;
    let nextIndex = this.currentTabIndex;
    const isHorizontal = this.config.menuPosition === "top" || this.config.menuPosition === "bottom";
    if (isHorizontal) {
      if (e.key === "ArrowRight") nextIndex = (this.currentTabIndex + 1) % buttons.length;
      else if (e.key === "ArrowLeft") nextIndex = (this.currentTabIndex - 1 + buttons.length) % buttons.length;
      else if (e.key === "Home") nextIndex = 0; else if (e.key === "End") nextIndex = buttons.length - 1;
      else return; // Abaikan tombol keyboard lain
    } else {
      // Kondisi orientasi menu vertikal (left / right)
      if (e.key === "ArrowDown") nextIndex = (this.currentTabIndex + 1) % buttons.length;
      else if (e.key === "ArrowUp") nextIndex = (this.currentTabIndex - 1 + buttons.length) % buttons.length;
      else if (e.key === "Home") nextIndex = 0; else if (e.key === "End") nextIndex = buttons.length - 1;
      else return;
    }
    e.preventDefault();
    this.navigateTo(nextIndex);
    // Paksa fokus keyboard melompat ke elemen tombol aktif yang baru
    (buttons[nextIndex] as HTMLElement).focus();
  }

  public onTabChanged(callback: (detail: { index: number; label: string; title: string }) => void): void {
    if (typeof callback === "function") this._listenersTabChanged.push(callback);
  }

  public onContentLoaded(callback: (detail: { index: number; element: HTMLElement }) => void): void {
    if (typeof callback === "function") this._listenersContentLoaded.push(callback);
  }

  public unmount(): void {
    const menuElement = this.load("@tab>menu") as HTMLElement;
    if (menuElement && this._boundKeyDownHandler) {
      menuElement.removeEventListener("keydown", this._boundKeyDownHandler);
    }
    this.destroy(); // Likuidasi total RAM dari rahim Map privat!
  }

}

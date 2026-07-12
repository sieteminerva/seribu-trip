import "./Tab.css";
export interface iTabConfig {
  container?: string | HTMLElement | null;
  menuPosition: "top" | "left" | "bottom" | "right";
  selectors: iTabSelectors;
  lazyload: boolean;
  minHeight: string;
}

export interface iTabSelectors {
  spinner?: string;        // Default: "spinner"
  tabMenu?: string;        // Default: "tab-menu"
  tabButton?: string;      // Default: "tab-btn"
  tabActive?: string;      // Default: "active"
  tabBody?: string;        // Default: "tab-body"
  tabPanel?: string;       // Default: "tab-panel"
  tabFooter?: string;      // Default: "tab-footer"
}

export type iTabMenuProperty = { label: string; title: string; link?: string; id?: string, className?: string };
export type iTabItemContent = { title?: string; eyebrow?: string; description?: string; };
export type iTabItemProperty = { id?: string; className?: string; content: iTabItemContent | HTMLElement };
export type iTabFooterProperty = { id?: string; className?: string; text: string };

export interface iTabContent {
  menu?: HTMLElement | iTabMenuProperty[] | null;
  body: iTabItemProperty[];
  footer?: HTMLElement | iTabFooterProperty | null;
}

export class TabBuilder {
  private config: iTabConfig;
  private selector: Required<iTabSelectors>;

  // ENKAPSULASI: Menyimpan data body tab secara aman & terisolasi
  #items: iTabItemProperty[] = [];

  // STATE MANAGEMENT INTERNAL
  private currentTabIndex = 0;
  private rootElement!: HTMLElement;
  private menuElement?: HTMLElement;
  private bodyElement!: HTMLElement;
  private footerElement?: HTMLElement;
  private spinnerElement?: HTMLElement;

  private _listenersTabChanged: ((detail: { index: number; label: string; title: string }) => void)[] = [];
  private _listenersContentLoaded: ((detail: { index: number; element: HTMLElement }) => void)[] = [];
  private _boundKeyDownHandler?: (e: KeyboardEvent) => void;

  constructor(config: Partial<iTabConfig>) {
    const defaultSelectors: Required<iTabSelectors> = {
      spinner: "spinner",
      tabMenu: "tab-menu",
      tabButton: "tab-btn",
      tabActive: "active",
      tabBody: "tab-body",
      tabPanel: "tab-panel",
      tabFooter: "tab-footer"
    };

    const defaultConfig: Required<iTabConfig> = {
      container: null,
      menuPosition: "top",
      selectors: defaultSelectors,
      lazyload: true,
      minHeight: "400px"
    };

    this.config = {
      ...defaultConfig,
      ...config,
      selectors: { ...defaultSelectors, ...config?.selectors }
    };

    this.selector = this.config.selectors as Required<iTabSelectors>;
  }

  // SETTER PUSAT: Mengamankan data dari manipulasi pihak ketiga
  public set items(newItems: iTabItemProperty[]) {
    if (!Array.isArray(newItems)) {
      console.error("TabBuilder validation failed: Items must be an array.");
      return;
    }
    this.#items = newItems.map(item => Object.freeze({ ...item }));
  }

  public get items(): iTabItemProperty[] {
    return [...this.#items];
  }

  public create(content: iTabContent): HTMLElement {
    this.items = content.body;
    this.currentTabIndex = 0;

    // 1. Tentukan Root Container Pembungkus
    if (this.config.container) {
      if (typeof this.config.container === 'string') {
        this.rootElement = document.querySelector(this.config.container) || document.createElement('div');
      } else {
        this.rootElement = this.config.container;
      }
    } else {
      this.rootElement = document.createElement('div');
    }

    this.rootElement.innerHTML = '';
    // Kelas tata letak dinamis mengikuti arah orientasi menu (top/bottom/left/right)
    this.rootElement.className = `tab-container position-${this.config.menuPosition}`;
    this.rootElement.style.minHeight = this.config.minHeight;

    // 2. Buat Spinner internal
    this.spinnerElement = this._createSpinner();
    this.rootElement.appendChild(this.spinnerElement);

    // 3. Proses Pembentukan Menu Utama (Mendukung Objek Data Array maupun HTMLElement murni)
    if (content.menu) {
      if (content.menu instanceof HTMLElement) {
        this.menuElement = content.menu;
      } else if (Array.isArray(content.menu)) {
        this.menuElement = this._createMenu(content.menu);
      }
      this.menuElement!.setAttribute("role", "tablist");
      this.menuElement!.setAttribute("aria-label", "Tab Navigation");
    }

    // 4. Bangun Area Konten Body
    this.bodyElement = document.createElement("div");
    this.bodyElement.className = this.selector.tabBody;
    this._createTabPanels();

    // 5. Bangun Area Footer jika disematkan
    if (content.footer) {
      if (content.footer instanceof HTMLElement) {
        this.footerElement = content.footer;
      } else {
        this.footerElement = document.createElement("div");
        this.footerElement.className = this.selector.tabFooter;
        if (content.footer.id) this.footerElement.id = content.footer.id;
        if (content.footer.className) this.footerElement.classList.add(...content.footer.className.split(" "));
        this.footerElement.textContent = content.footer.text;
      }
    }

    // 6. Satukan Struktur DOM Mengikuti Aturan Tata Letak menuPosition Config
    this._assembleDOM();

    // 7. Daftarkan Navigasi Aksesibilitas Keyboard (Arrow Keys)
    this._boundKeyDownHandler = (e: KeyboardEvent) => this._handleKeyDown(e);
    this.menuElement?.addEventListener("keydown", this._boundKeyDownHandler);

    // Jalankan navigasi awal ke indeks 0 secara otomatis
    this.navigateTo(0);

    return this.rootElement;
  }

  /**
   * Menyusun posisi tumpukan DOM mengikuti orientasi menuPosition
   */
  private _assembleDOM(): void {
    const fragment = document.createDocumentFragment();

    if (this.config.menuPosition === "bottom") {
      fragment.appendChild(this.bodyElement);
      if (this.menuElement) fragment.appendChild(this.menuElement);
    } else {
      // Kondisi default untuk top, left, dan right
      if (this.menuElement) fragment.appendChild(this.menuElement);
      fragment.appendChild(this.bodyElement);
    }

    if (this.footerElement) {
      fragment.appendChild(this.footerElement);
    }

    this.rootElement.appendChild(fragment);
  }

  private _createSpinner(): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = `${this.selector.spinner} hidden`;
    return spinner;
  }

  private _createMenu(menuContent: iTabMenuProperty[]): HTMLElement {
    const menu = document.createElement("div");
    menu.className = this.selector.tabMenu;

    menuContent.forEach((meta, idx) => {
      const btn = document.createElement(meta.link ? "a" : "button") as HTMLElement;
      btn.className = this.selector.tabButton;
      if (meta.id) btn.id = meta.id;
      if (meta.className) btn.classList.add(...meta.className.split(" "));

      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("tabindex", "-1"); // Default tidak bisa di-tab fokus sebelum aktif
      btn.setAttribute("aria-controls", `tabpanel-${this.rootElement.id || 'gen'}-${idx}`);
      btn.id = `tabbtn-${this.rootElement.id || 'gen'}-${idx}`;

      // Sisipkan konten teks label
      const spanLabel = document.createElement("span");
      spanLabel.className = "btn-label";
      spanLabel.textContent = meta.label;

      const spanTitle = document.createElement("span");
      spanTitle.className = "btn-title";
      spanTitle.textContent = meta.title;

      btn.append(spanLabel, spanTitle);

      if (btn instanceof HTMLAnchorElement && meta.link) {
        btn.href = meta.link;
      }

      btn.onclick = (e) => {
        if (!meta.link) e.preventDefault();
        this.navigateTo(idx);
      };

      menu.appendChild(btn);
    });

    return menu;
  }

  private _createTabPanels(): void {
    this.#items.forEach((item, idx) => {
      const panel = document.createElement("div");
      panel.className = this.selector.tabPanel;
      if (item.id) panel.id = item.id;
      if (item.className) panel.classList.add(...item.className.split(" "));

      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tabbtn-${this.rootElement.id || 'gen'}-${idx}`);
      panel.id = `tabpanel-${this.rootElement.id || 'gen'}-${idx}`;

      // Sembunyikan isi konten secara default
      panel.classList.add("hidden");
      panel.style.display = "none";

      // Jika opsi lazyload mati, langsung render seluruh konten di awal
      if (!this.config.lazyload) {
        this._renderPanelContent(panel, item, idx);
      }

      this.bodyElement.appendChild(panel);
    });
  }

  /**
   * Mengisi dan merender konten item ke dalam tab panel fisik
   */
  private _renderPanelContent(panel: HTMLElement, item: iTabItemProperty, index: number): void {
    if (panel.dataset.loaded === "true") return;

    if (item.content instanceof HTMLElement) {
      panel.appendChild(item.content);
    } else {
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "content-wrapper";

      if (item.content.eyebrow) {
        const span = document.createElement("span");
        span.className = "eyebrow";
        span.textContent = item.content.eyebrow;
        contentWrapper.appendChild(span);
      }
      if (item.content.title) {
        const h3 = document.createElement("h3");
        h3.className = "title";
        h3.textContent = item.content.title;
        contentWrapper.appendChild(h3);
      }
      if (item.content.description) {
        const p = document.createElement("p");
        p.className = "desc";
        p.textContent = item.content.description;
        contentWrapper.appendChild(p);
      }
      panel.appendChild(contentWrapper);
    }

    panel.dataset.loaded = "true";
    this._emitter(this._listenersContentLoaded as any[], { index, element: panel });
  }

  public navigateTo(target: number | string): void {
    let targetIndex = -1;

    if (typeof target === "number") { targetIndex = target; } else {
      // Cari indeks berdasarkan kecocokan ID tombol menu kustom
      const buttons = this.menuElement?.querySelectorAll(`.${this.selector.tabButton.split(' ')[0]}`);
      if (buttons) {
        for (let i = 0; i < buttons.length; i++) {
          if (buttons[i].id === target) { targetIndex = i; break; }
        }
      }
    }
    if (targetIndex < 0 || targetIndex >= this.#items.length) return;
    this.spinnerElement?.classList.remove("hidden");
    this._handleChange(targetIndex);
    setTimeout(() => {
      this.spinnerElement?.classList.add("hidden");
    }, 150);
  }

  private _handleChange(index: number): void {
    const buttons = this.menuElement?.querySelectorAll(`.${this.selector.tabButton.split(' ')[0]}`);
    const panels = this.bodyElement.querySelectorAll(`.${this.selector.tabPanel.split(' ')[0]}`);
    const splitActive = this.selector.tabActive.split(' ')[0];
    // 1. Matikan kondisi aktif pada tab sebelumnya
    if (buttons && buttons[this.currentTabIndex]) {
      const prevBtn = buttons[this.currentTabIndex] as HTMLElement;
      prevBtn.classList.remove(splitActive); prevBtn.setAttribute("aria-selected", "false");
      prevBtn.setAttribute("tabindex", "-1");
    }
    if (panels && panels[this.currentTabIndex]) {
      const prevPanel = panels[this.currentTabIndex] as HTMLElement;
      prevPanel.classList.add("hidden"); prevPanel.style.display = "none";
    }
    // 2. Aktifkan kondisi tab baru tujuan
    this.currentTabIndex = index; if (buttons && buttons[index]) {
      const activeBtn = buttons[index] as HTMLElement;
      activeBtn.classList.add(splitActive);
      activeBtn.setAttribute("aria-selected", "true");
      activeBtn.setAttribute("tabindex", "0");
    }
    if (panels && panels[index]) {
      const activePanel = panels[index] as HTMLElement;
      // Jika fitur lazyload aktif, buat kontennya sesaat sebelum panel dibuka
      if (this.config.lazyload) { this._renderPanelContent(activePanel, this.#items[index], index); }
      activePanel.classList.remove("hidden"); activePanel.style.display = "block";
    }
    // 3. Picu callback event tabChanged eksternal
    if (buttons && buttons[index]) {
      const btn = buttons[index] as HTMLElement;
      const label = btn.querySelector(".btn-label")?.textContent || "";
      const title = btn.querySelector(".btn-title")?.textContent || "";
      this._emitter(this._listenersTabChanged as any[], { index, label, title });
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    const buttons = this.menuElement?.querySelectorAll(`.${this.selector.tabButton.split(' ')[0]}`);
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

  private _emitter(listeners: (() => void)[], detail: Record<string, any>): void {
    for (const cb of listeners) {
      try {
        (cb as any)(detail);
      } catch (err) {
        console.error("TabBuilder listener error:", err);
      }
    }
  }

  public destroy(): void {
    if (this._boundKeyDownHandler && this.menuElement) {
      this.menuElement.removeEventListener("keydown", this._boundKeyDownHandler);
    }
    this.rootElement?.remove();
    this._listenersTabChanged = [];
    this._listenersContentLoaded = [];
  }

}
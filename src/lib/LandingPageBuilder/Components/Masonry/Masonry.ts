import type { iActionProperty, iBasicNode, iBuilderConfig, iBuilderRegistry } from "../../interface";
import { Builder } from "../Base";
import "./Masonry.css";

export type MasonryElementType =
  | "@container"

  | "@masonry"
  | "@masonry>filter"
  | "@masonry>filter>item"
  | "@masonry>filter>slider"

  | "@masonry>item"
  | "@masonry>item>image"
  | "@masonry>item>title"
  | "@masonry>item>desc"
  | "@masonry>item>actions"

  | "@masonry>modal"
  | "@masonry>modal>close"
  | "@masonry>modal>next"
  | "@masonry>modal>previous"

  | "@masonry>spinner"
  | "@masonry>trigger"
  | "@masonry>sentinel"

export interface iMasonryConfig extends iBuilderConfig<MasonryElementType> {
  container?: string | HTMLElement | null; // if defined will be the root container to replace <section>
  column: number; // how many column will be displayed on init
  lazyload: boolean; // lazyload the image / content
  maxDisplayed: number; // if content > maxDisplayed will create `more / next` button, and the loadMore will check the remaining content and load at maxDisplayed limit, and so on
  useLoadButton?: boolean;
  category: string | null;

  loadFn?: null | ((page: number, category: string | null) => Promise<any[]>); // Default untuk load data baru dari GAS Server
  onScrollEnd?: null | (() => void);      // Meletup saat user menyentuh lantai terbawah dokumen bodi HTML
  onLoadTriggered?: null | ((page: number) => void); // Meletup tepat saat hitmundur loading data baru dimulai
}

export class MasonryBuilder extends Builder<MasonryElementType, iMasonryConfig> {
  readonly builderId: keyof iBuilderRegistry = "masonry";
  readonly name: keyof iBuilderRegistry = "masonry";
  readonly stylesheet: string = "./Masonry.css";

  #items: (iBasicNode | HTMLElement)[] = [];
  private displayedCount = 0;
  private selectedCategory: string | null = null;

  private currentPage = 1;      // Penunjuk halaman untuk Apps Script Pagination
  private isServerFetching = false; // Flag pelindung agar tidak terjadi double-fetch tabrakan

  private modal!: {
    show: (index: number) => void;
    updateNavigation: () => void;
    destroy: () => void;
  };
  private observer?: IntersectionObserver;

  constructor(config: Partial<iMasonryConfig> = {}) {
    super();

    const defaultSelectors = {
      "@container": { tagName: "section", className: "masonry gallery" },
      "@masonry": { tagName: "div", className: "grid" },
      "@masonry>filter": { tagName: "div", className: "filter menu" },
      "@masonry>filter>item": { tagName: "button", className: "item" },
      "@masonry>filter>slider": { tagName: "span", className: "slider" },
      "@masonry>item": { tagName: "div", className: "item fade-in" },
      "@masonry>item>image": { tagName: "img", className: "img-fluid" },
      "@masonry>item>title": { tagName: "h3", className: "title" },
      "@masonry>item>desc": { tagName: "p", className: "desc" },
      "@masonry>item>actions": { tagName: "div", className: "actions" },
      "@masonry>modal": { tagName: "div", className: "modal hidden" },
      "@masonry>modal>close": { tagName: "div", className: "close" },
      "@masonry>modal>next": { tagName: "div", className: "next" },
      "@masonry>modal>previous": { tagName: "div", className: "previous" },
      "@masonry>spinner": { tagName: "div", className: "spinner hidden" },
      "@masonry>sentinel": { tagName: "div", className: "sentinel" },
      "@masonry>trigger": { tagName: "button", className: "more" },
    };

    const defaultConfig: Required<iMasonryConfig> = {
      themeId: "default",
      container: null,
      column: 3,
      lazyload: true,
      maxDisplayed: 4,
      useLoadButton: true,
      category: null,
      selectors: defaultSelectors,
      loadFn: null, // Default untuk load data baru dari GAS Server
      onScrollEnd: null,    // Meletup saat user menyentuh lantai terbawah dokumen bodi HTML
      onLoadTriggered: null, // Meletup tepat saat hitmundur loading data baru dimulai
      emit: null
    };

    this.config = this.resolveConfig(defaultConfig, config);
  }

  /**
   * SETTER: Tempat validasi pusat untuk mengamankan data sebelum masuk ke aplikasi
   */
  public set items(newItems: (iBasicNode | HTMLElement)[]) {
    // Validasi Keamanan: Pastikan data berupa array dan lakukan pembersihan
    if (!Array.isArray(newItems)) {
      console.error('Validasi Gagal: Data masonry harus berupa array.');
      return;
    }

    // Bekukan data (Immutability) agar tidak bisa dimutasi secara ilegal dari luar skrip
    this.#items = newItems.map(item => {
      if (item instanceof HTMLElement) return item;

      // Sanitasi dasar: Pastikan properti penting aman dari manipulasi tipe data
      return Object.freeze({
        ...item,
        title: item.title ? String(item.title).trim() : undefined,
        description: item.description ? String(item.description).trim() : undefined,
        category: item.category ? String(item.category).trim() : undefined,
        image: item.image ? String(item.image).trim() : undefined
      });
    });
  }


  /**
   * GETTER KATEGORI: Menghitung daftar gambar yang AKTIF dan SUDAH TER-RENDER di layar saat ini
   * (Menghilangkan celah bypass modal data secara instan)
   */
  private get currentVisibleImages(): string[] {
    // 1. Ambil data yang lolos saringan kategori saat ini
    const filtered = this.#items.filter(item => {
      if (item instanceof HTMLElement) return false;
      return this.selectedCategory === null || item.category === this.selectedCategory;
    }) as iBasicNode[];

    // 2. Batasi hanya sebanyak jumlah item yang sedang aktif di-render di layar (displayedCount)
    const visibleBatch = filtered.slice(0, this.displayedCount);

    // 3. Ekstrak string URL gambarnya saja
    return visibleBatch.map(item => item.image).filter((img): img is string => !!img);
  }

  public prepare(data: any, _config?: Partial<iMasonryConfig>): HTMLElement {

    let normalizedData = data;
    if (Array.isArray(data)) {
      normalizedData = {
        id: this.config.container instanceof HTMLElement ? this.config.container.id : "masonry-legacy-root",
        className: "section masonry gallery",
        content: data // Alirkan array lama ke saku content standar v2
      };
    }

    // Pasok data array murni ksatria Anda ke Immutable Setter Tracker
    this.items = normalizedData.content || [];
    this.displayedCount = 0;
    this.currentPage = 1; // Reset nomor halaman awal

    const rootContainer = this.render("@container", normalizedData);

    const categoriesSet = new Set<string>();
    this.#items.forEach(item => {
      if (!(item instanceof HTMLElement) && item.category) categoriesSet.add(item.category.trim());
    });
    const categories = Array.from(categoriesSet);

    this.selectedCategory = categories.length > 0 ? categories[0] : null;

    if (categories.length > 0) {
      const filterMenuElement = this._renderFilterMenu(categories, this.selectedCategory as string);
      rootContainer?.appendChild(filterMenuElement!);
    }

    const gridElement = this.render("@masonry", data);
    rootContainer?.appendChild(gridElement!);

    this.modal = this._initModal();

    // Jalankan penyaringan & pemuatan batch pagination pertama kali
    this._applyFilter(this.selectedCategory as string);

    return this.load("@container") as HTMLElement;
  }

  protected template(typeKey: MasonryElementType, el: HTMLElement, payload?: any): void {
    switch (typeKey) {
      case "@container":
        if (this.config.container instanceof HTMLElement) {
          el.id = this.config.container.id || el.id;
          el.className = `${this.config.container.className} ${el.className}`.trim();
        } else if (typeof this.config.container === 'string') {
          const target = document.querySelector(this.config.container);
          if (target) el.id = target.id;
        }
        break;

      case "@masonry":
        el.style.setProperty("--init-columns", this.config.column.toString());
        break;

      case "@masonry>filter>item":
        el.textContent = payload?.label || "";
        if (payload?.active) el.classList.add("active");
        (el as any)._categoryToken = payload?.label;
        break;

      case "@masonry>item>title":
        el.textContent = payload?.title || "";
        break;

      case "@masonry>item>desc":
        el.textContent = payload?.description || "";
        break;

      case "@masonry>modal>close":
        el.innerHTML = "&times;";
        break;

      case "@masonry>modal>next":
        el.innerHTML = "&#10095;"; // ❯
        break;

      case "@masonry>modal>previous":
        el.innerHTML = "&#10094;"; // ❮
        break;

      case "@masonry>trigger":
        el.textContent = "Load More";
        break;
    }
  }

  public initialize(): void {
    const activeBtn = (this.load("@masonry>filter") as HTMLElement)?.querySelector(".item.active") as HTMLButtonElement;
    if (activeBtn) {
      // Browser sudah sukses menggambar ukuran piksel, hitung slider koordinat dengan presisi 100%!
      requestAnimationFrame(() => this._updateSlider(activeBtn, true));
    }
    console.log("[Masonry Lifecycle] Advanced photo gallery layout synchronized successfully.");
  }

  public unmount(): void {
    // Panggil logika pembersih aseli bawaan Anda tanpa ada yang ketinggalan
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    if (this.modal && typeof this.modal.destroy === 'function') {
      this.modal.destroy();
    }

    this.remove("@masonry>trigger", "@masonry>spinner")

    // Hancurkan saku Map dan likuidasi RAM via destroy base class terpusat!
    this.destroy();
  }

  private _initPaginationTrigger(root: HTMLElement): void {
    if (this.config.useLoadButton) {

      const button = (this.load("@masonry>trigger") || this.render("@masonry>trigger")) as HTMLButtonElement;
      button.onclick = () => this._handleNextBatchTrigger();
      root.append(button);
      // this._handleNextBatchTrigger();
    } else {
      const sentinel = (this.load("@masonry>sentinel") || this.render("@masonry>sentinel")) as HTMLElement;
      root.insertBefore(sentinel!, this.load("@masonry>spinner") as HTMLElement || null);

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const totalInActiveCat = this.#items.filter(item => {
            if (item instanceof HTMLElement) return false;
            return this.selectedCategory === null || item.category === this.selectedCategory;
          }).length;

          if (entry.isIntersecting && this.displayedCount < totalInActiveCat) {
            this._handleNextBatchTrigger();
          }
        });
      }, { rootMargin: '200px' });

      this.observer.observe(sentinel!);
    }
    this._handleNextBatchTrigger();  // <= panggil dulu supaya first load ga kosong
  }

  private async _handleNextBatchTrigger(): Promise<void> {
    const filteredPool = this.#items.filter(item => this.selectedCategory === null || (item as any).category === this.selectedCategory);

    // 💡 Skenario A: Jika data lokal masih ada, suntikkan langsung brik fotonya ke layar
    if (this.displayedCount < filteredPool.length) {
      this._loadNextBatch();
      return;
    }

    // 💡 Skenario B: Jika data lokal sudah habis, tembak server JIT via loadFn andalan Anda!
    if (typeof this.config.loadFn === "function" && !this.isServerFetching) {
      this.isServerFetching = true;
      this.currentPage++;

      // Letupkan callback laporan waktu tunggu loading dimulai
      if (this.config.onLoadTriggered && typeof this.config.onLoadTriggered === "function") { this.config.onLoadTriggered(this.currentPage); }
      (this.load("@masonry>spinner") as HTMLElement)?.classList.remove('hidden');

      try {
        console.log(`🚀 [GAS Data Stream] Querying page ${this.currentPage} for category: ${this.selectedCategory}`);
        const freshServerItems = await this.config.loadFn(this.currentPage, this.selectedCategory);

        if (freshServerItems && freshServerItems.length > 0) {
          // ====================================================
          // 🔒 RAM LEAK PROTECTION SYSTEM (MANAJEMEN NEGATIVE MEMORY TRACKING)
          // Jika Galeri Anda super raksasa (ribuan foto), kita kuras array element 
          // angkatan paling lama dari dalam tabel _nodes pusat sebelum memasukkan yang baru!
          // ====================================================
          const itemNodesRecord = this.load("@masonry>item", "all");
          if (itemNodesRecord && (itemNodesRecord as HTMLElement[]).length > 24) {
            console.log(`🧹 [RAM Shield]: Flushing past batch elements to optimize physical RAM memory.`);
            // Potong dan hapus 8 elemen fisik pertama dari layar dokumen browser
            for (let i = 0; i < 8; i++) {
              const garbageNode = (itemNodesRecord as HTMLElement[]).shift();
              garbageNode?.remove();
            }
          }

          // Gabungkan data baru hantaran server ke dalam saku internal #items ksatria Anda!
          this.#items = [...this.#items, ...freshServerItems];
          // Semburkan angkatan baru tersebut langsung ke dinding grid
          this._loadNextBatch();
        } else {
          // Jika server memutahkan array kosong [], tandanya data di database GAS habis total!
          console.log(`🏁 [GAS Data Stream] Reach end of server rows database table.`);
          if (this.config.onScrollEnd && typeof this.config.onScrollEnd === "function") this.config.onScrollEnd(); // Letupkan callback penanda lantai terbawah
          this._killPaginationControls();
        }
      } catch (streamError) {
        console.error(`[GAS Data Stream Error]:`, streamError);
      } finally {
        this.isServerFetching = false;
        (this.load("@masonry>spinner") as HTMLElement)?.classList.add('hidden');
      }
    }
  }

  private _loadNextBatch(): void {

    const filtered = this.#items.filter(item => {
      if (item instanceof HTMLElement) return false;
      return this.selectedCategory === null || item.category === this.selectedCategory;
    });

    const start = this.displayedCount;
    const end = Math.min(start + this.config.maxDisplayed, filtered.length);

    if (start >= end) return;

    const spinner = this.load("@masonry>spinner") as HTMLElement;
    spinner?.classList.remove('hidden');

    const fragment = document.createDocumentFragment();
    let imageIndexCounter = ((this.load("@masonry>item", "all") as HTMLElement[]) || []).length;
    let batchIndex = 0;

    for (let i = start; i < end; i++) {
      const content = filtered[i];
      let assignedIndex = -1;

      if (!(content instanceof HTMLElement) && content.image) {
        assignedIndex = imageIndexCounter;
        imageIndexCounter++;
      }

      const item = this._createItem(content, assignedIndex);
      item.style.setProperty('--batch-index', batchIndex.toString());
      batchIndex++;

      fragment.appendChild(item);
    }

    (this.load("@masonry") as HTMLElement).appendChild(fragment);
    this.displayedCount = end;

    this.modal.updateNavigation();

    // Jika seluruh data (lokal + server hantaran baru) sudah benar-benar habis, matikan kontroler
    if (this.displayedCount >= filtered.length && !this.config.loadFn) { this._killPaginationControls(); }

    setTimeout(() => {
      spinner?.classList.add('hidden');
    }, 200);

    if (this.displayedCount >= filtered.length) {
      if (this.observer) this.observer.disconnect();
      this.remove("@masonry>spinner")
    }
  }

  private _killPaginationControls(): void {
    if (this.observer) this.observer.disconnect();
    this.remove("@masonry>trigger", "@masonry>spinner");
  }

  private _renderFilterMenu(categories: string[], selectedCategory: string) {

    const menu = this.render("@masonry>filter");

    let activeBtnElement: HTMLButtonElement | null = null;

    const allBtn = this.render("@masonry>filter>item", { label: "All", active: selectedCategory === null }, true);
    allBtn!.onclick = () => this._handleCategoryChange(null, allBtn as HTMLButtonElement);
    menu!.appendChild(allBtn!);

    if (selectedCategory === null) {
      activeBtnElement = allBtn as HTMLButtonElement;
    }

    categories.forEach((catName) => {
      const isSelected = selectedCategory === catName;
      const btn = this.render("@masonry>filter>item", { label: catName, active: isSelected }, true); // 🟢 Multiple true!
      btn!.onclick = () => this._handleCategoryChange(catName, btn as HTMLButtonElement);
      menu?.appendChild(btn!);

      if (isSelected) {
        activeBtnElement = btn as HTMLButtonElement;
      }
    });

    const slider = this.render("@masonry>filter>slider");
    menu?.appendChild(slider!);

    if (activeBtnElement) {
      requestAnimationFrame(() => this._updateSlider(activeBtnElement!, true));
    }

    return this.load("@masonry>filter") as HTMLElement
  }

  private _updateSlider = (activeBtn: HTMLButtonElement, isInit = false) => {
    // console.log(activeBtn)
    const slider = this.load("@masonry>filter>slider") as HTMLElement;
    if (!slider || !activeBtn) return;

    if (activeBtn.offsetWidth === 0 && isInit) {
      requestAnimationFrame(() => this._updateSlider(activeBtn, true));
      return;
    }

    // 1. Jika inisialisasi awal, matikan transisi agar tidak melompat dari atas/kiri screen
    if (isInit) {
      slider.style.transition = 'none';
    } else {
      // Kembalikan ke animasi bawaan jika ini adalah klik manual pengguna
      slider.style.transition = '';
    }

    // 2. Ambil posisi relatif menggunakan offsetLeft & offsetTop yang presisi terhadap induknya
    const leftPosition = activeBtn.offsetLeft;
    const topPosition = activeBtn.offsetTop;
    const width = activeBtn.offsetWidth;
    const height = activeBtn.offsetHeight;

    // 3. Terapkan dimensi dan geser menggunakan translate3d
    slider.style.width = `${width}px`;
    slider.style.height = `${height}px`;
    slider.style.transform = `translate3d(${leftPosition}px, ${topPosition}px, 0)`;

    // 4. Jika baru diinisialisasi, hidupkan kembali transisinya di frame berikutnya agar klik berikutnya lancar
    if (isInit) {
      requestAnimationFrame(() => {
        // Berikan jeda mikro agar browser menerapkan posisi "none" terlebih dahulu
        setTimeout(() => {
          slider.style.transition = '';
        }, 50);
      });
    }
  }

  private _handleCategoryChange(category: string | null, activeBtn: HTMLButtonElement): void {

    // Update class active pada tombol menu
    const splitActive = "active";

    (this.load("@masonry>filter") as HTMLElement)?.querySelectorAll(".item").forEach(btn => {
      btn.classList.remove(splitActive);
    });
    activeBtn.classList.add(splitActive);

    this._updateSlider(activeBtn);

    // Simpan ke config & jalankan re-render
    this.selectedCategory = category;
    // console.log({ selectedCategory: this.selectedCategory })
    this._applyFilter(category as string);
  }

  private _applyFilter(category: string) {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }


    (this.load("@masonry") as HTMLElement).innerHTML = '';

    // Bersihkan buffer antrean memori brik lama dari _nodes pusat agar sinkronisasi index modal tidak kacau!
    this.remove(
      "@masonry>item",
      "@masonry>item>actions",
      "@masonry>item>image",
      "@masonry>item>title",
      "@masonry>item>desc",
      "@masonry>spinner",
      "@masonry>trigger",
    )

    const grid = this.load("@masonry") as HTMLElement;
    grid.innerHTML = '';

    this.displayedCount = 0;
    this.currentPage = 1;
    this.selectedCategory = category;

    // Sinkronisasi ulang navigasi modal
    this.modal.updateNavigation();

    const container = this.load("@container") as HTMLElement
    this._createSpinner(container);
    this._initPaginationTrigger(container);
  }

  private _createSpinner(root: HTMLElement): void {
    const spinner = (this.load("@masonry>spinner") || this.render("@masonry>spinner"));
    root.appendChild(spinner as HTMLElement);
  }

  private _createItem(content: iBasicNode | HTMLElement, modalIndex: number): HTMLElement {

    const card = this.render("@masonry>item", content, true);

    // SAFE CLASS REMOVAL: Menggunakan setTimeout untuk melepas class animasi tanpa risiko bug macet
    // setTimeout(() => {
    //   card.classList.remove('fade-in');
    // }, 400);

    // USE `animationend` listener CLASS REMOVAL
    card?.addEventListener('animationend', () => {
      card.classList.remove("fade-in");
    }, { once: true });

    if (content instanceof HTMLElement) {
      card?.appendChild(content);
      return card!;
    }

    const item = content;
    if (item.className) card?.classList.add(...item.className.split(' '));
    if (item.id) card!.id = item.id;

    if (item.image) {

      const img = this.render("@masonry>item>image", item, true) as HTMLImageElement;
      img.src = encodeURI(item.image);
      img.alt = item.title || 'Gallery image';

      if (this.config.lazyload) {
        img.loading = 'lazy';
      }

      // Penanganan Error Produksi: Jika gambar gagal dimuat dari server statis
      img.onerror = () => {
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://w3.org" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23222"/><text x="50" y="50" font-family="sans-serif" font-size="10" fill="%23666" text-anchor="middle" dominant-baseline="middle">Image Error</text></svg>';
      };

      card?.appendChild(img);
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modalIndex !== -1) {
          this.modal.show(modalIndex);
        }
      });
    }

    if (item.title) {
      const h2 = this.render("@masonry>item>title", item, true);
      card?.appendChild(h2!);
    }

    if (item.description) {
      const p = this.render("@masonry>item>desc", item, true);
      card?.appendChild(p!);
    }

    if (item.actions && Array.isArray(item.actions)) {
      const actionsEl = this._createAction(item.actions);
      if (actionsEl) {
        card?.appendChild(actionsEl);
      }
    }

    return card!;
  }

  private _createAction(content: iActionProperty[]): HTMLElement | null {
    if (!content.length) return null;

    const actions = this.render("@masonry>item>actions", null, true);

    content.forEach(action => {
      const btn = action.href ? document.createElement('a') : document.createElement('button');
      // btn.className = action.className || this.selector.actionBtn;
      if (action.id) btn.id = action.id;

      if (btn instanceof HTMLAnchorElement && action.href) {
        btn.href = action.href;
      }

      btn.textContent = action.label || 'Click';

      if (action.onClick) {
        btn.addEventListener('click', (e) => action.onClick!(e as MouseEvent));
      }

      actions?.appendChild(btn);
    });

    return actions!;
  }

  private _initModal() {
    let currentIndex = 0;
    let isModalOpen = false;
    // 🟢 ABSOLUT TOKENIZED MODAL: Lahirkan seluruh suku cadangnya lewat render() pusat!
    const modalEl = this.render("@masonry>modal");
    const modalImg = document.createElement('img');
    // Gambar dinamis murni injeksi RAM loader
    modalImg.className = 'img';
    const closeBtn = this.render("@masonry>modal>close") as HTMLButtonElement;
    const nextBtn = this.render("@masonry>modal>next") as HTMLButtonElement;
    const prevBtn = this.render("@masonry>modal>previous") as HTMLButtonElement;

    modalEl?.append(prevBtn, modalImg, nextBtn, closeBtn);
    (this.load("@container") as HTMLElement)!.appendChild(modalEl!);

    const show = (index: number) => {
      const activeImages = this.currentVisibleImages;
      if (!activeImages.length) return;
      currentIndex = (index + activeImages.length) % activeImages.length;
      modalImg.src = activeImages[currentIndex];
      modalEl?.classList.remove('hidden');
      isModalOpen = true;
      setTimeout(() => modalEl?.focus(), 50);
    };

    const hide = () => {
      modalEl?.classList.add('hidden');
      isModalOpen = false;
    };

    const updateNavigation = () => {
      nextBtn.onclick = () => show(currentIndex + 1);
      prevBtn.onclick = () => show(currentIndex - 1);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault(); show(currentIndex + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault(); show(currentIndex - 1);
      }
      if (e.key === 'Escape') {
        e.preventDefault(); hide();
      }
    };

    closeBtn.onclick = hide;
    modalEl?.addEventListener('click', (e) => {
      if (e.target === modalEl) hide();
    });

    document.addEventListener('keydown', handleKeyDown);
    const destroy = () => {
      document.removeEventListener('keydown', handleKeyDown);
      modalEl?.remove();
    };
    return { show, updateNavigation, destroy };
  }
}


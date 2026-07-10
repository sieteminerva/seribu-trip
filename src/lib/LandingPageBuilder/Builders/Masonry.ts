import type { iActionProperty, iBasicNode } from "../interface";

export interface iMasonrySelectors {
  // Menu Filter Kategori
  filterMenu?: string;    // Default: 'filter menu'
  filterItem?: string;    // Default: 'item'
  filterActive?: string;  // Default: 'active'
  filterSlider?: string;  // Default: 'slider'

  // Grid & Konten
  grid?: string;          // Default: 'grid'
  item?: string;          // Default: 'item'
  itemFadeIn?: string;    // Default: 'fade-in'
  itemTitle?: string;     // Default: 'title'
  itemDesc?: string;      // Default: 'desc'
  itemActions?: string;   // Default: 'actions'
  actionBtn?: string;     // Default: 'btn'

  // Pagination & Loading
  spinner?: string;       // Default: 'spinner'
  sentinel?: string;      // Default: 'sentinel'
  loadMoreBtn?: string;   // Default: 'more'
}

export interface iMasonryConfig {
  container?: string | HTMLElement | null; // if defined will be the root container to replace <section>
  column: number; // how many column will be displayed on init
  lazyload: boolean; // lazyload the image / content
  maxDisplayed: number; // if content > maxDisplayed will create `more / next` button, and the loadMore will check the remaining content and load at maxDisplayed limit, and so on
  useLoadButton?: boolean;
  category: string | null;
  selectors?: Partial<iMasonrySelectors>
}

export class MasonryBuilder {
  private config: iMasonryConfig;
  private selector!: Required<iMasonrySelectors>;
  #items: (iBasicNode | HTMLElement)[] = [];
  private displayedCount = 0;
  private selectedCategory: string | null = null;

  private rootElement!: HTMLElement;
  private gridElement!: HTMLElement;
  private filterMenuElement?: HTMLElement;
  private triggerElement?: HTMLElement;
  private spinnerElement?: HTMLElement;
  private modal!: {
    show: (index: number) => void;
    updateNavigation: () => void;
    destroy: () => void;
  };
  private observer?: IntersectionObserver;



  constructor(config?: Partial<iMasonryConfig>) {

    const defaultSelectors: Required<iMasonrySelectors> = {
      filterMenu: 'filter menu',
      filterItem: 'item',
      filterActive: 'active',
      filterSlider: 'slider',
      grid: 'grid',
      item: 'item',
      itemFadeIn: 'fade-in',
      itemTitle: 'title',
      itemDesc: 'desc',
      itemActions: 'actions',
      actionBtn: 'btn',
      spinner: 'spinner',
      sentinel: 'sentinel',
      loadMoreBtn: 'more'
    };

    const defaultConfig: Required<iMasonryConfig> = {
      container: null,
      column: 3,
      lazyload: true,
      maxDisplayed: 4,
      useLoadButton: true,
      category: null,
      selectors: defaultSelectors
    };
    this.config = { ...defaultConfig, ...config, selectors: { ...defaultSelectors, ...config?.selectors } };
    (this.selector as iMasonrySelectors) = this.config.selectors as iMasonrySelectors;
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

  public create(content: iBasicNode[]): HTMLElement {
    this.items = content;
    // console.log({ items: this.items })
    this.displayedCount = 0;

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
    this.rootElement.className = 'section masonry gallery';

    // 2. Ekstrak Kategori Unik di Level create() untuk validasi awal
    const categoriesSet = new Set<string>();

    this.#items.forEach(item => {
      if (!(item instanceof HTMLElement) && item.category) {
        categoriesSet.add(item.category.trim());
      }
    });

    const categories = Array.from(categoriesSet);

    // 3. Tentukan State Kategori Aktif Awal (Gunakan dari config, fallback ke categories[0], atau null jika kosong)
    if (categories.length > 0) {
      this.selectedCategory = categories[0]; // Jadikan indeks pertama sebagai default jika config tidak diisi
    } else {
      this.selectedCategory = null; // Kembali ke opsi 'All' jika tidak ada data kategori
    }

    // 4. Render Menu Filter Kategori jika datanya ada
    if (categories.length > 0) {
      this.filterMenuElement = this._renderFilterMenu(categories, this.selectedCategory as string);
      this.rootElement.appendChild(this.filterMenuElement as HTMLElement);
    }

    this.gridElement = document.createElement('div');
    this.gridElement.className = this.selector.grid;
    this.gridElement.style.setProperty('--init-columns', this.config.column.toString());
    this.rootElement.appendChild(this.gridElement);
    // console.log({ allImages: this.allImages })

    this.modal = this._initModal();


    this._applyFilter(this.selectedCategory as string)

    return this.rootElement;
  }

  /**
   * Fungsi Pembersih (Sangat Penting untuk Production)
   * Memastikan tidak ada sisa event listener yang menyangkut di memori browser
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    if (this.modal && typeof this.modal.destroy === 'function') {
      this.modal.destroy();
    }
    this.triggerElement?.remove();
    this.spinnerElement?.remove();
    this.filterMenuElement?.remove();
  }

  private _initPaginationTrigger(root: HTMLElement): void {
    if (this.config.useLoadButton) {
      const button = document.createElement('button');
      button.className = this.selector.loadMoreBtn;
      button.textContent = 'Load More';
      button.onclick = () => this._loadNextBatch();
      this.triggerElement = button;

      root.insertBefore(button, this.spinnerElement || null);
      this._loadNextBatch();
    } else {
      const sentinel = document.createElement('div');
      sentinel.className = this.selector.sentinel;
      this.triggerElement = sentinel;

      root.insertBefore(sentinel, this.spinnerElement || null);

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.displayedCount < this.#items.filter(item => { if (item instanceof HTMLElement) return false; return this.selectedCategory === null || item.category === this.selectedCategory; }).length) {
            this._loadNextBatch();
          }
        });
      }, {
        rootMargin: '200px' // Diperlebar ke 200px agar load terasa lebih seamless di landing page
      });

      this.observer.observe(sentinel);
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

    this.spinnerElement?.classList.remove('hidden');
    const fragment = document.createDocumentFragment();

    let imageIndexCounter = this.currentVisibleImages.length;
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

    this.gridElement.appendChild(fragment);
    this.displayedCount = end;

    this.modal.updateNavigation();

    setTimeout(() => {
      this.spinnerElement?.classList.add('hidden');
    }, 200);

    if (this.displayedCount >= filtered.length) {
      if (this.observer) this.observer.disconnect();
      this.triggerElement?.remove();
      this.spinnerElement?.remove();
    }
  }

  private _renderFilterMenu(categories: string[], selectedCategory: string) {

    const menu = document.createElement('div');
    menu.className = this.selector.filterMenu;

    let activeBtnElement: HTMLButtonElement | null = null;

    const allBtn = document.createElement('button');
    allBtn.className = selectedCategory === null ? `${this.selector.filterItem} ${this.selector.filterActive}` : this.selector.filterItem;
    allBtn.textContent = 'All';
    allBtn.onclick = () => this._handleCategoryChange(null, allBtn);
    menu.appendChild(allBtn);

    if (selectedCategory === null) {
      activeBtnElement = allBtn;
    }

    categories.forEach((catName) => {
      const btn = document.createElement('button');
      const isSelected = selectedCategory === catName;
      btn.className = isSelected ? `${this.selector.filterItem} ${this.selector.filterActive}` : this.selector.filterItem;
      btn.textContent = catName.charAt(0).toUpperCase() + catName.slice(1); // Kapital huruf pertama

      btn.onclick = () => this._handleCategoryChange(catName, btn);
      menu.appendChild(btn);

      if (isSelected) {
        activeBtnElement = btn;
      }
    });

    const slider = document.createElement('div');
    slider.className = this.selector.filterSlider;
    menu.appendChild(slider);

    if (activeBtnElement) {
      requestAnimationFrame(() => this._updateSlider(activeBtnElement!, true));
    }

    return menu
  }

  private _updateSlider = (activeBtn: HTMLButtonElement, isInit = false) => {
    // console.log(activeBtn)
    const sliderClass = this.selector.filterSlider.split(' ')[0];
    const slider = this.filterMenuElement?.querySelector(`.${sliderClass}`) as HTMLElement;
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
    const splitActive = this.selector.filterActive.split(' ')[0];
    const splitItem = this.selector.filterItem.split(' ')[0];

    this.filterMenuElement?.querySelectorAll(`.${splitItem}`).forEach(btn => {
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
    this.triggerElement?.remove();
    this.spinnerElement?.remove();
    this.gridElement.innerHTML = '';

    this.displayedCount = 0;
    this.selectedCategory = category;

    // Sinkronisasi ulang navigasi modal
    this.modal.updateNavigation();

    this._createSpinner(this.rootElement);
    this._initPaginationTrigger(this.rootElement);
  }

  private _createSpinner(root: HTMLElement): void {
    this.spinnerElement = document.createElement('div');
    this.spinnerElement.className = `${this.selector.spinner} hidden`;
    root.appendChild(this.spinnerElement);
  }

  private _createItem(content: iBasicNode | HTMLElement, modalIndex: number): HTMLElement {
    const card = document.createElement('div');
    card.className = `${this.selector.item} ${this.selector.itemFadeIn}`;

    // SAFE CLASS REMOVAL: Menggunakan setTimeout untuk melepas class animasi tanpa risiko bug macet
    // setTimeout(() => {
    //   card.classList.remove('fade-in');
    // }, 400);

    // USE `animationend` listener CLASS REMOVAL
    card.addEventListener('animationend', () => {
      card.classList.remove(this.selector.itemFadeIn);
    }, { once: true });

    if (content instanceof HTMLElement) {
      card.appendChild(content);
      return card;
    }

    const item = content;
    if (item.className) card.classList.add(...item.className.split(' '));
    if (item.id) card.id = item.id;

    if (item.image) {

      const img = document.createElement('img');
      img.className = 'img-fluid';
      img.src = encodeURI(item.image);
      img.alt = item.title || 'Gallery image';

      if (this.config.lazyload) {
        img.loading = 'lazy';
      }

      // Penanganan Error Produksi: Jika gambar gagal dimuat dari server statis
      img.onerror = () => {
        img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://w3.org" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23222"/><text x="50" y="50" font-family="sans-serif" font-size="10" fill="%23666" text-anchor="middle" dominant-baseline="middle">Image Error</text></svg>';
      };

      card.appendChild(img);
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modalIndex !== -1) {
          this.modal.show(modalIndex);
        }
      });
    }

    if (item.title) {
      const h2 = document.createElement('h2');
      h2.className = this.selector.itemTitle;
      h2.textContent = item.title;
      card.appendChild(h2);
    }

    if (item.description) {
      const p = document.createElement('p');
      p.className = this.selector.itemDesc;
      p.textContent = item.description;
      card.appendChild(p);
    }

    if (item.actions && Array.isArray(item.actions)) {
      const actionsEl = this._createAction(item.actions);
      if (actionsEl) {
        card.appendChild(actionsEl);
      }
    }

    return card;
  }

  private _createAction(actions: iActionProperty[]): HTMLElement | null {
    if (!actions.length) return null;

    const container = document.createElement('div');
    container.className = this.selector.itemActions;

    actions.forEach(action => {
      const btn = action.href ? document.createElement('a') : document.createElement('button');
      btn.className = action.className || this.selector.actionBtn;
      if (action.id) btn.id = action.id;

      if (btn instanceof HTMLAnchorElement && action.href) {
        btn.href = action.href;
      }

      btn.textContent = action.label || 'Click';

      if (action.onClick) {
        btn.addEventListener('click', (e) => action.onClick!(e as MouseEvent));
      }

      container.appendChild(btn);
    });

    return container;
  }


  private _initModal() {
    // State Internal Modal (Terisolasi sempurna di dalam scope fungsi)
    let currentIndex = 0;
    let isModalOpen = false;

    // Pembentukan Elemen DOM Modal
    const modalEl = document.createElement('div');
    modalEl.className = 'modal hidden';
    modalEl.tabIndex = -1;
    modalEl.style.outline = 'none';

    const modalImg = document.createElement('img');
    modalImg.className = 'img';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next';
    nextBtn.innerHTML = '❯';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'prev';
    prevBtn.innerHTML = '❮';

    modalEl.append(prevBtn, modalImg, nextBtn, closeBtn);
    this.rootElement.appendChild(modalEl);

    // Fungsi Kontrol Internal
    const show = (index: number) => {
      // Membaca data dinamis ter-render dari Getter pusat
      const activeImages = this.currentVisibleImages;
      if (!activeImages.length) return;

      currentIndex = (index + activeImages.length) % activeImages.length;
      modalImg.src = activeImages[currentIndex];
      modalEl.classList.remove('hidden');
      isModalOpen = true;
      setTimeout(() => modalEl.focus(), 50);
    };

    const hide = () => {
      modalEl.classList.add('hidden');
      isModalOpen = false;
    };

    // Sinkronisasi Fungsi Tombol Klik Navigasi (Dipanggil setiap kali filter berubah)
    const updateNavigation = () => {
      nextBtn.onclick = () => show(currentIndex + 1);
      prevBtn.onclick = () => show(currentIndex - 1);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); show(currentIndex + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(currentIndex - 1); }
      if (e.key === 'Escape') { e.preventDefault(); hide(); }
    };

    // Event Listener Binding
    closeBtn.onclick = hide;
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) hide();
    });
    document.addEventListener('keydown', handleKeyDown);

    // Fungsi Destroy Pembersih Memori
    const destroy = () => {
      document.removeEventListener('keydown', handleKeyDown);
      modalEl.remove();
    };

    // Mengembalikan Nested Object / Fungsi Kontrol khusus untuk Modal
    return {
      show,
      updateNavigation,
      destroy
    };
  }
}


import type { iBasicNode } from "../interface";
import "./Carousel.css";

export interface iCarouselConfig {
  container?: null | string | HTMLElement;
  showControl?: boolean | "auto";
  showNavigation?: boolean | "auto";
  autoPlay?: boolean | number;
  vertical?: boolean;
  slidesPerView?: number;
  animation?: iCarouselAnimation;
  loop?: boolean;
  slideHeight?: string;
  slideWidth?: string;
  pauseOnHover?: boolean;
}

export const AttrsConfigKeys = [
  "container",
  "data-show-control",
  "data-show-navigation",
  "data-autoplay",
  "data-vertical",
  "data-slides-per-view",
  "data-animation",
  "data-loop",
  "data-slide-height",
  "data-slide-width",
  "data-pause-on-hover",
] as const;

type CarouselAttrKeys = typeof AttrsConfigKeys[number];

export type iCarouselAttrsConfig = {
  [K in CarouselAttrKeys]: any;
};

export const dataAttrsConfig: iCarouselAttrsConfig = {
  "container": null,
  "data-show-control": true,
  "data-show-navigation": true,
  "data-autoplay": true,
  "data-vertical": true,
  "data-slides-per-view": 1,
  "data-animation": "slide-left",
  "data-loop": true,
  "data-slide-height": "",
  "data-slide-width": "",
  "data-pause-on-hover": true,
}

export const AttrsConfigMap: iCarouselAttrsConfig = {
  "container": "container",
  "data-show-control": "showControl",
  "data-show-navigation": "showNavigation",
  "data-autoplay": "autoPlay",
  "data-vertical": "vertical",
  "data-slides-per-view": "slidesPerView",
  "data-animation": "animation",
  "data-loop": "loop",
  "data-slide-height": "slideHeight",
  "data-slide-width": "slideWidth",
  "data-pause-on-hover": "pauseOnHover",
}

type iCarouselAnimation = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'

interface iResolvedConfig extends iCarouselConfig {
  maxIndex: number;
  maxDots: number;
  isSliding: boolean;
};

export class CarouselBuilder {
  // Instance State Variables
  private currentIndex = 0;
  private isTransitioning = false;
  private autoPlayTimer: number | undefined;

  private rConfig!: iResolvedConfig;
  private config: iCarouselConfig;

  // Element References
  private container!: HTMLElement;
  private track!: HTMLElement;
  private slides: HTMLElement[] = [];
  private dots: HTMLElement[] = [];
  private buttons: HTMLButtonElement[] = [];


  constructor(config: Partial<iCarouselConfig> = {}) {
    const defaultConfig: Required<iCarouselConfig> = {
      container: null,
      showNavigation: true,
      showControl: "auto",
      autoPlay: 4000,
      animation: "fade",
      slidesPerView: 1,
      vertical: false,
      loop: true,
      pauseOnHover: true,
      slideHeight: "",
      slideWidth: ""
    };
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 👑 CORE ENTRY POINT: Pintu masuk tunggal perakitan carousel
   */
  public create(data: iBasicNode): HTMLElement {
    this.destroy();
    this.currentIndex = 0;
    this.slides = [];
    this.dots = [];
    this.buttons = [];

    // 1. Ambil container fisik dari DOM/system
    this.container = this._getContainer() as HTMLElement;

    // console.log({ nodeRef })

    // 2. Intersep data kustom via attributes sebelum konfigurasi dikunci
    if (data && data.attrs) {
      this._mergeAttributesToConfig(data.attrs);
    } else if (this.container instanceof HTMLElement) {
      this._extractConfigFromDOM(this.container);
    }

    // 3. Kunci hasil konfigurasi akhir yang mutlak valid
    this.rConfig = this._resolveConfig(this.config, (data.content as iBasicNode[]).length);

    // 4. Bangun Elemen Dasar DOM Kerangka Utama
    const carouselElement = this._buildBaseDOM(data.content as iBasicNode[]);

    // 5. MODULAR ROUTER TERMINAL: Jalankan jalur penataan spesifik tanpa tambal sulam!
    if (this.rConfig.vertical) {
      this._activateVerticalMode(carouselElement);
    } else {
      this._activateHorizontalMode(carouselElement);
    }

    // 6. Pasang ke container tujuan akhir
    if (this.config.container) {
      this.container.appendChild(carouselElement);
    } else {
      this.container = carouselElement;
    }

    // 7. Nyalakan sistem pemutar otomatis
    if (this.rConfig.autoPlay) {
      this._startAutoPlay();
    }

    // 8. Bind hover events for pauseOnHover and auto controls
    if (this.config.pauseOnHover || this.config.showControl === 'auto' || this.config.showNavigation === 'auto') {
      carouselElement.addEventListener('mouseenter', () => {
        if (this.config.pauseOnHover && this.autoPlayTimer) {
          window.clearInterval(this.autoPlayTimer);
          this.autoPlayTimer = undefined;
        }
        carouselElement.classList.add('hovering');
      });
      carouselElement.addEventListener('mouseleave', () => {
        if (this.config.pauseOnHover && this.rConfig.autoPlay) {
          this._startAutoPlay();
        }
        carouselElement.classList.remove('hovering');
      });
    }

    return this.container;
  }

  /**
  * TERMINAL MODUL 1: Menghidupkan total penataan jalur mendatar (Horizontal)
  */
  private _activateHorizontalMode(carousel: HTMLElement): void {
    carousel.classList.add("orient-horizontal");

    const totalSlides = this.slides.length;
    const slidesPerView = this.rConfig.slidesPerView || 1;

    if (this.rConfig.animation === 'fade') {
      // Fade Mode: CSS handles stacking via .anim-fade CSS grid.
      // Clear any inline styles that might interfere.
      this.track.style.display = "";
      this.track.style.position = "";
      this.track.style.width = "";
      this.track.style.height = "";
    } else {
      // Sliding Modes: Use flex layout to arrange slides in a row
      this.track.style.display = "flex";
      this.track.style.flexDirection = this.rConfig.animation === 'slide-right' ? "row-reverse" : "row";
      this.track.style.height = "100%";

      const trackWidthPercentage = (totalSlides / slidesPerView) * 100;
      this.track.style.width = `${trackWidthPercentage}%`;

      const slideSizeInTrack = 100 / totalSlides;
      this.slides.forEach((slide) => {
        slide.style.position = "relative";
        slide.style.flex = this.rConfig.slideWidth && this.rConfig.slideWidth !== "auto" ? "none" : `0 0 ${slideSizeInTrack}%`;
        slide.style.width = this.rConfig.slideWidth || `${slideSizeInTrack}%`;
        slide.style.height = this.rConfig.slideHeight || "100%";
      });
    }

    this._executeAnimationEngine(true);
  }

  /**
   * TERMINAL MODUL 2: Menghidupkan total penataan jalur tegak lurus (Vertical)
   */
  private _activateVerticalMode(carousel: HTMLElement): void {
    carousel.classList.add("orient-vertical");
    this.track.style.display = "flex";
    this.track.style.flexDirection = this.rConfig.animation === 'slide-down' ? "column-reverse" : "column";
    this.track.style.width = "100%";

    const totalSlides = this.slides.length;
    const slidesPerView = this.rConfig.slidesPerView || 1;

    // 🧙‍♂️ FORMULA VERTIKAL FIX: Luaskan tinggi track raksasa secara linear ke arah BAWAH!
    // Contoh: 6 slides, slidesPerView 3 -> total tinggi track = 200% dari tinggi jendela intip
    const trackHeightPercentage = (totalSlides / slidesPerView) * 100;
    this.track.style.height = `${trackHeightPercentage}%`;

    // Ukuran tinggi per slide anak mengecil proporsional di dalam track raksasa vertikal
    // Contoh: 6 slides -> tinggi per slide = 100% / 6 = 16.666% dari total tinggi track raksasa
    const slideSizeInTrack = 100 / totalSlides;

    this.slides.forEach((slide) => {
      slide.style.position = "relative";
      slide.style.flex = this.rConfig.slideHeight && this.rConfig.slideHeight !== "auto" ? "none" : `0 0 ${slideSizeInTrack}%`;
      slide.style.height = this.rConfig.slideHeight || `${slideSizeInTrack}%`;
      if (!this.rConfig.slideHeight || this.rConfig.slideHeight === "auto") {
        slide.style.maxHeight = `${slideSizeInTrack}%`;
      }
      slide.style.width = this.rConfig.slideWidth || "100%";
    });

    this._executeAnimationEngine(true);
  }


  /**
   * 🎢 PUSAT KENDALI PENGANIMASIAN MODULAR (ANTI-JUMPING GUARANTEED)
   */
  private _executeAnimationEngine(immediate = false): void {
    // A. FADE MODE — CSS-driven transitions on individual slides
    if (this.rConfig.animation === 'fade' && !this.rConfig.vertical) {
      // For immediate (initial render), suppress CSS transitions temporarily
      if (immediate) {
        this.slides.forEach(slide => {
          slide.style.transition = "none";
        });
      }

      this.slides.forEach((slide, idx) => {
        if (idx === this.currentIndex) {
          slide.classList.add("active");
        } else {
          slide.classList.remove("active");
        }
      });
      this.track.style.transform = "none";

      // Re-enable CSS transitions after the forced paint
      if (immediate) {
        requestAnimationFrame(() => {
          this.slides.forEach(slide => {
            slide.style.transition = "";
          });
        });
      }
      return;
    }

    // B. SLIDING MODES — track-level transform transition
    if (immediate) {
      this.track.style.transition = "none";
    } else {
      this.track.style.transition = this.rConfig.vertical
        ? "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)"
        : "transform 0.5s ease-in-out";
    }

    const totalSlides = this.slides.length;
    if (totalSlides === 0) return;

    if (this.rConfig.vertical) {
      const slideSizeInTrack = 100 / totalSlides;
      const direction = this.rConfig.animation === 'slide-down' ? 1 : -1;
      const offset = this.currentIndex * slideSizeInTrack * direction;
      this.track.style.transform = `translateY(${offset}%)`;
    } else {
      const slideSizeInTrack = 100 / totalSlides;
      const direction = this.rConfig.animation === 'slide-right' ? 1 : -1;
      const offset = this.currentIndex * slideSizeInTrack * direction;
      this.track.style.transform = `translateX(${offset}%)`;
    }

    // Sync active class for caption animations
    this.slides.forEach((slide, idx) => {
      if (idx === this.currentIndex) slide.classList.add("active");
      else slide.classList.remove("active");
    });
  }

  public navigateTo(index: number, immediate = false): void {
    const totalSlides = this.slides.length;
    if (totalSlides === 0 || this.isTransitioning) return;

    let targetIndex = index;
    const loop = this.rConfig.loop && this.rConfig.isSliding;

    if (immediate) {
      this.currentIndex = targetIndex;
      this._executeAnimationEngine(true);
      return;
    }

    if (loop) {
      if (targetIndex > this.rConfig.maxIndex) targetIndex = 0;
      if (targetIndex < 0) targetIndex = this.rConfig.maxIndex;
    } else {
      if (targetIndex < 0) targetIndex = this.rConfig.maxIndex;
      if (targetIndex > this.rConfig.maxIndex) targetIndex = 0;
    }

    this.currentIndex = targetIndex;
    this._executeAnimationEngine(false);
    this._updateDots(loop as boolean);
  }

  public next = (): void => this.navigateTo(this.currentIndex + 1);
  public previous = (): void => this.navigateTo(this.currentIndex - 1);

  // --- Sub-routines Pengolah Atribut & DOM Dasar ---

  private _buildBaseDOM(content: iBasicNode[]): HTMLElement {
    const carousel = document.createElement("div");
    carousel.className = `carousel anim-${this.rConfig.animation}`;

    if (this.config.showControl === 'auto' || this.config.showNavigation === 'auto') {
      carousel.classList.add('auto-controls');
    }

    this.track = document.createElement("div");
    this.track.className = "track";
    this.slides = content.map((item, _index) => {
      const slide = document.createElement("div");
      slide.className = "slide";

      const inner = document.createElement("div");
      inner.className = "slide-inner";

      if (item.image) {
        const img = document.createElement("img");
        img.src = item.image; img.alt = item.title || "";
        img.className = "img-fluid";
        inner.appendChild(img);
      }

      if (item.title || item.description) {
        const caption = document.createElement("div");
        caption.className = "caption";
        if (item.title) {
          const t = document.createElement("h3");
          t.textContent = item.title;
          caption.appendChild(t);
        }
        if (item.description) {
          const desc = document.createElement("p");
          desc.textContent = item.description;
          caption.appendChild(desc);
        }
        inner.appendChild(caption);
      }

      slide.appendChild(inner);
      this.track.appendChild(slide);
      return slide;
    });

    carousel.appendChild(this.track);
    if (this.rConfig.showControl && this.slides.length > 1) {
      this._attachControls(carousel);
    }
    if (this.rConfig.showNavigation && this.slides.length > 1) {
      this._attachNavigation(carousel, this.slides.slice(0, this.rConfig.maxDots));
    }
    return carousel;
  }



  private _mergeAttributesToConfig(attrs: Record<string, any>): void {
    for (const [dataKey, rawValue] of Object.entries(attrs)) {
      const targetKey = (AttrsConfigMap as any)[dataKey];
      if (targetKey && targetKey in this.config) {
        let finalValue = rawValue;
        const defaultType = typeof (this.config as any)[targetKey];
        if (defaultType === "boolean" && typeof rawValue === "string") {
          finalValue = rawValue === "true";
        } else if (defaultType === "number" && typeof rawValue === "string") {
          finalValue = Number(rawValue);
        } (this.config as any)[targetKey] = finalValue;
      }
    }
  }

  private _extractConfigFromDOM(element: HTMLElement): void {
    const rawAttrs: Record<string, any> = {};
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith("data-") || attr.name === "container") {
        rawAttrs[attr.name] = attr.value;
      }
    }
    this._mergeAttributesToConfig(rawAttrs);
  }

  private _getContainer(): HTMLElement | null {
    if (!this.config.container) return document.createElement("div");
    return typeof this.config.container === "string" ? document.querySelector(this.config.container) : this.config.container;
  }
  private _startAutoPlay(): void {
    if (this.rConfig.autoPlay && this.slides.length > 1 && !this.autoPlayTimer) {
      const interval = typeof this.rConfig.autoPlay === 'number' ? this.rConfig.autoPlay : 3000;
      this.autoPlayTimer = window.setInterval(this.next, interval);
    }
  }

  private _resetAutoPlay = (): void => {
    if (this.autoPlayTimer) {
      window.clearInterval(this.autoPlayTimer);
      this._startAutoPlay();
    }
  }
  private _updateDots(loop: boolean): void {
    if (!this.rConfig.showNavigation || this.dots.length === 0) return;
    this.dots.forEach(d => d.classList.remove("active"));
    let dotActiveIndex = this.currentIndex;
    if (loop) {
      if (this.currentIndex > this.rConfig.maxIndex) dotActiveIndex = 0;
      if (this.currentIndex < 0) dotActiveIndex = this.rConfig.maxIndex;
    }
    if (this.dots[dotActiveIndex]) this.dots[dotActiveIndex].classList.add("active");
  }
  private _attachControls(carousel: HTMLElement): void {
    const isVert = this.rConfig.vertical;
    const prevBtn = document.createElement("button");
    prevBtn.className = "control prev"; prevBtn.innerHTML = isVert ? "▲" : "❮";
    prevBtn.onclick = () => { this.previous(); this._resetAutoPlay(); };
    const nextBtn = document.createElement("button");
    nextBtn.className = "control next";
    nextBtn.innerHTML = isVert ? "▼" : "❯";
    nextBtn.onclick = () => {
      this.next();
      this._resetAutoPlay();
    };
    this.buttons.push(prevBtn, nextBtn);
    carousel.append(prevBtn, nextBtn);
  }

  private _attachNavigation(carousel: HTMLElement, navigableSlides: HTMLElement[]): void {
    const navContainer = document.createElement("div");
    navContainer.className = `navigation ${this.rConfig.vertical ? "vertical-dots" : "horizontal-dots"}`;
    navigableSlides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      if (index === 0) dot.classList.add("active");
      dot.onclick = () => {
        this.navigateTo(index);
        this._resetAutoPlay();
      };
      this.dots.push(dot);
      navContainer.appendChild(dot);
    });
    carousel.appendChild(navContainer);
  }

  private _resolveConfig(config: Partial<iCarouselConfig>, totalSlides: number): iResolvedConfig {
    const slidesPerView = config.slidesPerView || 1;
    let animation = config.animation || 'fade';
    const vertical = config.vertical === true;
    // Paksa agar mode vertical selalu menggunakan klan sliding animation (slide-up) jika bernilai fade kaku
    if (vertical && animation === 'fade') { animation = 'slide-up'; }
    if (!vertical && slidesPerView > 1 && animation === 'fade') { animation = 'slide-left'; }
    const isSliding = animation.startsWith('slide');
    const maxIndex = isSliding ? totalSlides - slidesPerView : totalSlides - 1;
    const maxDots = isSliding ? totalSlides - slidesPerView + 1 : totalSlides;
    return {
      showControl: config.showControl ?? true,
      showNavigation: config.showNavigation ?? true,
      autoPlay: config.autoPlay ?? 4000,
      animation,
      slidesPerView,
      vertical,
      loop: config.loop ?? true,
      slideHeight: config.slideHeight,
      slideWidth: config.slideWidth,
      pauseOnHover: config.pauseOnHover ?? true,
      isSliding,
      maxIndex: maxIndex > 0 ? maxIndex : 0,
      maxDots: maxDots > 0 ? maxDots : 1
    };
  }

  public destroy(): void {
    if (this.autoPlayTimer) {
      window.clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = undefined;
    }
    this.buttons.forEach(b => b.onclick = null);
    this.dots.forEach(d => d.onclick = null);
    this.slides = [];
    this.dots = [];
    this.buttons = [];
    if (this.container && this.config.container) this.container.innerHTML = "";
  }
}


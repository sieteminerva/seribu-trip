import type { iSectionContent } from "../interface";

export interface iCarouselConfig {
  showControl?: boolean; // show arrow
  showNavigation?: boolean; // show the dot
  autoPlay?: boolean | number; // autoplay animation
  slidesPerView?: number; // how many slides per carousel
  animation?: 'fade' | 'slide-left' | 'slide-right'; // slide animation
  loop?: boolean; // loop the animation
}

// Internal operational configuration state
interface iResolvedConfig {
  animation: 'fade' | 'slide-left' | 'slide-right';
  slidesPerView: number;
  isSliding: boolean;
  maxIndex: number;
  maxDots: number;
}

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

  constructor(config: iCarouselConfig = {}) {
    this.config = config;

  }

  /**
   * Public API to get the fully assembled carousel element
   */
  public create(content: iSectionContent): HTMLElement {
    this.destroy();
    this.currentIndex = 0;
    this.slides = [];
    this.dots = [];
    this.buttons = [];
    const totalSlides = content.items.length;
    this.rConfig = this._resolveConfig(this.config, totalSlides);
    this.container = this._createContainer(content) || document.createElement("div");

    this._buildDOM(content);

    if (this.config.autoPlay) {
      this._startAutoPlay();
    }

    return this.container;
  }

  /**
   * Metode Final Pembersihan (Destroy) untuk Mencegah Memory Leak
   */
  public destroy(): void {
    // 1. Hentikan interval Autoplay jika sedang berjalan
    if (this.autoPlayTimer) {
      window.clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = undefined;
    }

    // 2. Putus semua event handler onclick pada Button (Controls & Dots)
    this.buttons.forEach(button => {
      button.onclick = null;
    });

    this.dots.forEach(dot => {
      dot.onclick = null;
    });

    // 3. Kosongkan internal array references agar GC (Garbage Collector) bisa membersihkannya
    this.slides = [];
    this.dots = [];
    this.buttons = [];

    // 4. Hapus semua element internal dari DOM container jika container sudah terbuat
    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  /**
   * Extracted Navigation Method
   */
  public navigateTo(index: number, immediate = false): void {
    const totalSlides = this.slides.length;
    if (totalSlides === 0 || this.isTransitioning) return;

    let targetIndex = index;
    const loop = this.config.loop && this.rConfig.isSliding;

    if (immediate) {
      this.track.style.transition = "none";
      this.currentIndex = targetIndex;
      this._updateSlidePosition();
      return;
    }

    // Handle structural loop boundary transformations
    if (loop) {
      if (targetIndex > this.rConfig.maxIndex) targetIndex = this.rConfig.maxIndex + 1;
      if (targetIndex < 0) targetIndex = -1;
    } else {
      if (targetIndex < 0) targetIndex = this.rConfig.maxIndex;
      if (targetIndex > this.rConfig.maxIndex) targetIndex = 0;
    }

    this.track.style.transition = "transform 0.5s ease-in-out";
    this.slides[this.currentIndex]?.classList.remove("active");

    this.currentIndex = targetIndex;

    if (this.rConfig.isSliding) {
      this._updateSlidePosition();
    } else {
      this.slides[this.currentIndex]?.classList.add("active");
    }

    this._updateDots(loop as boolean);

    // Handle loop boundary cleanup routines
    if (loop && (this.currentIndex > this.rConfig.maxIndex || this.currentIndex < 0)) {
      this.isTransitioning = true;
      setTimeout(() => {
        this.isTransitioning = false;
        const resetTo = this.currentIndex < 0 ? this.rConfig.maxIndex : 0;
        this.navigateTo(resetTo, true);
      }, 500);
    }
  }

  public next = (): void => this.navigateTo(this.currentIndex + 1);
  public previous = (): void => this.navigateTo(this.currentIndex - 1);

  // --- Core Lifecycle Breakdown Methods ---

  private _buildDOM(content: iSectionContent): void {
    const carousel = document.createElement("div");
    carousel.className = `carousel anim-${this.rConfig.animation}`;

    this.track = document.createElement("div");
    this.track.className = "track";

    this.slides = content.items.map((item, index) => {
      const slide = this._createSlide(item, index, this.rConfig.slidesPerView);
      this.track.appendChild(slide);
      return slide;
    });
    carousel.appendChild(this.track);

    if (this.config.showControl && this.slides.length > 1) {
      this._attachControls(carousel);
    }

    if (this.config.showNavigation && this.slides.length > 1) {
      const navigableSlides = this.slides.slice(0, this.rConfig.maxDots);
      this._attachNavigation(carousel, navigableSlides);
    }

    this.container.appendChild(carousel);
  }

  private _startAutoPlay(): void {
    if (this.config.autoPlay && this.slides.length > 1) {
      const interval = typeof this.config.autoPlay === 'number' ? this.config.autoPlay : 3000;
      this.autoPlayTimer = window.setInterval(this.next, interval);
    }
  }

  private _resetAutoPlay = (): void => {
    if (this.autoPlayTimer) {
      window.clearInterval(this.autoPlayTimer);
      this._startAutoPlay();
    }
  }

  // --- Context & Helper Sub-routines ---

  private _updateSlidePosition(): void {
    const itemWidth = 100 / this.rConfig.slidesPerView;
    const direction = this.rConfig.animation === 'slide-right' ? 1 : -1;
    const offset = this.currentIndex * itemWidth * direction;
    this.track.style.transform = `translateX(${offset}%)`;
  }

  private _updateDots(loop: boolean): void {
    if (!this.config.showNavigation || this.dots.length === 0) return;

    this.dots.forEach(d => d.classList.remove("active"));
    let dotActiveIndex = this.currentIndex;

    if (loop) {
      if (this.currentIndex > this.rConfig.maxIndex) dotActiveIndex = 0;
      if (this.currentIndex < 0) dotActiveIndex = this.rConfig.maxIndex;
    }

    if (this.dots[dotActiveIndex]) this.dots[dotActiveIndex].classList.add("active");
  }

  private _resolveConfig(config: iCarouselConfig, totalSlides: number): iResolvedConfig {
    const slidesPerView = config.slidesPerView || 1;
    let animation = config.animation || 'fade';

    if (slidesPerView > 1 && animation === 'fade') {
      animation = 'slide-left';
    }

    const isSliding = animation.startsWith('slide');
    const maxIndex = isSliding ? totalSlides - slidesPerView : totalSlides - 1;
    const maxDots = isSliding ? totalSlides - slidesPerView + 1 : totalSlides;

    return {
      animation,
      slidesPerView,
      isSliding,
      maxIndex: maxIndex > 0 ? maxIndex : 0,
      maxDots: maxDots > 0 ? maxDots : 1
    };
  }

  private _createContainer(content: iSectionContent): HTMLElement | null {
    const container = document.createElement("div");
    if (content.className) container.className = content.className;
    if (content.id) container.id = content.id;
    return container;
  }

  private _createSlide(item: any, index: number, slidesPerView: number): HTMLElement {
    const slide = document.createElement("div");
    slide.className = "slide";
    if (index === 0) slide.classList.add("active");

    const widthPercentage = 100 / slidesPerView;
    slide.style.flex = `0 0 ${widthPercentage}%`;
    slide.style.maxWidth = `${widthPercentage}%`;

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || "";
      img.className = "img-fluid";
      slide.appendChild(img);
    }

    if (item.title || item.description) {
      const caption = document.createElement("div");
      caption.className = "caption";
      if (item.title) {
        const title = document.createElement("h3");
        title.textContent = item.title;
        caption.appendChild(title);
      }
      if (item.description) {
        const desc = document.createElement("p");
        desc.textContent = item.description;
        caption.appendChild(desc);
      }
      slide.appendChild(caption);
    }

    return slide;
  }

  private _attachControls(carousel: HTMLElement): void {
    const prevBtn = document.createElement("button");
    prevBtn.className = "control prev";
    prevBtn.innerHTML = "❮";
    prevBtn.onclick = () => { this.previous(); this._resetAutoPlay(); };

    const nextBtn = document.createElement("button");
    nextBtn.className = "control next";
    nextBtn.innerHTML = "❯";
    nextBtn.onclick = () => { this.next(); this._resetAutoPlay(); };

    this.buttons.push(prevBtn, nextBtn);
    carousel.append(prevBtn, nextBtn);
  }

  private _attachNavigation(carousel: HTMLElement, slides: HTMLElement[]): void {
    const navContainer = document.createElement("div");
    navContainer.className = "navigation";

    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      if (index === 0) dot.classList.add("active");
      dot.onclick = () => { this.navigateTo(index); this._resetAutoPlay(); };
      this.dots.push(dot);
      navContainer.appendChild(dot);
    });

    carousel.appendChild(navContainer);
  }
}


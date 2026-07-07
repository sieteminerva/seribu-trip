import type { iSectionContent } from "../interface";

export interface iCarouselConfig {
  showControl?: boolean;
  showNavigation?: boolean;
  autoPlay?: boolean | number;
}

export class CarouselBuilder {
  static create(content: iSectionContent, config: iCarouselConfig = {}): HTMLElement {
    const container = this.createContainer(content);
    if (!container) return document.createElement("div"); // Fallback safety

    const carousel = document.createElement("div");
    carousel.className = "carousel";

    const track = document.createElement("div");
    track.className = "track";

    // 1. Generate slides
    const slides = content.items.map((item, index) => {
      const slide = this.createSlide(item, index);
      track.appendChild(slide);
      return slide;
    });
    carousel.appendChild(track);

    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoPlayTimer: number | undefined;

    // 2. Setup state management functions
    const goToSlide = (index: number) => {
      if (totalSlides === 0) return;
      slides[currentIndex].classList.remove("active");
      if (config.showNavigation && dots.length > 0) {
        dots[currentIndex].classList.remove("active");
      }

      currentIndex = (index + totalSlides) % totalSlides;

      slides[currentIndex].classList.add("active");
      if (config.showNavigation && dots.length > 0) {
        dots[currentIndex].classList.add("active");
      }
    };

    const next = () => goToSlide(currentIndex + 1);
    const previous = () => goToSlide(currentIndex - 1);

    const startAutoPlay = () => {
      if (config.autoPlay && totalSlides > 1) {
        const interval = typeof config.autoPlay === 'number' ? config.autoPlay : 3000;
        autoPlayTimer = window.setInterval(next, interval);
      }
    };

    const resetAutoPlay = () => {
      if (autoPlayTimer) {
        window.clearInterval(autoPlayTimer);
        startAutoPlay();
      }
    };

    // 3. Attach UI Extras (Controls & Dots)
    if (config.showControl && totalSlides > 1) {
      this.attachControls(carousel, next, previous, resetAutoPlay);
    }

    const dots: HTMLElement[] = [];
    if (config.showNavigation && totalSlides > 1) {
      this.attachNavigation(carousel, slides, goToSlide, resetAutoPlay, dots);
    }

    // 4. Initialize lifecycle behaviors
    startAutoPlay();
    container.appendChild(carousel);
    return container;
  }

  // --- Private Helper Methods ---

  private static createContainer(content: iSectionContent): HTMLElement | null {
    const container = document.createElement("div");
    if (content.className) container.className = content.className;
    if (content.id) container.id = content.id;
    return container;
  }

  private static createSlide(item: any, index: number): HTMLElement {
    const slide = document.createElement("div");
    slide.className = "slide";
    if (index === 0) slide.classList.add("active");

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || "";
      img.className = "img-fluid";
      slide.appendChild(img);
    }

    if (item.title || item.description) {
      slide.appendChild(this.createCaption(item));
    }

    return slide;
  }

  private static createCaption(item: any): HTMLElement {
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

    return caption;
  }

  private static attachControls(
    carousel: HTMLElement,
    onNext: () => void,
    onPrev: () => void,
    onReset: () => void
  ): void {
    const prevBtn = document.createElement("button");
    prevBtn.className = "control prev";
    prevBtn.innerHTML = "❮";
    prevBtn.onclick = () => { onPrev(); onReset(); };

    const nextBtn = document.createElement("button");
    nextBtn.className = "control next";
    nextBtn.innerHTML = "❯";
    nextBtn.onclick = () => { onNext(); onReset(); };

    carousel.append(prevBtn, nextBtn);
  }

  private static attachNavigation(
    carousel: HTMLElement,
    slides: HTMLElement[],
    onGoTo: (i: number) => void,
    onReset: () => void,
    dotsOutArray: HTMLElement[]
  ): void {
    const navContainer = document.createElement("div");
    navContainer.className = "navigation";

    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      if (index === 0) dot.classList.add("active");
      dot.onclick = () => { onGoTo(index); onReset(); };
      dotsOutArray.push(dot);
      navContainer.appendChild(dot);
    });

    carousel.appendChild(navContainer);
  }
}

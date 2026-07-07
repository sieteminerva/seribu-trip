import type { iSectionContent } from "../interface";

export interface iCarouselConfig {
  showControl?: boolean;
  showNavigation?: boolean;
  autoPlay?: boolean | number;
}

export class CarouselBuilder {
  static create(content: iSectionContent, config: iCarouselConfig = {}): HTMLElement {

    const container: HTMLElement | null = document.createElement("div");
    if (content.className) container.className = content.className;

    if (content.id && container) container.id = content.id;

    // container.classList.add("carousel");
    const carousel = document.createElement("div")
    carousel.className = "carousel";
    const track = document.createElement("div");
    track.className = "track";

    const slides: HTMLElement[] = [];

    // Create slides
    content.items.forEach((item, index) => {
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

      slides.push(slide);
      track.appendChild(slide);
    });

    carousel.appendChild(track);

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoPlayTimer: number | undefined;

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

    const nextSlide = () => goToSlide(currentIndex + 1);
    const prevSlide = () => goToSlide(currentIndex - 1);

    // Controls (Prev/Next)
    if (config.showControl && totalSlides > 1) {
      const prevBtn = document.createElement("button");
      prevBtn.className = "control prev";
      prevBtn.innerHTML = "&#10094;";
      prevBtn.onclick = () => { prevSlide(); resetAutoPlay(); };

      const nextBtn = document.createElement("button");
      nextBtn.className = "control next";
      nextBtn.innerHTML = "&#10095;";
      nextBtn.onclick = () => { nextSlide(); resetAutoPlay(); };

      carousel.append(prevBtn, nextBtn);
    }

    // Navigation (Dots)
    const dots: HTMLElement[] = [];
    if (config.showNavigation && totalSlides > 1) {
      const navContainer = document.createElement("div");
      navContainer.className = "navigation";

      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = "dot";
        if (index === 0) dot.classList.add("active");
        dot.onclick = () => { goToSlide(index); resetAutoPlay(); };
        dots.push(dot);
        navContainer.appendChild(dot);
      });
      carousel.appendChild(navContainer);
    }

    // AutoPlay
    const startAutoPlay = () => {
      if (config.autoPlay && totalSlides > 1) {
        const interval = typeof config.autoPlay === 'number' ? config.autoPlay : 3000;
        autoPlayTimer = window.setInterval(nextSlide, interval);
      }
    };

    const resetAutoPlay = () => {
      if (autoPlayTimer) {
        window.clearInterval(autoPlayTimer);
        startAutoPlay();
      }
    };

    startAutoPlay();

    container.appendChild(carousel);
    return container;

  }
}
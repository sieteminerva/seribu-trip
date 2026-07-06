import type { iSectionContent } from "../interface";

export class MasonryBuilder {
  static create(content: iSectionContent): HTMLElement {
    const section = document.createElement("section");
    section.className = "section masonry-gallery";
    if (content.id) section.id = content.id;
    if (content.className) section.classList.add(...content.className.split(" "));

    const grid = document.createElement("div");
    grid.className = "masonry-grid";

    const images: string[] = [];

    // Modal
    const modal = document.createElement("div");
    modal.className = "gallery-modal hidden";
    
    const modalImg = document.createElement("img");
    modalImg.className = "gallery-modal-img";
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "gallery-modal-close";
    closeBtn.innerHTML = "&times;";

    const nextBtn = document.createElement("button");
    nextBtn.className = "gallery-modal-next";
    nextBtn.innerHTML = "&#10095;";

    const prevBtn = document.createElement("button");
    prevBtn.className = "gallery-modal-prev";
    prevBtn.innerHTML = "&#10094;";

    modal.append(prevBtn, modalImg, nextBtn, closeBtn);

    let currentIndex = 0;

    const showModal = (index: number) => {
      currentIndex = index;
      modalImg.src = images[currentIndex];
      modal.classList.remove("hidden");
    };

    closeBtn.onclick = () => modal.classList.add("hidden");
    nextBtn.onclick = () => showModal((currentIndex + 1) % images.length);
    prevBtn.onclick = () => showModal((currentIndex - 1 + images.length) % images.length);

    content.items.forEach((item, index) => {
      if (item.image) {
        images.push(item.image);
        
        const card = document.createElement("div");
        card.className = "masonry-item";
        
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title || "Gallery image";
        img.className = "img-fluid";
        
        card.appendChild(img);
        grid.appendChild(card);
        
        card.addEventListener("click", () => showModal(index));
      }
    });

    section.append(grid, modal);
    return section;
  }
}
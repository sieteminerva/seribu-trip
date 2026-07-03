import type { iHeroContent } from "../interface";

export class HeroBuilder {
  static create(content: iHeroContent): HTMLElement {
    const hero = document.createElement("div");
    hero.className = "hero-media"
    hero.innerHTML = `
      ${content.image ? `<img src="${content.image}" alt="${content.title}" />` : ''}
      ${content.actions?.map(item => `
          <a id=${item.id} href=${item.href} class=${item.className}>
            ${item.label}
          </a>
        `).join('')}
    `;
    return hero;
  }
}
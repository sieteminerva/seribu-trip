
import type { iMenuContent } from "../interface";

export class MenuBuilder {

  static create(content: iMenuContent): HTMLElement {
    const nav = document.createElement('nav');
    nav.id = content.id as string;
    nav.className = content.className as string || 'nav';

    const items = Array.isArray(content.items) ? content.items : [content.items];
    const brand = items[0] || { title: 'Logo', link: '#' };
    const links = items.slice(1);

    nav.innerHTML = `
      <div class="brand"><a href="${brand.link || '#'}">${brand.title}</a></div>
      <ul class="items">
        ${links.map(link => `<li><a href="${link.link || '#'}">${link.title}</a></li>`).join('')}
      </ul>
      <div class="actions">
        <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Toggle theme">
          <span class="theme-toggle-track"><span class="theme-toggle-thumb"></span></span>
          <span class="theme-toggle-label">${document.documentElement.dataset.theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <a type="button" class="button small" href="#contact">Hubungi</a>
      </div>
    `;

    const toggleButton = nav.querySelector<HTMLButtonElement>('[data-theme-toggle]');
    const toggleLabel = nav.querySelector<HTMLElement>('.theme-toggle-label');
    const updateToggleState = () => {
      const isDark = document.documentElement.dataset.theme === 'dark';
      toggleButton?.classList.toggle('is-dark', isDark);
      if (toggleLabel) {
        toggleLabel.textContent = isDark ? 'Light' : 'Dark';
      }
    };

    updateToggleState();
    toggleButton?.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      window.dispatchEvent(new CustomEvent('landing-page-theme-change', { detail: { theme: nextTheme } }));
      updateToggleState();
    });

    return nav;
  }
}
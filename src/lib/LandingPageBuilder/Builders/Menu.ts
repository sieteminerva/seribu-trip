
import type { iMenuContent } from "../interface";

export class MenuBuilder {

  static create(content: iMenuContent): HTMLElement {
    const normalizeTheme = (theme?: string | null): 'light' | 'dark' => theme?.toLowerCase() === 'dark' ? 'dark' : 'light';
    const getTheme = () => normalizeTheme(document.documentElement.dataset.theme);
    const applyTheme = (theme: 'light' | 'dark') => {
      document.documentElement.dataset.theme = theme;
      if (document.body) {
        document.body.dataset.theme = theme;
      }
      nav.dataset.theme = theme;
      toggleButton?.classList.toggle('is-dark', theme === 'dark');
      if (toggleLabel) {
        toggleLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';
      }
    };

    const nav = document.createElement('nav');
    nav.id = content.id as string;
    nav.className = content.className as string || 'nav';

    const items = Array.isArray(content.items) ? content.items : [content.items];
    const brand = items[0] || { title: 'Logo', link: '#' };
    const links = items.slice(1);

    nav.innerHTML = `
      <div class="brand"><a href="${brand.link || '#'}">${brand.title}</a></div>
      <ul class="items">
        ${links.map((link: any) => `
        <li>
          <a ${link.id ? 'id="' + link.id + '"' : ""} ${link.className ? 'class="' + link.className + '"' : ""} href="${link.link || '#'}">${link.title}</a>
        </li>`).join('')
      }
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
    applyTheme(getTheme());
    toggleButton?.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    return nav;
  }
}

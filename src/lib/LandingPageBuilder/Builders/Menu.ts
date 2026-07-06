
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
      toggleButton.classList.toggle('is-dark', theme === 'dark');
      toggleLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';
    };

    // 1. Buat elemen NAV utama
    const nav = document.createElement('nav');
    nav.id = content.id as string;
    nav.className = content.className as string || 'nav';

    const items = Array.isArray(content.items) ? content.items : [content.items];
    const brandData = items[0] || { title: 'Logo', link: '#' };
    const linksData = items.slice(1);

    // 2. Buat elemen Brand
    const brandDiv = document.createElement('div');
    brandDiv.className = 'brand';

    const brandLink = document.createElement('a');
    brandLink.href = brandData.link || '#';
    brandLink.textContent = brandData.title;

    brandDiv.appendChild(brandLink);
    nav.appendChild(brandDiv);

    // 3. Buat elemen Menu Items (UL & LI)
    const ulItems = document.createElement('ul');
    ulItems.className = 'items';

    linksData.forEach((link: any) => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      if (link.id) a.id = link.id;
      if (link.className) a.className = link.className;
      a.href = link.link || '#';
      a.textContent = link.title;

      li.appendChild(a);
      ulItems.appendChild(li);
    });
    nav.appendChild(ulItems);

    // 4. Buat elemen Actions & Theme Toggle
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'theme-toggle-btn';
    toggleButton.setAttribute('data-theme-toggle', '');
    toggleButton.setAttribute('aria-label', 'Toggle theme');

    const toggleTrack = document.createElement('span');
    toggleTrack.className = 'theme-toggle-track';

    const toggleThumb = document.createElement('span');
    toggleThumb.className = 'theme-toggle-thumb';

    toggleTrack.appendChild(toggleThumb);
    toggleButton.appendChild(toggleTrack);

    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'theme-toggle-label';
    toggleLabel.textContent = document.documentElement.dataset.theme === 'dark' ? 'Light' : 'Dark';
    toggleButton.appendChild(toggleLabel);

    // Hubungi Button
    const contactLink = document.createElement('a');
    // Catatan: Menggunakan setAttribute untuk 'type' pada elemen <a> jika diperlukan oleh framework CSS Anda, 
    // karena secara native elemen <a> tidak memiliki properti .type berupa button.
    contactLink.setAttribute('type', 'button');
    contactLink.className = 'button small';
    contactLink.href = '#contact';
    contactLink.textContent = 'Hubungi';

    actionsDiv.appendChild(toggleButton);
    actionsDiv.appendChild(contactLink);
    nav.appendChild(actionsDiv);

    // 5. Inisialisasi Tema & Event Listener
    applyTheme(getTheme());

    toggleButton.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    return nav;
  }
}


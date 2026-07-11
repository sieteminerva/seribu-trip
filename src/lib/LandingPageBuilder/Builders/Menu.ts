
import type { iActionProperty, iBasicNode } from "../interface";

export class MenuBuilder {

  static create(data: iBasicNode): HTMLElement {
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
    nav.id = data.id as string;
    nav.className = data.className as string || 'nav';

    const items = Array.isArray(data.actions) ? data.actions : [data.actions];
    const brandData = (items[0] || { label: 'Logo', href: '#' }) as iActionProperty;
    const linksData = items.slice(1);

    // 2. Buat elemen Brand
    const brandDiv = document.createElement('div');
    brandDiv.className = 'brand';

    const brandLink = document.createElement('a');
    brandLink.href = brandData.href || '#';
    brandLink.textContent = brandData.label as string;

    brandDiv.appendChild(brandLink);
    nav.appendChild(brandDiv);

    // Hamburger button (Mobile)
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.type = 'button';
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.setAttribute('aria-label', 'Toggle menu');
    hamburgerBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>';
    nav.appendChild(hamburgerBtn);

    // 3. Buat elemen Menu Items (UL & LI)
    const ulItems = document.createElement('ul');
    ulItems.className = 'items';

    linksData.forEach((link?: any) => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      if (link?.id) a.id = link.id;
      if (link?.className) a.className = link.className;
      a.href = link?.href || '#';
      a.textContent = link?.label as string;

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

    hamburgerBtn.addEventListener('click', () => {
      nav.classList.toggle('menu-open');
    });

    return nav;
  }
}



import type { iActionProperty, iBasicNode } from "../interface";
import "./Menu.css";

export class MenuBuilder {

  static create(data: iBasicNode): HTMLElement {

    const normalizeTheme = (mode?: string | null): 'light' | 'dark' => mode?.toLowerCase() === 'dark' ? 'dark' : 'light';
    const getTheme = () => normalizeTheme(document.documentElement.dataset.mode);
    const applyTheme = (mode: 'light' | 'dark') => {
      document.documentElement.dataset.mode = mode;
      if (document.body) {
        document.body.dataset.mode = mode;
      }
      nav.dataset.mode = mode;
      toggleButton.classList.toggle('is-dark', mode === 'dark');
      toggleLabel.textContent = mode === 'dark' ? 'Light' : 'Dark';
    };

    const content = data.content as iBasicNode
    // 1. Buat elemen NAV utama
    const nav = document.createElement('nav');
    nav.id = content.id as string;
    nav.className = "nav";
    if (content.className) nav.classList.add(content.className);

    const items = Array.isArray(content.actions) ? content.actions : [content.actions];
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
    toggleLabel.textContent = document.documentElement.dataset.mode === 'dark' ? 'Light' : 'Dark';
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


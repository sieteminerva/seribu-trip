import type { iSectionContent, iActionProperty } from "../interface";

export class SectionBuilder {

  static create(content: iSectionContent, config = { tagName: "section" }): HTMLElement {
    console.log({ content });

    const el = document.createElement(config.tagName);
    el.id = content.id as string || '';
    el.className = 'section ' + ((content.className ? content.className : "row") || "");

    const items = Array.isArray(content.items) ? content.items : [content.items];

    // Iterasi setiap item dan buat element DOM secara prosedural
    items.forEach(item => {
      // 1. Gambar (Image Column)
      if (item.image) {
        const colDiv = document.createElement('div');
        colDiv.className = 'column half';

        const img = document.createElement('img');
        img.className = 'img-fluid';
        img.src = encodeURI(item.image);
        img.alt = item.title || '';

        colDiv.appendChild(img);
        el.appendChild(colDiv);
      }

      // 2. Judul (Title)
      if (item.title) {
        const h2 = document.createElement('h2');
        h2.className = 'title';
        h2.textContent = item.title; // Aman dari XSS
        el.appendChild(h2);
      }

      // 3. Deskripsi (Description)
      if (item.description) {
        const p = document.createElement('p');
        p.className = 'desc';
        p.textContent = item.description; // Aman dari XSS
        el.appendChild(p);
      }

      // 4. Aksi (Actions)
      if (item.actions && Array.isArray(item.actions)) {
        const actionsEl = this.createAction(item.actions as iActionProperty[]);
        if (actionsEl) {
          el.appendChild(actionsEl);
        }
      }
    });

    return el;
  }

  // Mengubah return type dari string menjadi HTMLElement | null
  static createAction(actions: iActionProperty[], config = { actionWrapper: "actions" }): HTMLElement | null {
    if (!actions.length) return null;

    const wrapper = document.createElement('div');
    wrapper.className = config.actionWrapper;

    actions.forEach((action) => {
      if (action.href) {
        // Buat elemen Anchor (Link)
        const a = document.createElement('a');
        a.href = action.href;
        a.className = action.className || 'link secondary';
        a.textContent = action.label || '';
        wrapper.appendChild(a);
      } else {
        // Buat elemen Button
        const btn = document.createElement('button');
        btn.type = action.type as any || 'button';
        btn.className = action.className || 'button primary';
        btn.textContent = action.label || '';

        if (action.id) {
          btn.id = action.id;
        }

        if (action.onClick) btn.addEventListener("click", action.onClick);

        wrapper.appendChild(btn);
      }
    });

    return wrapper;
  }
}

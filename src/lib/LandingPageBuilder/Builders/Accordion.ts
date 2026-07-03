import type { iAccordionContent } from "../interface";


export class AccordionBuilder {

  static create(content: iAccordionContent): HTMLElement {
    const el = document.createElement('section');
    el.id = content.id as string;
    el.className = content.className as string || "section card";

    const items = Array.isArray(content.items) ? content.items : [content.items];

    const headData = items[0] || { eyebrow: '', title: '' };

    el.innerHTML = `
      ${headData.eyebrow ? `<p class="eyebrow">${headData.eyebrow}</p>` : ''}
      <h2 style="width: 100%; text-align: center;">${content.name || 'Pertanyaan Populer (FAQ)'}</h2>
      <div class="accordion">
        ${items.map((item: any) => `
          <details>
            <summary>${item.title}</summary>
            <div class="content">
              <p>${item.description}</p>
            </div>
          </details>
        `).join('')}
      </div>
    `;
    return el;
  }
}
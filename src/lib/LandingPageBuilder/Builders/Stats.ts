import type { iStatsContent } from "../interface";



export class StatsBuilder {
  interfaceType = 'stats';

  static create(content: iStatsContent): HTMLElement {
    const section = document.createElement('section');
    section.id = content.id as string || '';
    section.className = content.className || 'section row card';
    const items = Array.isArray(content.items) ? content.items : [content.items];

    items.forEach(item => {
      const column = document.createElement("div");
      column.className = "column stat";

      if (item.title) {
        const title = document.createElement("strong");
        title.textContent = item.title;
        column.appendChild(title);
      }

      if (item.description) {
        const desc = document.createElement("span");
        desc.textContent = item.description;
        column.appendChild(desc);
      }

      section.appendChild(column);
    });

    return section;
  }
}
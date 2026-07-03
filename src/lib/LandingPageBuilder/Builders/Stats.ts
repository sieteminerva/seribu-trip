import type { iStatsContent } from "../interface";



export class StatsBuilder {
  interfaceType = 'stats';

  static create(content: iStatsContent): HTMLElement {
    const el = document.createElement('section');
    el.id = content.id as string || '';
    el.className = content.className || 'section row card';
    const items = Array.isArray(content.items) ? content.items : [content.items];

    el.innerHTML = items.map(item => `
     <div class="column stat">
       <strong>${item.title}</strong>
       <span>${item.description}</span>
     </div>
   `).join('');

    return el;
  }
}
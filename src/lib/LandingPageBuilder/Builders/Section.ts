import type { iActionProperty, iSectionContent } from "../interface";

export class SectionBuilder {

  static create(content: iSectionContent, config = { tagName: "section" }): HTMLElement {
    console.log({ content })
    const el = document.createElement(config.tagName);
    el.id = content.id as string || '';
    el.className = 'section ' + ((content.className ? content.className : "row") || "");
    const items = Array.isArray(content.items) ? content.items : [content.items];

    el.innerHTML = items.map(item => `

        ${item.image ? `<div class="column half"><img class="img-fluid" src="${encodeURI(item.image)}" alt="${item.title}" /></div>` : ''}
        ${item.title ? `<h2 class="title">${item.title}</h2>` : ''}
        ${item.description ? `<p class="desc">${item.description}</p>` : ''}
        ${item.actions && Array.isArray(item.actions) ? this.createAction(item.actions as iActionProperty[]) : ""}

    `).join('');

    return el;
  }

  static createAction(actions: iActionProperty[], config = { actionWrapper: "actions" }): string {
    if (!actions.length) return '';

    return `
      <div class="${config.actionWrapper}">
        ${actions.map((action) => {
      if (action.href) {
        return `<a href="${action.href}" class="${action.className || 'link secondary'}">${action.label || ''}</a>`;
      }

      return `<button type="${action.type || 'button'}" class="${action.className || 'button primary'}"${action.id ? ` id="${action.id}"` : ''}>${action.label || ''}</button>`;
    }).join('')}
      </div>
      `;

  }
}

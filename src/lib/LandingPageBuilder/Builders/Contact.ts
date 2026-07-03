import type { iContactContent } from "../interface";


export class ContactBuilder {

  static create(content: iContactContent): HTMLElement {
    const footer = document.createElement('footer');
    footer.id = content.id as string;
    footer.className = content.className || "footer";

    footer.innerHTML = `
      <div class="row">
        <div class="column">
          <h2>${content.title}</h2>
          <p>${content.description}</p>
        </div>
        <div class="column">
          <h3>Kontak & Informasi</h3>
          <ul class="unstyled-list">
            ${content.items?.map(item => `
            <li>
              <a id=${item.id} href=${item.data} class=${item.className}>${item.label} ${item.data}</a>
            </li>
          `).join('')}

          </ul>
        </div>
      </div>
      <div class="row bottom">
        <p>&copy; ${new Date().getFullYear()} ${content.title}. All rights reserved.</p>
      </div>
    `;
    return footer;
  }
}
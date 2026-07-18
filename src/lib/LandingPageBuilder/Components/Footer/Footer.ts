import type { iActionProperty, iBasicNode, iBuilderConfig } from "../../interface";

export type FooterElementType =
  | "@footer"
  | "@footer>row"
  | "@footer>row>column"
  | "@footer>row>column>header"
  | "@footer>row>column>desc"
  | "@footer>row>column>list"
  | "@footer>row>column>list>item"
  | "@footer>copyright"

export interface iFooterConfig extends iBuilderConfig<FooterElementType> {
  useCopyright: boolean,
  useContact: boolean
}


export class FooterBuilder {
  public config!: Required<iFooterConfig>

  constructor(_config: Partial<iFooterConfig>) {
    const defaultConfig: Required<iFooterConfig> = {
      themeId: "default",
      useContact: true,
      useCopyright: true,
      selectors: {
        "@footer": { tagName: "footer", className: "footer" },
        "@footer>row": { tagName: "div", className: "row" },
        "@footer>row>column": { tagName: "div", className: "column" },
        "@footer>row>column>header": { tagName: "div", className: "header" },
        "@footer>row>column>desc": { tagName: "div", className: "desc" },
        "@footer>row>column>list": { tagName: "ul", className: "unstyled-list" },
        "@footer>row>column>list>item": { tagName: "li", className: "item" },
        "@footer>copyright": { tagName: "div", className: "row" }
      },
      emit: () => { }
    };

    this.config = { ...defaultConfig, ..._config, ...defaultConfig.selectors, ..._config.selectors }

  }

  static create(data: iBasicNode, _config: Partial<iFooterConfig> = {}): HTMLElement {
    // console.log("FooterBuilder", { data })
    const content = data.content as iBasicNode;

    const footer = document.createElement('footer');
    footer.id = content.id as string;
    footer.className = content.className || "footer";

    // 1. Buat Baris Utama (Top Row)
    const topRow = document.createElement('div');
    topRow.className = 'row';

    // Kolom Kiri: Judul & Deskripsi
    const infoCol = document.createElement('div');
    infoCol.className = 'column';

    const h2 = document.createElement('h2');
    h2.className = "header"
    h2.textContent = content.title || '';
    infoCol.appendChild(h2);

    const pDesc = document.createElement('p');
    pDesc.textContent = content.description || '';
    infoCol.appendChild(pDesc);

    topRow.appendChild(infoCol);

    // Kolom Kanan: Daftar Kontak
    const contactCol = document.createElement('div');
    contactCol.className = 'column';

    const h3 = document.createElement('h3');
    h3.textContent = 'Kontak & Informasi';
    contactCol.appendChild(h3);

    const ul = document.createElement('ul');
    ul.className = 'unstyled-list';

    if (content.actions && Array.isArray(content.actions)) {
      content.actions.forEach((item: iActionProperty) => {
        const li = document.createElement('li');
        li.className = "item";
        const a = document.createElement('a');

        if (item.id) a.id = item.id as string;
        if (item.className) a.className = item.className as string;
        a.href = item.href as string || '#';

        // Menggabungkan label dan content teks secara aman
        a.textContent = `${item.label || ''} ${item.href || ''}`.trim();

        li.appendChild(a);
        ul.appendChild(li);
      });
    }

    contactCol.appendChild(ul);
    topRow.appendChild(contactCol);
    footer.appendChild(topRow);

    // 2. Buat Baris Bawah (Bottom Row - Copyright)
    const bottomRow = document.createElement('div');
    bottomRow.className = 'row bottom';

    const pCopy = document.createElement('p');
    pCopy.textContent = `© ${new Date().getFullYear()} ${content.title || ''}. All rights reserved.`;

    bottomRow.appendChild(pCopy);
    footer.appendChild(bottomRow);

    return footer;
  }
}

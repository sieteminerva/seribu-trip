import type { iActionProperty, iBasicNode, iBuilderConfig } from "../../interface";
import { Builder } from "../Base";

export type SectionElementType =
  | "@section"
  | "@section>content"
  | "@section>content>image"
  | "@section>content>header"
  | "@section>content>desc"
  | "@section>content>actions"
  | "@section>content>actions>item";

export interface iSectionConfig extends iBuilderConfig<SectionElementType> {

}

export class SectionBuilder extends Builder<SectionElementType, iSectionConfig> {
  readonly builderId = "section";
  readonly name = "section";
  readonly stylesheet: string = "";
  public config: any;

  constructor(config: Partial<iSectionConfig> = {}) {
    super();
    // 💡 KEMBALI SUCI: Kamus selektor kaku Anda terbebas murni dari properti isArray kuno!
    const defaultSelectors: Record<SectionElementType, iActionProperty> = {
      "@section": { tagName: "section", className: "section" },
      "@section>content": { tagName: "div", className: "column" },
      "@section>content>image": { tagName: "img", className: "img-fluid" },
      "@section>content>header": { tagName: "h2", className: "title" },
      "@section>content>desc": { tagName: "p", className: "desc" },
      "@section>content>actions": { tagName: "div", className: "actions" },
      "@section>content>actions>item": { tagName: "button", className: "button" }
    };

    const defaultConfig: Required<iSectionConfig> = {
      themeId: "default",
      selectors: defaultSelectors,
      emit: () => { }
    }

    this.config = this.resolveConfig(defaultConfig, config);
  }

  /**
   * 👑 THE REFINED COMPILER GATEWAY
   * Ultra-Slim, 100% Linear, dan terintegrasi penuh dengan saku memori JIT Map!
   */
  public prepare(data: iBasicNode, _config: Partial<iSectionConfig> = {}): HTMLElement {

    // 1. Lahirkan Cangkang Makro Terluar Seksi (@section)
    const section = this.render("@section", data);

    // Normalisasi data array kolom konten dari Sheets (Mendukung Multi-Instance Kolom)
    const contentDataRows = Array.isArray(data.content) ? data.content : [data.content];

    // 2. Loop Linear Tingkat Kolon Isi Konten (N-Columns)
    contentDataRows.forEach((columnItem: any) => {
      // Lahirkan boks pembungkus kolom konten
      const contentBox = this.render("@section>content", columnItem);

      // Lahirkan anak-anak atomik di level memori RAM membawa data item tunggal!
      const image = this.render("@section>content>image", columnItem);
      const header = this.render("@section>content>header", columnItem);
      const desc = this.render("@section>content>desc", columnItem);
      const actions = this.render("@section>content>actions", columnItem);

      // 🧙‍♂️ LOOP TINGKAT ATOM PALING DALAM: Cetak baris tombol aksi kustom (.actions>item)
      const actionItems = Array.isArray(columnItem.actions) ? columnItem.actions : [];
      actionItems.forEach((actionData: any) => {
        const btnItem = this.render("@section>content>actions>item", actionData);
        if (btnItem && actions) actions.appendChild(btnItem);
      });

      // Jahit organ tubuh secara ksatria vanilla
      if (image && columnItem.image) contentBox?.appendChild(image);
      if (header && columnItem.title) contentBox?.appendChild(header);
      if (desc && columnItem.description) contentBox?.appendChild(desc);
      if (actions && actionItems.length > 0) contentBox?.appendChild(actions);

      section?.appendChild(contentBox!);
    });

    // Amankan dan kembalikan elemen kontainer makro terluarnya secara standard via Map get!
    return this.load("@section") as HTMLElement;
  }

  /**
   * 👑 THE SEPARATED HYDRATION VALVE (POS PENYIRAMAN RAHIM DATA)
   * Kebal XSS murni vanilla, terisolasi penuh, 0% campur tangan birokrasi engine pusat!
   */
  protected template(typeKey: SectionElementType, el: HTMLElement, payload?: any): void {
    if (!payload) return;

    switch (typeKey) {
      case "@section":
        el.id = payload.id || "";
        // Jika pembungkus luar memiliki set custom class dari Sheets, siram!
        if (payload.className) el.className = `section ${payload.className}`.trim();
        break;

      case "@section>content>image":
        el.setAttribute("src", encodeURI(payload.image || ""));
        el.setAttribute("alt", payload.title || "section-graphic");
        break;

      case "@section>content>header":
        el.textContent = payload.title || "";
        break;

      case "@section>content>desc":
        el.textContent = payload.description || "";
        break;

      case "@section>content>actions>item":
        el.textContent = payload.label || "";

        // Fleksibilitas perubahan tag otomatis (Anchor vs Button) mengikuti isi data href
        if (payload.href) {
          const anchor = el as HTMLAnchorElement;
          anchor.href = payload.href;
          // Pancing penguncian perosotan scroll passthrough satu pintu jika dibutuhkan:
          // (this as any).bindNavigation?.(anchor, payload.href);
        } else {
          const btn = el as HTMLButtonElement;
          btn.type = payload.type || "button";
          if (payload.onClick) btn.addEventListener("click", payload.onClick);
        }
        break;
    }
  }

  public initialize(): void {
    // Ambil akses langsung elemen dari saku Map jika butuh mengikat event eksternal
    console.log(`[Section Connected] Blueprint for component "${this.name}" successfully deployed.`);
  }
}

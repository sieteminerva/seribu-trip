import type { iActionProperty, iBasicNode, iBuilderConfig, iElementProperty } from "../../interface";
import { BuilderRenderer, type iBuilder } from "../../Modules/BuilderRenderer";
import { TemplateRegistry, type TemplateHandler } from "../../Modules/TemplateRegistry";

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

export class SectionBuilder implements iBuilder<SectionElementType> {
  readonly builderId = "section";
  readonly name = "section";
  readonly stylesheet = "";

  protected rawDataNode: any = null;

  /**
   * Builder Specific Config 
   * @memberof SectionBuilder
   */
  public config!: Required<iSectionConfig>;

  readonly defaultTemplate: TemplateHandler<SectionElementType> = this.template.bind(this);

  constructor(config: Partial<iSectionConfig>) {
    const defaultSelectors: Record<SectionElementType, iElementProperty> = {
      "@section": { tagName: "section", className: "section" },
      "@section>content": { tagName: "div", className: "column", isArray: true },
      "@section>content>image": { tagName: "img", className: "img-fluid" },
      "@section>content>header": { tagName: "h2", className: "title" },
      "@section>content>desc": { tagName: "p", className: "desc" },
      "@section>content>actions": { tagName: "div", className: "actions", isArray: true },
      "@section>content>actions>item": { tagName: "div", className: "item" }
    }
    const defaultConfig: Required<iSectionConfig> = {
      themeId: "default",
      selectors: defaultSelectors,
      emit: () => { }
    };

    this.config = BuilderRenderer.resolveConfig<iSectionConfig>(defaultConfig, config);
  }

  public create(content: iBasicNode, config?: Partial<iSectionConfig>) {
    this.config = BuilderRenderer.resolveConfig<iSectionConfig>(this.config, config);

    return BuilderRenderer.compile(this as any, content);
  }

  protected resolvePayload(content: iBasicNode): Partial<Record<SectionElementType, any>> {
    const items = Array.isArray(content.items) ? content.items : [content.items];
    return {
      "@section": content,
      "@section>content": items, // Berupa array untuk di-loop massal otomatis oleh framework!
      "@section>content>image": {},
      "@section>content>header": {},
      "@section>content>desc": {},
      "@section>content>actions": {}
    };
  }

  // ====================================================
  // 🧱 POS RUNTIME INITIALIZE: Tempat Pengikatan Event Interaksi Runtime Pasca-Render
  // ====================================================
  public initialize(root: HTMLElement): void {
    console.log(`[Section Runtime Active] Section DOM tree with ID "${root.id}" successfully mounted and initialized.`);
    // Jika komponen seksi Anda membutuhkan inisialisasi AOS scroll animation, pemicunya ditaruh di sini steril!
  }

  // ====================================================
  // 🧱 POS STRUCTURAL TEMPLATE: Satu-satunya Pabrik Perakit Rahim HTML Komponen Seksi
  // Menghancurkan total puluhan baris kodingan prosedural document.createElement kaku!
  // ====================================================
  protected template(typeKey: SectionElementType, el: HTMLElement, payload: any, _selector: any): void {

    // 🧪 POS A: KONTAINER UTAMA SEKSI (@section)
    if (typeKey === "@section") {
      el.id = payload.id || "";
      el.className = `section ${payload.className || "row"}`.trim();
    }

    // 🧪 POS B: KONTAINER KOLOM ISI KONTEN (@section>content)
    // 💡 CATATAN: Di titik ini, 'payload' dijamin 100% memegang SATU OBJEK DATA ITEM BERSIH 
    // hasil semburan loop otomatis framework induk, bukan lagi berupa array kotor!
    else if (typeKey === "@section>content") {
      // Pembungkus kolom konten Anda selesai dicetak, sekarang pancing organ dalamnya merakit diri

      // 1. Injeksi Gambar secara dinamis jika datanya eksis di database Sheets
      if (payload.image) {
        const imgSelector = this.config.selectors["@section>content>image"];
        const imgEl = document.createElement(imgSelector.tagName || "img");
        imgEl.className = imgSelector.className || "img-fluid";

        // Panggil Cascade Resolver secara legal untuk mengizinkan tema luar meretas wajah gambarnya!
        const activeHandler = TemplateRegistry.resolve(this.config.themeId, "@section>content>image", this.defaultTemplate);
        activeHandler("@section>content>image", imgEl, payload, imgSelector);

        el.appendChild(imgEl);
      }

      // 2. Injeksi Judul (Header)
      if (payload.title) {
        const h2Selector = this.config.selectors["@section>content>header"];
        const h2 = document.createElement(h2Selector.tagName || "h2");
        h2.className = h2Selector.className || "title";

        const activeHandler = TemplateRegistry.resolve(this.config.themeId, "@section>content>header", this.defaultTemplate);
        activeHandler("@section>content>header", h2, payload, h2Selector);

        el.appendChild(h2);
      }

      // 3. Injeksi Deskripsi (Description Paragraph)
      if (payload.description) {
        const pSelector = this.config.selectors["@section>content>desc"];
        const pEl = document.createElement(pSelector.tagName || "p");
        pEl.className = pSelector.className || "desc";

        const activeHandler = TemplateRegistry.resolve(this.config.themeId, "@section>content>desc", this.defaultTemplate);
        activeHandler("@section>content>desc", pEl, payload, pSelector);

        el.appendChild(pEl);
      }

      // 4. Injeksi Tombol Aksi Massal (Actions Wrapper Multi-Instance)
      if (payload.actions && Array.isArray(payload.actions) && payload.actions.length > 0) {
        const actWrapperSelector = this.config.selectors["@section>content>actions"];
        const wrapperEl = document.createElement(actWrapperSelector.tagName || "div");
        wrapperEl.className = actWrapperSelector.className || "actions";

        // Ambil cetakan blueprint tombol anaknya
        const buttonTemplate = this.config.selectors["@section>content>actions>item"];

        // 🧙‍♂️ THE RECURSIVE SUB-LOOP FLOODING: Banjiri pembungkus tombol sebanyak data asli!
        payload.actions.forEach((actionData: iActionProperty) => {
          // Berikan fleksibilitas perubahan tag otomatis (Anchor vs Button) mengikuti isi data href
          const targetTagName = actionData.href ? "a" : (buttonTemplate.tagName || "button");
          const btnEl = document.createElement(targetTagName);

          btnEl.className = actionData.className || buttonTemplate.className || "button primary";

          if (actionData.id) btnEl.id = actionData.id;

          // Pancing pengisian detail internal link/button lewat Cascade Resolver!
          const activeHandler = TemplateRegistry.resolve(this.config.themeId, "@section>content>actions>item", this.defaultTemplate);
          activeHandler("@section>content>actions>item", btnEl, actionData, buttonTemplate);

          wrapperEl.appendChild(btnEl);
        });

        el.appendChild(wrapperEl);
      }
    }

    // 🧪 POS C: RUMAH IMPLEMENTASI DETIL ATOM GAMBAR
    else if (typeKey === "@section>content>image") {
      el.setAttribute("src", encodeURI(payload.image || ""));
      el.setAttribute("alt", payload.title || "section-graphic");
    }

    // 🧪 POS D: RUMAH IMPLEMENTASI DETIL ATOM JUDUL (KEBAL XSS MURNI VANILLA)
    else if (typeKey === "@section>content>header") {
      el.textContent = payload.title || "";
    }

    // 🧪 POS E: RUMAH IMPLEMENTASI DETIL ATOM PARAGRAF DESKRIPSI (KEBAL XSS MURNI VANILLA)
    else if (typeKey === "@section>content>desc") {
      el.textContent = payload.description || "";
    }

    // 🧪 POS F: RUMAH IMPLEMENTASI DETIL ATOM TOMBOL AKSI JANGKAUAN DALAM
    else if (typeKey === "@section>content>actions>item") {
      el.textContent = payload.label || "";

      if (payload.href) {
        (el as HTMLAnchorElement).href = payload.href;
        // Jika Anda ingin mengunci perosotan scroll passthrough satu pintu, panggil bindNavigation di sini:
        // (this as any).bindNavigation?.(el, payload.href);
      } else {
        (el as HTMLButtonElement).type = (payload.type as any) || "button";
        if (payload.onClick) el.addEventListener("click", payload.onClick);
      }
    }
  }

}
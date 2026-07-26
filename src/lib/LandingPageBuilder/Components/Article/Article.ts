import type { iBuilderConfig, iBuilderRegistry } from "../../interface";
import { Builder } from "../Base";
import "./Article.css";

export type ArticleModuleElementType =
  | "@container"
  // 🪐 LIST VIEW COMPONENT TOKENS
  | "@article>list"
  | "@article>card"
  | "@article>card>thumb"
  | "@article>card>title"
  | "@article>card>summary"
  | "@article>pagination"
  | "@article>pagination>btn"
  // 🪐 DETAIL VIEW COMPONENT TOKENS
  | "@article>detail"
  | "@article>detail>back-btn"
  | "@article>detail>cover"
  | "@article>detail>title"
  | "@article>detail>meta"
  | "@article>detail>body";

export interface iArticleConfig extends iBuilderConfig<ArticleModuleElementType> {
  navigate: (slug: any, themeId: string) => void;
}

export class ArticleBuilder extends Builder<ArticleModuleElementType, iArticleConfig> {
  readonly builderId: keyof iBuilderRegistry = "article";
  readonly name: keyof iBuilderRegistry = "article";
  stylesheet: string = "./Article.css";

  // State Management Internal Modul
  private currentRawServerResponse: any = null;

  constructor(config: Partial<iArticleConfig> = {}) {
    super();
    const defaultSelectors = {
      "@container": { tagName: "section", className: "article-module-container" },
      "@article>list": { tagName: "div", className: "article-grid row" },
      "@article>card": { tagName: "article", className: "article-card" },
      "@article>card>thumb": { tagName: "div", className: "card-thumbnail" },
      "@article>card>title": { tagName: "h3", className: "card-title" },
      "@article>card>summary": { tagName: "p", className: "card-summary" },
      "@article>pagination": { tagName: "nav", className: "pagination-wrapper" },
      "@article>pagination>btn": { tagName: "button", className: "pagination-btn" },
      "@article>detail": { tagName: "div", className: "article-detail-view" },
      "@article>detail>back-btn": { tagName: "button", className: "btn-back" },
      "@article>detail>cover": { tagName: "div", className: "full-cover-image" },
      "@article>detail>title": { tagName: "h1", className: "detail-title" },
      "@article>detail>meta": { tagName: "div", className: "detail-meta-info" },
      "@article>detail>body": { tagName: "div", className: "detail-body-content" }
    };
    const defaultConfig: Required<iArticleConfig> = {
      themeId: "default",
      selectors: defaultSelectors,
      emit: () => { },
      navigate: () => { },
    };

    this.config = this.resolveConfig(defaultConfig, config);
  }

  /**
   * 👑 THE MAIN ORCHESTRATOR COMPILER
   * Menerima payload JSON utuh berformat HATEOAS langsung dari Apps Script Anda!
   */
  public prepare(serverResponse: any): HTMLElement {
    this.currentRawServerResponse = serverResponse?.content || serverResponse || {};

    // Lahirkan bungkusan kontainer makro terluar
    const container = this.render("@container", this.currentRawServerResponse) as HTMLElement;

    // Semburkan barisan daftar grid artikel bawaan server Sheets Anda
    this._renderListViewComponent(container, this.currentRawServerResponse);

    return this.load("@container") as HTMLElement;
  }

  /**
   * 🧱 SUB-VIEW COMPONENT: Merakit Wajah Daftar Artikel (List View)
   */
  private _renderListViewComponent(container: HTMLElement, serverResponse: any): void {
    const grid = this.render("@article>list", serverResponse, true);
    const articles = Array.isArray(serverResponse.data) ? serverResponse.data : [];

    // A. Loop Linear Mencetak Baris Kartu Artikel Ringkas
    articles.forEach((article: any) => {
      // Tembakkan templateWrapped karena selector @article>card memiliki properti .wrapper kustom!
      const card = this.render("@article>card", article, true);
      const thumb = this.render("@article>card>thumb", article, true);
      const title = this.render("@article>card>title", article, true);
      const summary = this.render("@article>card>summary", article, true);

      if (thumb && article.thumbnail) card?.append(thumb);
      if (title) card?.append(title);
      if (summary) card?.append(summary);

      (card as any)._articleSlugToken = article.slug;
      (card as any)._articlePayloadData = article;

      if (grid) grid.appendChild(card?.__outer! || card);
    });

    if (grid) container.appendChild(grid);

    this._renderPaginationHATEOAS(container, serverResponse)
  }


  /**
 * 🧱 SUB-VIEW COMPONENT: Merakit Wajah Bacaan Penuh (Detail View)
 */
  private _renderDetailViewComponent(container: HTMLElement, articleData: any): void {

    this.remove(
      "@article>detail",
      "@article>detail>back-btn",
      "@article>detail>cover",
      "@article>detail>meta",
      "@article>detail>title",
      "@article>detail>body"
    )

    const detailBox = this.render("@article>detail", articleData);
    const backBtn = this.render("@article>detail>back-btn", articleData);
    const cover = this.render("@article>detail>cover", articleData);
    const title = this.render("@article>detail>title", articleData);
    const metaInfo = this.render("@article>detail>meta", articleData);
    const bodyContent = this.render("@article>detail>body", articleData);

    // ====================================================
    // ⚡ DETONATOR CLICK TOMBOL KEMBALI (SINKRONISASI ROUTER GLOBAL)
    // ====================================================
    if (backBtn) {
      backBtn.onclick = (e) => {
        e.stopPropagation();
        console.log(`✈️ [Router Pipeline]: Returning back to primary blog feed grid...`);

        // Kembalikan ke pangkalan rute utama blog secara legal!
        this._renderListViewComponent(container, this.currentRawServerResponse);

        // 2. Perbarui alamat URL bar secara pasif lewat jembatan router global Anda
        if (this.config.navigate && typeof this.config.navigate === "function") {
          this.config.navigate("", this.activeLiveThemeId);
        }
        container.replaceChildren(this.load("@article>list") as HTMLElement)
      };
      detailBox?.appendChild(backBtn);
    }

    if (cover && articleData.largeCover) detailBox?.appendChild(cover);
    if (title) detailBox?.appendChild(title);
    if (metaInfo) detailBox?.appendChild(metaInfo);
    if (bodyContent) detailBox?.appendChild(bodyContent);

    if (detailBox) container.appendChild(detailBox);
  }

  private _renderPaginationHATEOAS(container: HTMLElement, serverResponse: any) {
    // ====================================================
    // 🔮 THE AUTOMATED HATEOAS PAGINATION INJECTION
    // Membaca saku meta.links secara berdaulat dari response Apps Script Anda!
    // ====================================================
    const meta = serverResponse.meta;
    if (meta && meta.links) {
      this.remove("@article>pagination", "@article>pagination>btn");

      const paginationNav = this.load("@article>pagination") as HTMLElement || this.render("@article>pagination", meta);

      // Loop linear menyisir seluruh kunci navigasi HATEOAS (self, first, prev, next, last)
      Object.entries(meta.links).forEach(([btnRole, targetHref]) => {
        let navBtn: HTMLElement | null = null;

        if (!targetHref) return; // Skip jika link bernilai null (misal: tombol 'prev' di halaman 1)

        navBtn = this.render("@article>pagination>btn", { role: btnRole, href: targetHref, active: btnRole === "self" }, true) as HTMLElement

        // Ikat alamat URL endpoint server Apps Script langsung ke properti rahasia tombol fisik!
        if (navBtn) {
          (navBtn as any)._hateoasServerUrl = targetHref;
          paginationNav?.appendChild(navBtn);
        }
      });

      if (paginationNav) container.appendChild(paginationNav);
    }
  }



  /**
   * 👑 THE SEPARATED HYDRATION VALVE (POS DATA ATOMIK)
   */
  protected template(typeKey: ArticleModuleElementType, el: HTMLElement, payload?: any): void {
    if (!payload) return;

    switch (typeKey) {
      case "@article>card>thumb":
        const img = document.createElement("img");
        img.className = "thumbnail";
        img.src = encodeURI(payload.thumbnail || "");
        el.appendChild(img)
        break;

      case "@article>card>title":
        el.textContent = payload.title || "";
        break;

      case "@article>card>summary":
        el.textContent = payload.summary || "";
        break;

      case "@article>pagination>btn":
        el.textContent = payload.role.toUpperCase();
        if (payload.active) el.classList.add("active-page");
        break;

      case "@article>detail>back-btn":
        el.textContent = "← Kembali ke Daftar";
        break;

      case "@article>detail>cover":
        const imgCover = document.createElement("img");
        imgCover.src = encodeURI(payload.largeCover || payload.thumbnail || "");
        imgCover.className = "cover";
        el.appendChild(imgCover);
        break;

      // ====================================================
      // 🛡️ SINKRONISASI BERSURAT (PENYEMPURNAAN KODE TERPOTONG ANDA!)
      // Pasang penyiraman data mutakhir untuk area bacaan penuh detail box
      // ====================================================
      case "@article>detail>title":
        el.textContent = payload.title || "Untitled Article";
        break;

      case "@article>detail>meta":
        // Gabungkan nama penulis dan tanggal terbit secara elegan dalam satu baris meta info
        el.innerHTML = `
          <span class="meta-author">Oleh: <strong>${payload.author || "Admin"}</strong></span>
          <span class="meta-divider">•</span>
          <span class="meta-date">${payload.date || "Baru saja"}</span>
        `.trim();
        break;

      case "@article>detail>body":
        // Semburkan bodi konten HTML kaya (rich text editor hasil Sheets) secara legal!
        el.innerHTML = payload.body || "";
        break;
    }
  }


  /**
   * 👑 THE ENCAPSULATED INTERACTIVE BINDINGS (VIRTUAL ROUTING DISPATCHER)
   */
  public initialize(): void {
    const container = this.load("@container") as HTMLElement;
    const grid = this.load("@article>list") as HTMLElement;
    const pagination = this.load("@article>pagination") as HTMLElement;

    if (!container) return;

    if (grid) {
      grid.addEventListener("click", (e) => {
        const targetCard = (e.target as HTMLElement).closest(".article-card") as HTMLElement;
        if (!targetCard) return;

        const slug = (targetCard as any)._articleSlugToken;
        const articleData = (targetCard as any)._articlePayloadData;

        console.log({ slug, articleData })

        this._renderDetailViewComponent(container, articleData);

        if (!slug || !articleData) return;

        const currentHash = window.location.hash; // Ambil hash active (e.g. #blog)

        // Bentuk format penamaan URL kustom yang serasi (e.g. #blog/tren-fashion-2026)
        const targetCleanHash = currentHash.includes('/')
          ? `${currentHash.split('/')[0]}/${slug}`
          : `${currentHash.split('?')[0]}/${slug}`;

        // Suntikkan ke history peramban browser secara pasif, sunyi, tanpa drama!
        window.history.pushState({ slug: slug }, "", targetCleanHash + `?theme=${this.activeLiveThemeId}`);

        console.log(`🔥 [Event Activation]: Launching detail viewport for slug: "${slug}"`);

        // Kalau ini diaktifkan detail tidak terender, namun pathbrowser saja yang berubah!
        // tapi kalau dimatikan berjalan.
        // kalau dari guard routernya sih bilang => [Router Live] Route "home/blog/tren-fashion-apparel-2026" is unrecognized. Delegating central redirect.
        // gimana cara mengatasinya? sudah buat param ke 4 di navigate untuk melewati redirect, tetap saja detail tidak terender
        // if (this.config.navigate && typeof this.config.navigate === "function") {
        //   this.config.navigate(`${slug}`);
        // }

        const detailBoxDOM = this.load("@article>detail") as HTMLElement;
        if (detailBoxDOM) {
          container.replaceChildren(detailBoxDOM);
        }
      });
    }

    // C. Pemicu Klik Navigasi Tombol HATEOAS Pagination Server Anda yang sudah aman
    if (pagination) {
      pagination.addEventListener("click", (e) => {
        const targetBtn = (e.target as HTMLElement).closest(".pagination-btn") as HTMLElement;
        if (!targetBtn || !targetBtn.dataset.url) return;

        if (this.config.emit && typeof this.config.emit === "function") {
          this.config.emit("elementChanged", {
            builder: this.builderId,
            type: "@article>pagination",
            element: targetBtn,
            data: { endpoint: targetBtn.dataset.url, module: this }
          });
        }
      });
    }
  }
}
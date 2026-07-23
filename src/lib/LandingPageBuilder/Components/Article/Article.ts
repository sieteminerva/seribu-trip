// Modules/ArticleModule.ts (The Pure HATEOAS-Driven Component Module Specification)
import type { iBuilderRegistry } from "../../interface";
import { Builder } from "../Base";

export type ArticleModuleElementType =
  | "@container"
  // 🪐 LIST VIEW COMPONENT TOKENS
  | "@article>list-grid"
  | "@article>card"
  | "@article>card>thumb"
  | "@article>card>title"
  | "@article>card>summary"
  | "@article>pagination"
  | "@article>pagination>btn"
  // 🪐 DETAIL VIEW COMPONENT TOKENS
  | "@article>detail-box"
  | "@article>detail>back-btn"
  | "@article>detail>cover"
  | "@article>detail>title"
  | "@article>detail>meta"
  | "@article>detail>body";

export class ArticleModule extends Builder<ArticleModuleElementType> {
  readonly builderId = "article";
  readonly name: keyof iBuilderRegistry = "article";
  stylesheet: string = "./Article.css";
  public config: any;

  // State Management Internal Modul
  private currentRawServerResponse: any = null;

  constructor(config = {}) {
    super();
    const defaultSelectors = {
      "@container": { tagName: "section", className: "article-module-container" },
      "@article>list-grid": { tagName: "div", className: "article-grid row" },
      "@article>card": { tagName: "article", className: "article-card", wrapper: "div.col-md-6.col-sm-12" },
      "@article>card>thumb": { tagName: "div", className: "card-thumbnail" },
      "@article>card>title": { tagName: "h3", className: "card-title" },
      "@article>card>summary": { tagName: "p", className: "card-summary" },
      "@article>pagination": { tagName: "nav", className: "pagination-wrapper" },
      "@article>pagination>btn": { tagName: "button", className: "pagination-btn" },
      "@article>detail-box": { tagName: "div", className: "article-detail-view" },
      "@article>detail>back-btn": { tagName: "button", className: "btn-back" },
      "@article>detail>cover": { tagName: "div", className: "full-cover-image" },
      "@article>detail>title": { tagName: "h1", className: "detail-title" },
      "@article>detail>meta": { tagName: "div", className: "detail-meta-info" },
      "@article>detail>body": { tagName: "div", className: "detail-body-content" }
    };
    this.config = { selectors: defaultSelectors, ...config };
  }

  /**
   * 👑 THE MAIN ORCHESTRATOR COMPILER
   * Menerima payload JSON utuh berformat HATEOAS langsung dari Apps Script Anda!
   */
  public prepare(serverResponse: any): HTMLElement {
    // Amankan data response server ke saku state internal modul
    this.currentRawServerResponse = serverResponse;

    const container = this.render("@container", serverResponse);

    // ====================================================
    // 🧙‍♂️ VIRTUAL PUSHSTATE ROUTER INTERCEPTION
    // Cek apakah URL di top bar sedang meminta mode baca penuh atau mode daftar biasa
    // ====================================================
    const currentPath = window.location.pathname;
    const slugMatch = currentPath.match(/\/blog\/([a-zA-Z0-9_-]+)/);

    if (slugMatch) {
      // MODE BACA PENUH: Ambil slug target, cari datanya di records pool
      const targetSlug = slugMatch[1];
      const articlesPool = Array.isArray(serverResponse.data) ? serverResponse.data : [];
      const activeArticle = articlesPool.find((a: any) => a.slug === targetSlug);

      this._renderDetailViewComponent(container!, activeArticle);
    } else {
      // MODE DAFTAR: Semburkan list view beserta baris navigasi HATEOAS-nya!
      this._renderListViewComponent(container!, serverResponse);
    }

    return this.load("@container") as HTMLElement;
  }

  /**
   * 🧱 SUB-VIEW COMPONENT: Merakit Wajah Daftar Artikel (List View)
   */
  private _renderListViewComponent(container: HTMLElement, serverResponse: any): void {
    const grid = this.render("@article>list-grid", serverResponse);
    const articles = Array.isArray(serverResponse.data) ? serverResponse.data : [];

    // A. Loop Linear Mencetak Baris Kartu Artikel Ringkas
    articles.forEach((article: any) => {
      // Tembakkan templateWrapped karena selector @article>card memiliki properti .wrapper kustom!
      const card = this.render("@article>card", article);
      const thumb = this.render("@article>card>thumb", article);
      const title = this.render("@article>card>title", article);
      const summary = this.render("@article>card>summary", article);

      if (thumb && article.thumbnail) card?.append(thumb);
      if (title) card?.append(title);
      if (summary) card?.append(summary);

      // Simpan referensi data slug asli ke tubuh elemen fisik untuk pemicu navigasi RAM nanti
      (card as any)._articleSlugToken = article.slug;
      (card as any)._articlePayloadData = article;

      if (grid) grid.appendChild(card?.outer! || card);
    });

    if (grid) container.appendChild(grid);

    // ====================================================
    // 🔮 THE AUTOMATED HATEOAS PAGINATION INJECTION
    // Membaca saku meta.links secara berdaulat dari response Apps Script Anda!
    // ====================================================
    const meta = serverResponse.meta;
    if (meta && meta.links) {
      const paginationNav = this.render("@article>pagination", meta);

      // Loop linear menyisir seluruh kunci navigasi HATEOAS (self, first, prev, next, last)
      Object.entries(meta.links).forEach(([btnRole, targetHref]) => {
        if (!targetHref) return; // Skip jika link bernilai null (misal: tombol 'prev' di halaman 1)

        const navBtn = this.render("@article>pagination>btn", { role: btnRole, href: targetHref, active: btnRole === "self" });

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
   * 🧱 SUB-VIEW COMPONENT: Merakit Wajah Bacaan Penuh (Detail View)
   */
  private _renderDetailViewComponent(container: HTMLElement, articleData: any): void {
    if (!articleData) {
      container.innerHTML = `<div class="error-msg">Artikel tidak ditemukan atau telah dihapus.</div>`;
      return;
    }

    const detailBox = this.render("@article>detail-box", articleData);
    const backBtn = this.render("@article>detail>back-btn", articleData);
    const cover = this.render("@article>detail>cover", articleData);
    const title = this.render("@article>detail>title", articleData);
    const metaInfo = this.render("@article>detail>meta", articleData);
    const bodyContent = this.render("@article>detail>body", articleData);

    if (backBtn) detailBox?.appendChild(backBtn);
    if (cover && articleData.largeCover) detailBox?.appendChild(cover);
    if (title) detailBox?.appendChild(title);
    if (metaInfo) detailBox?.appendChild(metaInfo);
    if (bodyContent) detailBox?.appendChild(bodyContent);

    if (detailBox) container.appendChild(detailBox);
  }

  /**
   * 👑 THE SEPARATED HYDRATION VALVE (POS DATA ATOMIK)
   */
  protected template(typeKey: ArticleModuleElementType, el: HTMLElement, payload?: any): void {
    if (!payload) return;

    switch (typeKey) {
      case "@article>card>thumb":
        el.style.backgroundImage = `url('${encodeURI(payload.thumbnail || "")}')`;
        break;

      case "@article>card>title":
        el.textContent = payload.title || "";
        break;

      case "@article>card>summary":
        el.textContent = payload.summary || "";
        break;

      case "@article>pagination>btn":
        // Berikan penamaan label tombol yang estetik berdasarkan peran link HATEOAS
        el.textContent = payload.role.toUpperCase();
        if (payload.active) el.classList.add("active-page");
        break;

      case "@article>detail>back-btn":
        el.textContent = "← Kembali ke Daftar";
        break;

      case "@article>detail>cover":
        // 🟢 TWO-IMAGE LAZY LOAD EFFECT: Download foto raksasa murni HANYA saat detail view meletup lahir!
        el.style.backgroundImage = `url('${encodeURI(payload.largeCover || payload.thumbnail || "")}')`;
        break;

      case "@article>detail>title":
        el.textContent = payload.title || "";
        break;

      case "@article>detail>meta":
        el.textContent = `Ditulis oleh ${payload.author || "Admin"} • Dipublikasikan pada ${payload.date || "Baru saja"}`;
        break;

      case "@article>detail>body":
        // 🔒 SAFE CONTENT HYDRATION: Menyuapi isi tulisan penuh artikel bodi
        el.innerHTML = payload.contentHTML || payload.summary || "";
        break;
    }
  }

  /**
   * 👑 THE ENCAPSULATED INTERACTIVE BINDINGS (VIRTUAL ROUTING DISPATCHER)
   */
  public initialize(): void {
    const container = this.load("@container") as HTMLElement;
    const grid = this.load("@article>list-grid") as HTMLElement;
    const pagination = this.load("@article>pagination") as HTMLElement;

    // A. Jembatan Navigasi Masuk dari List Card ke Detail View RAM
    if (grid && container) {
      grid.addEventListener("click", (e) => {
        const targetCard = (e.target as HTMLElement).closest(".article-card");
        if (!targetCard) return;

        const slug = (targetCard as any)._articleSlugToken;
        const articleData = (targetCard as any)._articlePayloadData;
        if (!slug || !articleData) return;

        // 🚀 Push URL ke top bar browser tanpa page refresh!
        window.history.pushState({ slug }, articleData.title, `/blog/${slug}`);

        container.innerHTML = "";
        this._renderDetailViewComponent(container, articleData);
      });
    }

    // B. Jembatan Pemicu Klik Navigasi Tombol HATEOAS Pagination Server
    if (pagination && container) {
      pagination.addEventListener("click", async (e) => {
        const targetBtn = (e.target as HTMLElement).closest(".pagination-btn");
        if (!targetBtn) return;

        const serverApiUrl = (targetBtn as any)._hateoasServerUrl; if (!serverApiUrl) return;
        console.log(`[HATEOAS Route Call] Dispatching JIT server request to: ${serverApiUrl}`);
        // 🚀 TRIGGER GLOBAL PIPELINE OUTSIDE INTERCEPTOR!
        // Semburkan event luar agar orkestrator atas (Vite/Main App) mengeksekusi fetch live data,
        // lalu memicu kembali metode .prepare() dengan data segar hantaran server Apps Script Anda!
        this.config.emit?.("article:page-changed", { endpoint: serverApiUrl, module: this });
      });
    }
    // C. Jembatan Sinkronisasi Tombol Back Button Asli Browser (Browser PopState Synchronizer)
    if (container) {
      window.onpopstate = (event: PopStateEvent) => {
        container.innerHTML = "";
        if (event.state && event.state.slug) {
          const articlesPool = Array.isArray(this.currentRawServerResponse?.data) ? this.currentRawServerResponse.data : [];
          const targetArticle = articlesPool.find((a: any) => a.slug === event.state.slug);
          this._renderDetailViewComponent(container, targetArticle);
        } else {
          this._renderListViewComponent(container, this.currentRawServerResponse);
        }
      };
    }
  }
}
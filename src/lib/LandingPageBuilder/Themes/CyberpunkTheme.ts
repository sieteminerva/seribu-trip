
import { TemplateRegistry } from "../Modules/TemplateRegistry";
import type { iThemeModule, iBasicNode } from "../interface";
import "./CyberpunkTheme.css";

export class CyberpunkTheme implements iThemeModule {
  readonly themeId = "cyberpunk";
  readonly name = "⚡ Neon Cyberpunk Grid";

  /**
   * 🧙‍♂️ THE SOVEREIGN OBJECT FUNCTION MAP (PILIHAN CERDAS ANDA!)
   * Tempat bernaungnya seluruh fungsi rahim HTML kustom khusus tema Cyberpunk.
   * Objek ini murni deklaratif, sangat bersih, dan bisa di-export/import dari luar jika dibutuhkan!
   */
  public templates(): Record<string, (typeKey: any, el: HTMLElement, payload: any, selector: any) => void> {
    return {
      "@menu": (_typeKey, el: HTMLElement, _payload: any, _selector: any) => {
        el.classList.add("cyber-glitch-border", "neon-glow-container");
      },
      "@menu>brand": (_typeKey, el, payload, _selector) => {
        const link = document.createElement("a");
        link.href = payload.href || "#home";
        link.innerHTML = `<span class="glitch-text" data-text="${payload.label}">${payload.label}</span>`;
        el.appendChild(link);
      },
      "@menu>hamburger": (_typeKey, el: HTMLElement, _payload: any, _selector: any) => {
        el.innerHTML = `<div class="cyber-burger-icon"><span class="neon-line"></span><span class="neon-line"></span></div>`;
      },
      "@menu>navigations>item": (_typeKey, el: HTMLElement, payload: any, _selector: any) => {
        const a = document.createElement("a");
        a.href = payload.href || "#";
        a.className = "cyber-matrix-link";
        a.innerHTML = `<span class="link-bracket">[</span><span class="link-char">${payload.label}</span><span class="link-bracket">]</span>`;
        el.appendChild(a);
      },
      "@menu>actions": (_typeKey, el, payload, _selector) => {
        if (payload) {
          const btn = document.createElement("button");
          btn.className = "ui cyberpunk-btn small neon-pink";
          btn.innerHTML = `<span class="btn-cut-corner">${payload.label}</span>`;
          el.appendChild(btn);
        }
      }
    };
  }

  /**
   * KATEGORI 2: STRUCTURAL OVERRIDE (Pre-Render Hub)
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null, meta?: any) {
    if (meta) console.log("Cyberpunk Theme meta", meta);

    // ====================================================
    // 🧙‍♂️ THE AUTOMATED REGISTRY REGISTRATION LOOP (PUNCAK OTOMASI)
    // Ambil objek templates di atas, lalu sisir menggunakan loop linear untuk 
    // mendaftarkannya ke TemplateRegistry pusat secara instan dalam 3 baris pipa!
    // ====================================================
    const themeTemplates = this.templates();
    Object.entries(themeTemplates).forEach(([selectorKey, handler]) => {
      TemplateRegistry.register(`${this.themeId}${selectorKey}`, handler);
    });

    // Siram nama kelas kosmetik ke seluruh blok halaman utama
    pages.forEach((block: any) => {
      block.className = `${block.className || ""} theme-cyberpunk`.trim();
    });

    if (menu) (menu as any).className = `${(menu as any).className || ""} theme-cyberpunk`.trim();
    if (footer) (footer as any).className = `${(footer as any).className || ""} theme-cyberpunk`.trim();

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    if (elements) console.log("Cyberpunk Themes element ready", elements);
    shell.className = "page theme-cyberpunk";
    console.log("[CyberpunkTheme] System secure. Neon structural overrides painted successfully.");
  }

  /**
   * KATEGORI 5: LIFECYCLE CLEANUP (Unmount)
   */
  public deactivate(shell: HTMLElement): void {
    shell.className = "page";
    console.log("[CyberpunkTheme] Initiating memory cleanup. Unregistering theme overrides...");

    // 🔒 AMAN TOTAL LINTAS ROUTE: Otomatis memecat sisa token berdasarkan keys objek kita sendiri!
    const themeTemplates = this.templates();
    Object.keys(themeTemplates).forEach((selectorKey) => {
      TemplateRegistry.unregister?.(`${this.themeId}${selectorKey}`);
    });

    console.log("[CyberpunkTheme] Deactivated safely. System returned to default vertical bounds.");
  }
}

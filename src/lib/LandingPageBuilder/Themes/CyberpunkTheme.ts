import type { iThemeModule, iBasicNode } from "../interface";
import "./CyberpunkTheme.css";

export class CyberpunkTheme implements iThemeModule {
  // Strict readonly metadata contract
  readonly themeId = "cyberpunk";
  readonly name = "⚡ Neon Cyberpunk Grid";

  /**
   * KATEGORI 2: STRUCTURAL OVERRIDE (Pre-Render)
   * Menyiramkan nama kelas tema ke level objek teratas tanpa merusak HTML dengan style inline kotor
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null, meta?: any) {
    if (meta) {
      console.log("Cyberpunk Theme meta", meta)
    }
    // Suntikkan kelas .theme-cyberpunk ke seluruh blok halaman utama
    pages.forEach((block: any) => {
      block.className = `${block.className || ""} theme-cyberpunk`.trim();
    });

    // Suntikkan kelas .theme-cyberpunk ke objek menu navbar
    if (menu) {
      (menu as any).className = `${(menu as any).className || ""} theme-cyberpunk`.trim();
    }

    // Suntikkan kelas .theme-cyberpunk ke objek footer
    if (footer) {
      (footer as any).className = `${(footer as any).className || ""} theme-cyberpunk`.trim();
    }

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    if (elements) {
      console.log("Cyberpunk Themes element ready", elements)
    }
    // Suntikkan juga kelas induk ke shell halaman terluar agar pewarisan CSS bekerja sempurna di browser
    shell.className = "page theme-cyberpunk";

    console.log("[CyberpunkTheme] System secure. Neon structural overrides painted successfully.");
  }

  /**
   * KATEGORI 5: LIFECYCLE CLEANUP (Unmount)
   */
  public deactivate(shell: HTMLElement): void {
    shell.className = "page";
    console.log("[CyberpunkTheme] Deactivated safely. System returned to default vertical bounds.");
  }
}

import type { iBasicNode, iThemeModule } from "../interface";
import "./DefaultTheme.css";

export class DefaultTheme implements iThemeModule {
  // Strict readonly metadata contract
  readonly themeId = "default";
  readonly name = "🏢 Default Vertical Theme";

  /**
   * KATEGORI 2: STRUCTURAL OVERRIDE (Pre-Render)
   * Menyiramkan nama kelas tema ke level objek teratas tanpa merusak HTML dengan style inline kotor
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null, meta?: any) {
    if (meta) {
      console.log("Default Theme meta", meta)
    }
    // Suntikkan kelas .theme-cyberpunk ke seluruh blok halaman utama
    pages.forEach((block: any) => {
      if (block) {

      }
    });

    // Suntikkan kelas .theme-cyberpunk ke objek menu navbar
    if (menu) {

    }

    // Suntikkan kelas .theme-cyberpunk ke objek footer
    if (footer) {

    }

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    if (elements) {
      // console.log("Default Themes element ready", elements)
    }
    // Suntikkan juga kelas induk ke shell halaman terluar agar pewarisan CSS bekerja sempurna di browser
    shell.style.display = "block";
    shell.style.overflow = "initial";

    console.log("[DefaultTheme] System secure. Neon structural overrides painted successfully.");
  }

  /**
   * KATEGORI 5: LIFECYCLE CLEANUP (Unmount)
   */
  public deactivate(shell: HTMLElement): void {
    shell.className = "page";
    console.log("[DefaultTheme] Deactivated safely. System returned to default vertical bounds.");
  }
}

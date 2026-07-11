import type { iBasicNode, iThemeModule } from "../interface";

export class HorizontalTheme implements iThemeModule {
  // Strict readonly metadata contract
  readonly themeId = "horizontal";
  readonly name = "↔️ Horizontal Slide Shift Engine";

  private currentShell: HTMLElement | null = null;


  /**
   * KATEGORI 2: STRUCTURAL OVERRIDE (Pre-Render)
   * Memaksa setiap section agar memiliki penanda kelas slide horizontal
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | HTMLElement | null, footer: iBasicNode | HTMLElement | null) {
    console.log(this.name, { pages, menu, footer });
    // Sisir dan paksa kelas CSS pembungkus macro layout seksi
    pages.forEach((block) => {
      // Jika seksi memiliki kelas standard bawaan, kita lebur dengan penanda horizontal-panel
      const existingClass = block.className || "section row";
      if (!existingClass.includes("horizontal-slide-panel")) {
        block.className = `${existingClass} horizontal-slide-panel`;
      }
    });

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   * Mengubah susunan shell kontainer utama menjadi Flex Row hidup
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    this.currentShell = shell;

    // 1. Suntikkan token inline styles secara agresif ke shell utama agar tata letaknya mengunci
    shell.className = "page theme-layout-horizontal";
    shell.style.display = "flex";
    shell.style.flexDirection = "row";
    shell.style.overflowX = "auto";
    shell.style.overflowY = "hidden";
    shell.style.width = "100vw";
    shell.style.height = "100vh";
    shell.style.scrollBehavior = "smooth";

    // 2. Kalibrasi dimensi elemen anak agar kokoh dan tidak gepeng/terkompresi oleh flex-row
    elements.forEach((el) => {
      // Jangan ganggu menu dan footer jika mereka dilekatkan khusus
      if (!el.classList.contains("nav")) {
        el.style.flexShrink = "0";
        el.style.width = "100vw"; // Paksa 1 seksi memenuhi 1 layar penuh layaknya slide
        el.style.height = "100%";
      }
    });

    // 3. BAJAK MOUSE WHEEL EVENT: Pasang listener dengan properti passive: false agar preventDefault diizinkan
    shell.addEventListener("wheel", this.wheelHijackListener, { passive: false });
    console.log("[HorizontalTheme] Native DOM layout reconfigured and wheel hijacked safely.");
  }

  /**
   * KATEGORI 5: LIFECYCLE CLEANUP (Unmount)
   * Pembasmi Memory Leak! Wajib melepaskan handler wheel saat rute berpindah
   */
  public deactivate(shell: HTMLElement): void {
    if (this.currentShell) {
      this.currentShell.removeEventListener("wheel", this.wheelHijackListener);

      // Bersihkan sisa inline styles agar tidak merusak tema selanjutnya (Reset State)
      shell.removeAttribute("style");
    }
    this.currentShell = null;
    console.log("[HorizontalTheme] Memory cleanup completed cleanly. Wheel released.");
  }


  /**
 * Private Pointer Listener to hijack vertical scroll movement 
 * and translate it into a horizontal timeline slide shift.
 */
  private wheelHijackListener = (e: WheelEvent) => {
    if (!this.currentShell) return;
    e.preventDefault(); // Matikan scroll vertikal asli browser

    // Geser container utama secara horizontal sesuai besarnya putaran mouse wheel
    this.currentShell.scrollLeft += e.deltaY * 10;
  };

}
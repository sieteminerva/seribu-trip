import type { iBasicNode, iPageMetaReport, iThemeModule } from "../interface";
import "./HorizontalTheme.css";


export class HorizontalTheme implements iThemeModule {
  readonly themeId = "horizontal";
  readonly name = "↔️ Horizontal Slide Shift Engine";

  private currentShell: HTMLElement | null = null;
  private menuRef: HTMLElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;
  private timelineLabelElement: HTMLElement | null = null;
  private panelElementsCache: HTMLElement[] = [];

  /**
   * Pembajak Roda Mouse Berbasis Koordinat Zona Bawah 150px
   */
  private wheelHijackListener = (e: WheelEvent) => {
    if (!this.currentShell) return;
    e.preventDefault();

    const cursorY = e.clientY;
    const totalScreenHeight = window.innerHeight;
    const bottomZoneThreshold = totalScreenHeight - 150;

    const activePanel = e.target as HTMLElement;
    const closestPanel = activePanel.closest(".horizontal") as HTMLElement | null;

    // A: Zona Bawah -> Scroll Horizontal Cepat (Multiplier 15)
    if (cursorY >= bottomZoneThreshold) {
      this.currentShell.scrollLeft += e.deltaY * 15;
      return;
    }

    // B: Zona Atas -> Scroll Konten Internal Panel Vertikal (Anti-Konflik)
    if (closestPanel) {
      const scrollHeight = closestPanel.scrollHeight;
      const clientHeight = closestPanel.clientHeight;
      if (scrollHeight > clientHeight) {
        closestPanel.scrollTop += e.deltaY;
        return;
      }
    }

    // Fallback darurat jika section atas pendek
    this.currentShell.scrollLeft += e.deltaY * 1.2;
  };

  /**
   * Listener Gerakan Mouse: Menangani Auto-Hide Scrollbar & Pop-Up Widget Timeline Label
   */
  private mouseMoveListener = (e: MouseEvent) => {
    if (!this.currentShell || !this.timelineLabelElement) return;

    const cursorY = e.clientY;
    const totalScreenHeight = window.innerHeight;
    const bottomZoneThreshold = totalScreenHeight - 150;

    if (cursorY >= bottomZoneThreshold) {
      this.currentShell.classList.add("show-scrollbar");
      this.timelineLabelElement.classList.add("visible");
    } else {
      this.currentShell.classList.remove("show-scrollbar");
      this.timelineLabelElement.classList.remove("visible");
    }
  };

  /**
   * Listener Pergeseran Halaman (OnScroll): Melacak posisi seksi terdekat 
   * untuk mendeteksi nama timeline seksi secara real-time
   */
  private pageScrollListener = () => {
    if (!this.timelineLabelElement || this.panelElementsCache.length === 0) return;

    let currentActiveName = "EXPLORE";
    const viewportCenterX = window.innerWidth / 2;

    for (const panel of this.panelElementsCache) {
      const rect = panel.getBoundingClientRect();
      // Deteksi seksi mana yang memotong area tengah layar browser saat ini
      if (rect.left <= viewportCenterX && rect.right >= viewportCenterX) {
        currentActiveName = panel.getAttribute("data-name") || panel.id || "SECTION";
        break;
      }
    }

    if (this.timelineLabelElement.textContent !== currentActiveName) {
      this.timelineLabelElement.textContent = currentActiveName;
    }
  };

  /**
   * KATEGORI 2: STRUCTURAL OVERRIDE (Pre-Render)
   * Tanam properti .name atau .id visual sebagai data-attributes HTML permanen
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null, meta?: iPageMetaReport) {
    console.log({ meta });
    pages.forEach((block: any, index: number) => {
      const existingClass = block.className || "section row";
      let panelTypeClass = "panel-standard";

      if (block.id === "hero-section" || index === 0 || block.name === "Hero") {
        panelTypeClass = "panel-hero";

        if (meta?.hasComponent.carousel) {
          const carouselAttrs = {
            "data-vertical": true,
            "data-animation": "slide-up",    // Pemicu gerak Vertical Slide Up!
            "data-slides-per-view": 3,       // Menampilkan 2 gambar berjejer vertikal sekaligus!
            "data-autoplay": 3500,           // Kecepatan autoplay otomatis 3.5 detik
            "data-loop": true
          };
          if (Array.isArray(block.content)) {
            block.content.forEach((node: iBasicNode) => {
              if (node.builder && node.builder === "carousel") {
                node.attrs = carouselAttrs;
                node.isRoot = true;
              }
            })
          }
        }
        console.log("Horizontal Theme", { block })
      }
      if (block.builder === "form" || (block.content && typeof block.content === "object" && !Array.isArray(block.content))) {
        panelTypeClass = "panel-grouped";
      }

      // Gunakan penanda kelas minimalis baru pilihan Anda: .horizontal
      block.className = `${existingClass} horizontal ${panelTypeClass}`.trim();

      const sectionFriendlyName = block.name || block.id || `Seksi ${index + 1}`;
      block.attrs = {
        ...(block.attrs || {}),
        "data-name": sectionFriendlyName
      };
    });

    if (menu && typeof menu === "object") {
      menu.className = "left";
    }

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    this.currentShell = shell;
    shell.className = "theme-horizontal";

    // 💡 FIX 2: Kalibrasi saringan cache agar murni mencari kelas baru .horizontal pilihan Anda!
    this.panelElementsCache = elements.filter(el => el.classList.contains("horizontal"));

    // 💡 FIX 1: Cari widget di level document luar agar terisolasi aman dari sapuan innerHTML milik shell!
    this.timelineLabelElement = document.querySelector(".timeline.label");
    if (!this.timelineLabelElement) {
      this.timelineLabelElement = document.createElement("div");
      this.timelineLabelElement.className = "timeline label";
      this.timelineLabelElement.textContent = "EXPLORE";

      // Tempelkan ke document.body luar agar aman sentosa tidak ikut terhapus saat render rute baru
      shell.appendChild(this.timelineLabelElement);
    }

    this.menuRef = shell.querySelector(".nav") || document.querySelector(".nav");
    if (this.menuRef) {
      this.toggleButton = document.createElement("button");
      this.toggleButton.className = "sidebar trigger";
      this.menuRef.insertBefore(this.toggleButton, this.menuRef.firstElementChild);

      this.toggleButton.addEventListener("click", () => {
        this.menuRef?.classList.toggle("expanded");
      });
    }

    shell.addEventListener("wheel", this.wheelHijackListener, { passive: false });
    shell.addEventListener("mousemove", this.mouseMoveListener);
    shell.addEventListener("scroll", this.pageScrollListener);

    this.pageScrollListener();
  }

  /**
   * KATEGORI 5: LIFECYCLE CLEANUP (Unmount)
   */
  public deactivate(shell: HTMLElement): void {
    if (this.currentShell) {
      this.currentShell.removeEventListener("wheel", this.wheelHijackListener);
      this.currentShell.removeEventListener("mousemove", this.mouseMoveListener);
      this.currentShell.removeEventListener("scroll", this.pageScrollListener);
    }

    // Hancurkan dari document.body luar secara bersih dan ksatria
    if (this.timelineLabelElement && this.timelineLabelElement.parentNode) {
      this.timelineLabelElement.parentNode.removeChild(this.timelineLabelElement);
    }

    if (this.toggleButton && this.toggleButton.parentNode) {
      this.toggleButton.parentNode.removeChild(this.toggleButton);
    }

    if (this.menuRef) {
      this.menuRef.classList.remove("expanded");
    }

    shell.className = "page";
    shell.removeAttribute("style");

    this.currentShell = null;
    this.menuRef = null;
    this.toggleButton = null;
    this.timelineLabelElement = null;
    this.panelElementsCache = [];
    console.log("[HorizontalTheme] Clean unmount executed. Framework is ready for the next transformation.");
  }
}



export class HorizontalTheme2 implements iThemeModule {
  readonly themeId = "horizontal";
  readonly name = "↔️ Horizontal Slide Shift Engine";

  private currentShell: HTMLElement | null = null;
  private menuRef: HTMLElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;
  private timelineLabelElement: HTMLElement | null = null;
  private panelElementsCache: HTMLElement[] = [];

  /**
   * 🧙‍♂️ ALGORITMA ZONA KOORDINAT + ANCHOR SCROLL COMPATIBLE
   * Mengatur rute scroll berdasarkan posisi kursor Y andalan Anda
   */
  private wheelHijackListener = (e: WheelEvent) => {
    if (!this.currentShell) return;

    e.preventDefault();

    const cursorY = e.clientY;
    const totalScreenHeight = window.innerHeight;
    const bottomZoneThreshold = totalScreenHeight - 150;

    const activePanel = e.target as HTMLElement;
    const closestPanel = activePanel.closest(".horizontal-panel") as HTMLElement | null;

    // A: Zona Bawah (Radius 150px) -> Scroll Horizontal Halaman Utama
    if (cursorY >= bottomZoneThreshold) {
      this.currentShell.scrollLeft += e.deltaY * 1.2;
      return;
    }

    // B: Zona Atas -> Scroll Konten Internal Panel Vertikal (Anti-Konflik)
    if (closestPanel) {
      const scrollHeight = closestPanel.scrollHeight;
      const clientHeight = closestPanel.clientHeight;
      if (scrollHeight > clientHeight) {
        closestPanel.scrollTop += e.deltaY;
        return;
      }
    }

    // Fallback jika konten atas pendek
    this.currentShell.scrollLeft += e.deltaY * 1.2;
  };

  /**
   * Listener Gerakan Mouse: Menangani Auto-Hide Scrollbar & Pop-Up Widget Timeline Label
   */
  private mouseMoveListener = (e: MouseEvent) => {
    if (!this.currentShell || !this.timelineLabelElement) return;
    const cursorY = e.clientY;
    const totalScreenHeight = window.innerHeight;
    const bottomZoneThreshold = totalScreenHeight - 150;

    if (cursorY >= bottomZoneThreshold) {
      this.currentShell.classList.add("show-scrollbar");
      this.timelineLabelElement.classList.add("visible");
    } else {
      this.currentShell.classList.remove("show-scrollbar");
      this.timelineLabelElement.classList.remove("visible");
    }
  };

  /**
   * Listener Pergeseran Halaman (OnScroll): Melacak posisi seksi terdekat 
   * untuk mendeteksi nama timeline seksi secara real-time
   */
  private pageScrollListener = () => {
    if (!this.timelineLabelElement || this.panelElementsCache.length === 0) return;

    let currentActiveName = "EXPLORE";
    const viewportCenterX = window.innerWidth / 2;

    for (const panel of this.panelElementsCache) {
      const rect = panel.getBoundingClientRect();
      if (rect.left <= viewportCenterX && rect.right >= viewportCenterX) {
        currentActiveName = panel.getAttribute("data-name") || panel.id || "SECTION";
        break;
      }
    }

    if (this.timelineLabelElement.textContent !== currentActiveName) {
      this.timelineLabelElement.textContent = currentActiveName;
    }
  };

  /**
   * 🧙‍♂️ ABAKADABRA STRUKTURAL (Pre-Render)
   * Membakar ID seksi, dimensi kelas kustom, dan MEMBAJAK MENU NAVIGASI secara dinamis!
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null) {
    const dynamicMenuLinks: iBasicNode[] = [];

    pages.forEach((block: any, index: number) => {
      const existingClass = block.className || "section row";
      let panelTypeClass = "panel-type-standard";

      // 1. Tentukan ID Target Lompatan secara presisi (Gunakan ID yang sudah ada, atau buat fallback pintar)
      const sectionId = block.id || block.name?.toLowerCase().replace(/\s+/g, "-") || `panel-section-${index}`;
      block.id = sectionId;

      // 2. Deteksi jenis dimensi seksi
      if (sectionId.includes("hero") || index === 0 || block.name === "Hero") {
        panelTypeClass = "panel-type-hero";


      } else if (block.builder === "form" || (block.content && typeof block.content === "object" && !Array.isArray(block.content))) {
        panelTypeClass = "panel-type-grouped";
      }

      // Suntikkan kelas penanda horizontal ke data objek
      block.className = `${existingClass} horizontal-panel ${panelTypeClass}`.trim();

      const sectionFriendlyName = block.name || block.id.replace(/[-_]/g, " ").toUpperCase();
      block.attrs = {
        ...(block.attrs || {}),
        "data-name": sectionFriendlyName
      };

      // 💡 RECONSTRUCT MENU LINKS: Daftarkan setiap seksi visual menjadi butir link menu samping!
      dynamicMenuLinks.push({
        tagName: "a",
        className: "ui item menu-sidebar-link-item",
        href: `#${sectionId}`, // Menargetkan ID seksi murni secara langsung
        content: sectionFriendlyName,
        onCreated: (linkEl: HTMLElement) => {
          // 💡 INTERAKSI ANCHOR SCROLL: Saat link diklik, ganti scroll default browser 
          // menjadi lompatan pergeseran horizontal menggunakan JavaScript agar mulus!
          linkEl.addEventListener("click", (e) => {
            e.preventDefault();
            const targetDOMNode = document.getElementById(sectionId);
            if (targetDOMNode && this.currentShell) {
              // Hitung jarak posisi horizontal seksi target terhadap container shell utama
              const targetOffsetLeft = targetDOMNode.offsetLeft;
              this.currentShell.scrollTo({
                left: targetOffsetLeft,
                behavior: "smooth"
              });
            }
          });
        }
      });
    });

    // 💡 TRANSFORMI TOTAL STRUKTUR MENU BARU:
    // Jika objek menu terdeteksi aktif, kita bajak dan timpa properti content internalnya 
    // agar murni hanya menampilkan daftar link seksi yang baru saja kita rakit di atas!
    if (menu) {
      menu.builder = "menu" as any; // Matikan default builder menu lama jika ada
      menu.content = [
        {
          tagName: "div",
          className: "nav vertical dynamic-sidebar-menu-links",
          style: "display: flex; flex-direction: column; gap: 1rem; padding: 20px 10px;",
          content: dynamicMenuLinks // Suntikkan tumpukan link seksi dinamis!
        }
      ];
    }

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   * Menyalakan seluruh sirkuit interaksi kursor di browser scope
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    this.currentShell = shell;
    shell.className = "theme-horizontal";

    this.panelElementsCache = elements.filter(el => el.classList.contains("horizontal-panel"));

    // Bangun atau panggil kapsul widget label timeline melayang
    this.timelineLabelElement = document.getElementById("horizontal-timeline-label-widget");
    if (!this.timelineLabelElement) {
      this.timelineLabelElement = document.createElement("div");
      this.timelineLabelElement.id = "horizontal-timeline-label-widget";
      this.timelineLabelElement.textContent = "EXPLORE";
      document.body.appendChild(this.timelineLabelElement);
    }

    // Bangun tombol Hamburger ☰ untuk menu samping kiri
    this.menuRef = shell.querySelector(".nav") || document.querySelector(".nav");
    if (this.menuRef) {
      this.toggleButton = document.createElement("button");
      this.toggleButton.id = "sidebar-toggle-trigger-btn";
      this.toggleButton.innerHTML = "☰";
      this.toggleButton.style.cssText = "width: 100%; padding: 15px; border: none; background: #7b2cbf; color: #fff; cursor: pointer; font-size: 16px;";
      this.menuRef.insertBefore(this.toggleButton, this.menuRef.firstElementChild);

      this.toggleButton.addEventListener("click", () => {
        this.menuRef?.classList.toggle("expanded");
        if (this.toggleButton) {
          this.toggleButton.innerHTML = this.menuRef?.classList.contains("expanded") ? "✕" : "☰";
        }
      });
    }

    // Ikat seluruh event listener fungsional
    shell.addEventListener("wheel", this.wheelHijackListener, { passive: false });
    shell.addEventListener("mousemove", this.mouseMoveListener);
    shell.addEventListener("scroll", this.pageScrollListener);

    this.pageScrollListener();
  }

  public deactivate(shell: HTMLElement): void {
    if (this.currentShell) {
      this.currentShell.removeEventListener("wheel", this.wheelHijackListener);
      this.currentShell.removeEventListener("mousemove", this.mouseMoveListener);
      this.currentShell.removeEventListener("scroll", this.pageScrollListener);
    }

    if (this.timelineLabelElement && this.timelineLabelElement.parentNode) {
      this.timelineLabelElement.parentNode.removeChild(this.timelineLabelElement);
    }

    if (this.toggleButton && this.toggleButton.parentNode) {
      this.toggleButton.parentNode.removeChild(this.toggleButton);
    }

    if (this.menuRef) {
      this.menuRef.classList.remove("expanded");
    }

    shell.className = "page";
    shell.removeAttribute("style");

    this.currentShell = null;
    this.menuRef = null;
    this.toggleButton = null;
    this.timelineLabelElement = null;
    this.panelElementsCache = [];
  }
}

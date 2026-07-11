import type { iBasicNode, iThemeModule } from "../interface";
import "./HorizontalTheme.css";


export class HorizontalTheme implements iThemeModule {
  readonly themeId = "horizontal";
  readonly name = "↔️ Horizontal Slide Shift Engine";

  private currentShell: HTMLElement | null = null;
  private menuRef: HTMLElement | null = null;
  private toggleButton: HTMLButtonElement | null = null;
  private timelineLabelElement: HTMLElement | null = null;

  // Penampung array element panel untuk mempercepat pembacaan posisi scroll timeline
  private panelElementsCache: HTMLElement[] = [];

  /**
   * Pembajak Roda Mouse (Berdasarkan zona radius koordinat 150px andalan Anda)
   */
  private wheelHijackListener = (e: WheelEvent) => {
    if (!this.currentShell) return;
    e.preventDefault();

    const cursorY = e.clientY;
    const totalScreenHeight = window.innerHeight;
    const bottomZoneThreshold = totalScreenHeight - 150;

    const activePanel = e.target as HTMLElement;
    const closestPanel = activePanel.closest(".horizontal-panel") as HTMLElement | null;

    // A: Zona Bawah -> Scroll Horizontal (Scroll-X)
    if (cursorY >= bottomZoneThreshold) {
      this.currentShell.scrollLeft += e.deltaY * 15;
      return;
    }

    // B: Zona Atas -> Scroll Konten Internal (Scroll-Y)
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

    // Jika kursor masuk radius 150px dari bawah layar (Area Scroll-X)
    if (cursorY >= bottomZoneThreshold) {
      this.currentShell.classList.add("show-scrollbar");
      this.timelineLabelElement.classList.add("visible");
    } else {
      // Jika kursor naik kembali ke zona atas
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

    // Cari seksi mana yang saat ini titik tengahnya paling dekat dengan tengah layar browser
    for (const panel of this.panelElementsCache) {
      const rect = panel.getBoundingClientRect();

      // Jika panel sedang memotong area pandang tengah layar browser
      if (rect.left <= viewportCenterX && rect.right >= viewportCenterX) {
        currentActiveName = panel.getAttribute("data-name") || panel.id || "SECTION";
        break;
      }
    }

    // Update isi teks widget timeline secara instan tanpa berkedip
    if (this.timelineLabelElement.textContent !== currentActiveName) {
      this.timelineLabelElement.textContent = currentActiveName;
    }
  };

  /**
   * KATEGORI 2: STRUCTURAL OVERRIDE (Pre-Render)
   * Tanam properti .name atau .id visual sebagai data-attributes HTML permanen
   */
  public beforePageRender(pages: iBasicNode[], menu: iBasicNode | null, footer: iBasicNode | null) {
    pages.forEach((block: any, index: number) => {
      const existingClass = block.className || "section row";
      let panelTypeClass = "panel-type-standard";

      if (block.id === "hero-section" || index === 0 || block.name === "Hero") {
        panelTypeClass = "panel-type-hero";
      }
      if (block.builder === "form" || (block.content && typeof block.content === "object" && !Array.isArray(block.content))) {
        panelTypeClass = "panel-type-grouped";
      }

      block.className = `${existingClass} horizontal-panel ${panelTypeClass}`.trim();

      // 💡 PENYUNTIKAN ATRIBUT DATA: Ambil properti nama seksi untuk dibaca oleh scroll tracker
      const sectionFriendlyName = block.name || block.id || `Seksi ${index + 1}`;
      block.attrs = {
        ...(block.attrs || {}),
        "data-name": sectionFriendlyName
      };
    });

    return { pages, menu, footer };
  }

  /**
   * KATEGORI 1: BEHAVIORAL ACTIVATION (Post-Render)
   * Mengikat seluruh interaksi UX scrolling tingkat tinggi
   */
  public activate(shell: HTMLElement, elements: HTMLElement[]): void {
    this.currentShell = shell;
    shell.className = "theme-horizontal";

    // 1. Ambil dan simpan cache element panel horizontal saja (Bypass element non-panel)
    this.panelElementsCache = elements.filter(el => el.classList.contains("horizontal-panel"));

    // 2. Buat widget teks timeline melayang secara dinamis jika belum terpasang di DOM body
    this.timelineLabelElement = document.getElementById("horizontal-timeline-label-widget");
    if (!this.timelineLabelElement) {
      this.timelineLabelElement = document.createElement("div");
      this.timelineLabelElement.id = "horizontal-timeline-label-widget";
      this.timelineLabelElement.textContent = "EXPLORE";
      document.body.appendChild(this.timelineLabelElement);
    }

    // 3. Konfigurasi menu sidebar samping kustom bawaan Anda
    this.menuRef = shell.querySelector(".nav") || document.querySelector(".nav");
    if (this.menuRef) {
      this.toggleButton = document.createElement("button");
      this.toggleButton.id = "sidebar-toggle-trigger-btn";
      this.toggleButton.innerHTML = "☰";
      this.toggleButton.style.cssText = "width: 100%; padding: 15px; border: none; background: #7b2cbf; color: #fff; cursor: pointer;";
      this.menuRef.insertBefore(this.toggleButton, this.menuRef.firstElementChild);

      this.toggleButton.addEventListener("click", () => {
        this.menuRef?.classList.toggle("expanded");
        if (this.toggleButton) {
          this.toggleButton.innerHTML = this.menuRef?.classList.contains("expanded") ? "✕" : "☰";
        }
      });
    }

    // 4. IKAT SELURUH EVENT LISTENERS STRUKTURAL UTAMA
    shell.addEventListener("wheel", this.wheelHijackListener, { passive: false });
    shell.addEventListener("mousemove", this.mouseMoveListener);
    shell.addEventListener("scroll", this.pageScrollListener);

    // Picu pembacaan posisi awal sekali di awal rute halaman dimuat
    this.pageScrollListener();
    console.log("[HorizontalTheme] Auto-hide scrollbar and Timeline tracking widget successfully engaged!");
  }

  /**
   * KATEGORI 5: LIFECYCLE CLEANUP (Unmount)
   * Sapu bersih seluruh sisa-sisa interaksi agar performa memori browser tetap perawan
   */
  public deactivate(shell: HTMLElement): void {
    if (this.currentShell) {
      this.currentShell.removeEventListener("wheel", this.wheelHijackListener);
      this.currentShell.removeEventListener("mousemove", this.mouseMoveListener);
      this.currentShell.removeEventListener("scroll", this.pageScrollListener);
    }

    // Hancurkan widget label melayang dari body luar agar tidak beranak pinak saat pindah rute
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
    console.log("[HorizontalTheme] Timeline and Scrollbar listeners detached successfully.");
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

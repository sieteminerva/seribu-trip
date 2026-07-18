import type { iBasicNode, iActionProperty, iBuilderConfig } from "../../interface";
import "./FabMenu.css";

export type fabPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "middle";

export type FabMenuElementType =
  | "@fab"
  | "@fab>panel"
  | "@fab>panel>title"
  | "@fab>panel>item"
  | "@fab>panel>trigger";

export interface iFabMenuConfig extends iBuilderConfig<FabMenuElementType> {
  container: string | HTMLElement | null;
  duration: number | null;
  position: fabPosition;
  closeOnSelected: boolean;
  closeIcon: string;
  displayIcon: string;
}

export class FabMenuBuilder {
  public config: Required<iFabMenuConfig>;
  private isMenuOpen = false;
  private idleTimer: number | undefined;

  // Element References Utama untuk Manajemen State
  private currentDOMElement!: HTMLElement;
  private panelElement!: HTMLElement;
  private triggerButton!: HTMLButtonElement;

  // Cache parameter data untuk keperluan re-render internal state
  private cachedTitle: string = "";
  private cachedItems: iActionProperty[] = [];

  constructor(config: Partial<iFabMenuConfig> = {}) {
    const defaultConfig: Required<iFabMenuConfig> = {
      themeId: "default",
      container: null,
      position: "bottom-left",
      closeOnSelected: true,
      duration: 10000,
      closeIcon: "✕",
      displayIcon: "⚙️",
      selectors: {
        "@fab": { tagName: "div", className: "fab" },
        "@fab>panel": { tagName: "div", className: "panel", isArray: true },
        "@fab>panel>title": { tagName: "span", className: "title" },
        "@fab>panel>item": { tagName: "button", className: "item" },
        "@fab>panel>trigger": { tagName: "button", className: "trigger" },
      },
      emit: () => { }
    };
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 🔓 STATE MANAGEMENT: Membuka panel menu secara reaktif
   */
  public open(): void {
    if (this.isMenuOpen) return;
    this.isMenuOpen = true;

    this.panelElement.classList.add("is-open");
    this.triggerButton.textContent = this.config.closeIcon;

    this.resetIdleTimer();
  }

  /**
   * 🔒 STATE MANAGEMENT: Menutup panel menu secara reaktif
   */
  public close(): void {
    if (!this.isMenuOpen) return;
    this.isMenuOpen = false;

    this.panelElement.classList.remove("is-open");
    this.triggerButton.textContent = this.config.displayIcon;

    this.clearIdleTimer();
  }

  /**
   * 🧙‍♂️ CORE PUBLIC API: Perakitan DOM Manufaktur Manual Prosedural
   * Mematuhi penuh standardisasi hantaran iBasicNode dari DOMRenderer
   */
  public create(data: iBasicNode): HTMLElement {
    // console.log("FabMenuBuilder", { data })
    this.destroy(); // Reset state & timer jika ada sisa eksekusi lama
    this.isMenuOpen = false;
    // console.log("FabMenuBuilder", { data });

    this.cachedTitle = data.title || "MENU";
    this.cachedItems = (data.actions as iActionProperty[]) || [];

    // 1. Bangun Kontainer Master Terluar
    this.currentDOMElement = document.createElement("div");
    this.currentDOMElement.className = `fab ${this.config.position}`;

    // 2. Bangun Kotak Panel Menu Kontrol (.panel)
    this.panelElement = document.createElement("div");
    this.panelElement.className = "panel";

    // Sisipkan Judul Widget internal
    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = this.cachedTitle.toUpperCase();
    this.panelElement.appendChild(titleSpan);

    // 3. Cetak Baris Tombol Opsi Pilihan secara Manual Prosedural
    this.cachedItems.forEach((item) => {
      const itemBtn = document.createElement("button");
      itemBtn.type = item.type || "button";

      // Gabungkan kelas visual kustom bawaan properti data jika ada
      itemBtn.className = `item option ${item.isActive ? "active" : ""} ${item.className || ""}`.trim();
      if (item.id) itemBtn.id = item.id;

      itemBtn.textContent = item.label || "Option";

      // Ikat fungsionalitas interaksi klik murni di memori
      itemBtn.onclick = (e: MouseEvent) => {
        if (item.onClick) {
          item.onClick(e); // Semburkan callback asli (e.g., ganti tema)
        }

        // SINKRONISASI CONFIGURATION ACTION
        if (this.config.closeOnSelected) {
          this.close();
        } else {
          this.resetIdleTimer(); // Perpanjang nafas waktu tunggu jika tetap terbuka
        }
      };

      this.panelElement.appendChild(itemBtn);
    });

    // 4. Bangun Tombol Lingkaran FAB Utama (.trigger)
    this.triggerButton = document.createElement("button");
    this.triggerButton.className = "trigger";
    this.triggerButton.title = "Click for switching theme";
    this.triggerButton.textContent = this.config.displayIcon;

    this.triggerButton.onclick = () => {
      if (this.isMenuOpen) {
        this.close();
      } else {
        this.open();
      }
    };

    // 5. ORKESTRASI SPASIAL VERTIKAL (Top vs Bottom Susunan Element)
    // Sesuai dengan standardisasi CSS, jika di bawah, panel wajib berada di ATAS tombol trigger
    if (this.config.position.startsWith("bottom")) {
      this.currentDOMElement.appendChild(this.panelElement);
      this.currentDOMElement.appendChild(this.triggerButton);
    } else {
      // Jika posisi melayang di atas, urutan dibalik: panel berada di BAWAH tombol trigger
      this.currentDOMElement.appendChild(this.triggerButton);
      this.currentDOMElement.appendChild(this.panelElement);
    }

    // Kembalikan element fisik murni tunggal ke rahim DOMRenderer untuk di-merge!
    return this.currentDOMElement;
  }

  /**
   * 🛑 LIFECYCLE CLEANUP: Pembasmi Memory Leak & Pembersih Interval Pointer
   */
  public destroy(): void {
    this.clearIdleTimer();

    if (this.triggerButton) this.triggerButton.onclick = null;

    // Bersihkan array referensi internal agar Garbage Collector bekerja instan
    this.cachedItems = [];

    if (this.currentDOMElement && this.currentDOMElement.parentNode) {
      this.currentDOMElement.parentNode.removeChild(this.currentDOMElement);
    }
  }

  // --- MANAGEMENT IDLE TIMER SUB-ROUTINES ---

  private resetIdleTimer(): void {
    this.clearIdleTimer();

    // Proteksi: Jika durasi disetel null, 0, atau minus, nyalakan mode Always-Open tanpa timeout
    if (!this.config.duration || this.config.duration <= 0) return;

    this.idleTimer = window.setTimeout(() => {
      if (this.isMenuOpen) {
        console.log(`[FAB Engine] ${(this.config?.duration as number || 1000) / 1000}s Idle reached. Auto-closing...`);
        this.close();
      }
    }, this.config.duration);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }
}


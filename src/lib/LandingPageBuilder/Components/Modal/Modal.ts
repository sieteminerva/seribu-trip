import type { iBuilderConfig } from "../../interface";
import "./Modal.css";

export type ModalElementType =
  | "@modal";

export interface iModalConfig extends iBuilderConfig<ModalElementType> {
  id: string;                  // Kunci pelacakan instansiasi tunggal di DOM agar anti-kembung
  title?: string;              // Judul modal bawaan halaman preset default
  destroyOnClose: boolean;     // True = hancur total saat tutup, False = sembunyikan saja di DOM
  className?: string;          // Kelas kustom tambahan untuk backdrop luar
  modalClass?: string;         // Kelas kustom tambahan untuk kotak modal dalam
  onOpen?: (el: HTMLElement) => void;  // Callback siklus hidup saat modal meletup terbuka
  onClose?: (el: HTMLElement) => void; // Callback siklus hidup saat modal padam ditutup
}

export class ModalBuilder {
  private config: iModalConfig;
  private overlayElement: HTMLElement | null = null;

  constructor(config: Partial<iModalConfig> = {}) {
    const defaultConfig: Required<iModalConfig> = {
      themeId: "default",
      id: "modal-",
      className: "",
      title: "Notification",
      modalClass: "",
      destroyOnClose: false,
      selectors: {
        "@modal": {}
      },
      emit: () => { },
      onClose: () => { },
      onOpen: () => { }
    };
    const randomSuffix = Math.random().toString(36).substring(7);
    this.config = {
      ...defaultConfig,
      ...config,
      id: config.id ? config.id : defaultConfig.id + randomSuffix
    };
  }

  /**
   * 🏗️ UNIVERSAL VANILLA INGESTION
   * Menerjemahkan konten polimorfik murni tanpa polusi engine eksternal!
   */
  private _compileContent(content: any): HTMLElement {

    if (content instanceof HTMLElement) return content;

    // Jalur string template murni / HTML mentah
    if (typeof content === "string") {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = content;
      return wrapper.firstElementChild instanceof HTMLElement ? wrapper.firstElementChild : wrapper;
    }

    // Jika user menyuapkan fungsi kustom (callback), eksekusi fungsinya 
    // dan biarkan fungsi luar tersebut yang mengembalikan HTMLElement matang!
    if (typeof content === "function") {
      const renderedNode = content();
      if (renderedNode instanceof HTMLElement) return renderedNode;
    }

    // Terakhir, jika data berupa object JSON kaku tetapi project luar tidak punya DOMRenderer,
    // buat container kosong dan biarkan developer luar memanipulasinya lewat onCreated
    const fallbackDiv = document.createElement("div");
    fallbackDiv.textContent = typeof content === "object" ? JSON.stringify(content) : String(content);
    return fallbackDiv;
  }

  /**
   * 🏛️ SYSTEM PRESET PAGE DEFAULT BUILDER
   * Mengatur daur hidup pembuatan elemen dan menahan duplikasi fisik di DOM browser
   */
  public create(contentPayload: any): { open: () => void; close: () => void; destroy: () => void; element: HTMLElement } {
    // 💡 POTENSI ANTI-KEMBUNG SEJATI: Cek keberadaan ID elemen di live DOM tree
    const existingDOMElement = document.getElementById(this.config.id);

    if (existingDOMElement && !this.config.destroyOnClose) {
      console.log(`[Universal Modal] Re-using active memory pointer for #${this.config.id}`);
      this.overlayElement = existingDOMElement;
      return this._getControlInterfaces();
    }

    // 1. Bangun Backdrop luar (Outer Overlay Container)
    this.overlayElement = document.createElement("div");
    this.overlayElement.id = this.config.id;
    this.overlayElement.className = `dialog hidden ${this.config.className}`.trim();

    // 2. Bangun Kotak Modal Dalam (Inner Box Layout)
    const modalBox = document.createElement("div");
    modalBox.className = `modal ${this.config.modalClass}`.trim();

    // 3. Bangun Header Preset Default
    const header = document.createElement("div");
    header.className = "header";

    const title = document.createElement("h2");
    title.className = "title";
    title.textContent = this.config.title || "Formulir Pesanan";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "close";
    closeButton.innerHTML = "&times;"; // Simbol silang perkasa

    // 4. Proses kompilasi konten murni vanilla
    const bodyContent = this._compileContent(contentPayload);
    bodyContent.classList.add("body");

    // Satukan rantai anatomi fisik komponen
    header.append(title, closeButton);
    modalBox.append(header, bodyContent);
    this.overlayElement.appendChild(modalBox);

    // ====================================================
    // 🎢 PENGIKAT EVENT LISTENER MURNI
    // ====================================================
    closeButton.addEventListener("click", () => this.close());

    // Tutup safely jika area hitam backdrop luar diketuk
    this.overlayElement.addEventListener("click", (event) => {
      if (event.target === this.overlayElement) {
        this.close();
      }
    });

    // Injeksi fisik modal langsung di bawah dokumen kulit terluar body
    document.body.appendChild(this.overlayElement);

    return this._getControlInterfaces();
  }

  public open(): void {
    if (!this.overlayElement) return;

    this.overlayElement.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Cegah double scrolling halaman belakang

    if (typeof this.config.onOpen === "function") {
      this.config.onOpen(this.overlayElement);
    }
  }

  public close(): void {
    if (!this.overlayElement) return;

    this.overlayElement.classList.add("hidden");
    document.body.style.overflow = ""; // Pulihkan scroll normal halaman belakang

    if (typeof this.config.onClose === "function") {
      this.config.onClose(this.overlayElement);
    }

    // Eksekusi pemusnahan jika bendera destroyOnClose bernilai TRUE
    if (this.config.destroyOnClose) {
      this.destroy();
    }
  }

  /**
   * 💣 THE TOTAL WIPEOUT: Hancurkan fisik elemen dari rahim DOM Tree halaman
   */
  public destroy(): void {
    if (this.overlayElement) {
      this.overlayElement.remove(); // Cabut dari halaman web
      this.overlayElement = null;   // Kosongkan pointer memori agar dibersihkan Garbage Collector OS
      console.log(`[Universal Modal] Instance #${this.config.id} successfully wiped out from active memory stacks.`);
    }
  }

  private _getControlInterfaces() {
    return {
      element: this.overlayElement as HTMLElement,
      open: () => this.open(),
      close: () => this.close(),
      destroy: () => this.destroy()
    };
  }
}

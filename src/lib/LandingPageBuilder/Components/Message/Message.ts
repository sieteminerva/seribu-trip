import type { iBuilderConfig } from "../../interface";
import "./Message.css";

export type MessageElementType =
  | "@message"
  | "@message>close"
  | "@message>content"
  | "@message>content>header"
  | "@message>content>desc"
  | "@message>content>icon";

export interface iMessageConfig extends iBuilderConfig<MessageElementType> {
  id?: string;                    // ID unik pelacakan di DOM agar pesan anti-menumpuk kembung
  element?: HTMLElement | string;    // Kontainer tempat menempelkan pesan (Default: document.body)
  duration?: number;              // Durasi muncul dalam milidetik (0 = menetap sampai diklik silang)
  header?: string;                // Judul pesan dari preset Semantic-UI
  message: string;                // Isi pesan utama
  icon?: string;                  // Kelas ikon kustom (e.g., "check circle icon")
  type?: string;                  // Tipe pesan Semantic-UI ("success" | "error" | "info" | "positive")
  onOpen?: (el: HTMLElement) => void;  // Callback saat pesan meletup keluar
  onClose?: (el: HTMLElement) => void; // Callback saat pesan padam dihancurkan
}

export class MessageBuilder {
  // 🧙‍♂️ MEMORY ANCHOR: Menyimpan pointer timer asinkronus agar bisa di-reset secara statik lintas klik!
  private static _activeTimers = new Map<string, number>();

  /**
   * 👑 INSTANT STATIC DECLARATION API (Pilihan Cerdas Anda!)
   * Cukup panggil MessageBuilder.create({ ... }) untuk langsung memutahkan toast di viewport browser!
   */
  public static create(config: iMessageConfig): HTMLElement {
    const defaultConfig: Required<iMessageConfig> = {
      themeId: "default",
      id: "global-status-message",
      element: document.body,
      duration: 3000,
      header: "Congrats!",
      icon: "bell outline icon",
      type: "info",
      message: "",
      selectors: {
        "@message": { tagName: "div", className: "message" },
        "@message>close": { tagName: "i", className: "close" },
        "@message>content": { tagName: "div", className: "content" },
        "@message>content>header": { tagName: "h2", className: "header" },
        "@message>content>desc": { tagName: "p", className: "desc" },
        "@message>content>icon": { tagName: "i", className: "info" } // "error", "success", "info", "warning"
      },
      emit: () => { },
      onOpen: () => { },
      onClose: () => { }
    };

    // Peleburan konfigurasi instan
    const activeConfig = { ...defaultConfig, ...config };

    // ====================================================
    // 💡 POTENSI ANTI-KEMBUNG SEJATI (SINGLE-INSTANCE TRACKING)
    // ====================================================
    const existingDOMElement = document.getElementById(activeConfig.id) as HTMLDivElement;

    if (existingDOMElement) {
      console.log(`[Message Static Engine] Hydrating active element #${activeConfig.id} and resetting timer...`);

      // Update teks paragraf pesan secara dinamis
      const contentTextEl = existingDOMElement.querySelector(".content p");
      if (contentTextEl) contentTextEl.textContent = activeConfig.message;

      // Update teks header secara dinamis
      const headerTextEl = existingDOMElement.querySelector(".content .header");
      if (headerTextEl) headerTextEl.innerHTML = activeConfig.header;

      // Nyalakan kembali hitung mundur waktu tunggu dari nol!
      this._startTimeoutCounter(activeConfig.id, activeConfig.duration, existingDOMElement, activeConfig.onClose);
      return existingDOMElement;
    }

    // 1. Bangun Kulit Terluar Kotak Pesan Semantic-UI
    const messageElement = document.createElement("div");
    messageElement.id = activeConfig.id;
    messageElement.className = `ui visible ${activeConfig.type} ${activeConfig.icon ? "icon" : ""} message`.trim();
    messageElement.style.boxShadow = "0 1px 2px 0 rgba(34, 36, 38, .15)";

    // 2. Bangun Tombol Silang Penghancur Fisik Elemen
    const closeIcon = document.createElement("i");
    closeIcon.className = "red close icon";
    closeIcon.style.cursor = "pointer";
    closeIcon.addEventListener("click", () => this.destroy(activeConfig.id, activeConfig.onClose));

    // 3. Bangun Struktur Rahim Konten Dalam (.content)
    const contentBox = document.createElement("div");
    contentBox.className = "content";

    if (activeConfig.header) {
      const headerEl = document.createElement("div");
      headerEl.className = "header";
      headerEl.innerHTML = activeConfig.header;
      contentBox.appendChild(headerEl);
    }

    const messageParagraph = document.createElement("p");
    messageParagraph.className = "desc";
    messageParagraph.textContent = activeConfig.message;
    contentBox.appendChild(messageParagraph);

    // 4. Bangun Ikon Utama Kiri (Prepend Slot)
    const leadingIcon = document.createElement("i");
    leadingIcon.className = activeConfig.icon;

    // Rangkai organ anatomi fisik pesan secara tertib
    messageElement.append(closeIcon, leadingIcon, contentBox);

    // 5. Ingestion Target Container Selection
    let containerElement: HTMLElement | null = null;
    if (typeof activeConfig.element === "string") {
      containerElement = document.getElementById(activeConfig.element);
    } else {
      containerElement = activeConfig.element;
    }

    if (!containerElement) containerElement = document.body;

    // Selipkan pesan di baris teratas (prepend) kontainer secara instan
    containerElement.prepend(messageElement);

    // Pemicu callback siklus hidup buka
    activeConfig.onOpen(messageElement);

    // Jalankan hitung mundur pemusnahan otomatis statik
    this._startTimeoutCounter(activeConfig.id, activeConfig.duration, messageElement, activeConfig.onClose);

    return messageElement;
  }

  /**
   * 💣 STATIC DESTRUCTOR: Cabut fisik elemen dari DOM koordinat mana pun dan bersihkan sisa timer
   */
  public static destroy(id: string, onCloseCallback?: (el: HTMLElement) => void): void {
    // Bersihkan sisa timer di latar belakang memori agar tidak meletup liar
    const activeTimer = this._activeTimers.get(id);
    if (activeTimer) {
      window.clearTimeout(activeTimer);
      this._activeTimers.delete(id);
    }

    const targetElement = document.getElementById(id);
    if (targetElement) {
      if (typeof onCloseCallback === "function") {
        onCloseCallback(targetElement);
      }
      targetElement.remove(); // Hancurkan dari halaman web
      console.log(`[Message Static Engine] Instance #${id} wiped out from DOM successfully.`);
    }
  }

  /**
   * Pengontrol internal hitung mundur pemusnahan otomatis tingkat statik
   */
  private static _startTimeoutCounter(id: string, duration: number, el: HTMLElement, onCloseCallback?: (el: HTMLElement) => void): void {
    // Stop dan hapus antrean timer lama dengan ID yang sama jika sedang berjalan
    if (el) {
      const activeTimer = this._activeTimers.get(id);
      if (activeTimer) {
        window.clearTimeout(activeTimer);
        this._activeTimers.delete(id);
      }

      if (duration && duration > 0) {
        const newTimer = window.setTimeout(() => {
          this.destroy(id, onCloseCallback);
        }, duration);

        // Amankan reference timer baru ke dalam static Map tracker!
        this._activeTimers.set(id, newTimer);
      }
    }
  }
}

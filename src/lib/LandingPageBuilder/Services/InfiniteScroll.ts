export interface iScrollStreamConfig {
  mode: "infinite" | "load-more";
  threshold: number;
  fromHttp: boolean;
  initialUrl?: string;
}

export type ScrollStreamEvent = "stream:load" | "stream:success" | "stream:error" | "stream:complete";

export class ScrollStreamEngine {
  private config: Required<iScrollStreamConfig>;

  // State Internal Sinkronisasi HATEOAS
  private currentNextUrl: string | null = null;
  private currentPage: number = 1;
  private isLoading: boolean = false;
  private isComplete: boolean = false;

  // Saku Event Listener
  private listeners: Record<ScrollStreamEvent, Array<(data: any) => void>> = {
    "stream:load": [],
    "stream:success": [],
    "stream:error": [],
    "stream:complete": []
  };

  // Sensor Fisik Ganda Browser
  private intersectionObserver: IntersectionObserver | null = null;
  private currentAnchorElement: HTMLElement | null = null;
  private currentButtonElement: HTMLElement | null = null;
  private currentButtonListener: ((e: Event) => void) | null = null;

  private httpService: any;

  constructor(config: Partial<iScrollStreamConfig> = {}) {
    const defaultConfig: Required<iScrollStreamConfig> = {
      mode: "infinite",
      threshold: 200,
      fromHttp: false,
      initialUrl: ""
    };
    this.config = { ...defaultConfig, ...config };
    this.currentNextUrl = this.config.initialUrl;

    if (this.config.fromHttp && (window as any).HttpService) {
      this.httpService = new (window as any).HttpService();
    }
  }

  public on(event: ScrollStreamEvent, callback: (data: any) => void): this {
    if (this.listeners[event]) this.listeners[event].push(callback);
    return this;
  }

  /**
   * 🚀 THE UNIVERSAL AUTOMATED FETCH PIPELINE
   */
  public async next(staticDispatcher?: (page: number) => any[] | null): Promise<void> {
    if (this.isLoading || this.isComplete) return;

    this.isLoading = true;
    this._emit("stream:load", { page: this.currentPage, url: this.currentNextUrl });

    try {
      if (this.config.fromHttp) {
        if (!this.currentNextUrl) {
          this.isComplete = true;
          this._handleStreamComplete();
          return;
        }

        console.log(`🌐 [ScrollStream HTTP]: Fetching query page ${this.currentPage} from: ${this.currentNextUrl}`);
        const response = await this.httpService.get(this.currentNextUrl);

        if (response && response.status === "success") {
          const rawData = response.data || [];
          const links = response.meta?.links || {};

          this.currentNextUrl = links.next || null;

          this._emit("stream:success", {
            page: this.currentPage,
            data: rawData,
            meta: response.meta
          });

          if (!this.currentNextUrl) {
            this.isComplete = true;
            this._handleStreamComplete();
          }

          this.currentPage++;
        } else {
          throw new Error("Invalid Apps Script server response envelope format.");
        }
      }
      else if (staticDispatcher) {
        const localRecords = await staticDispatcher(this.currentPage);
        if (!Array.isArray(localRecords) || localRecords.length === 0) {
          this.isComplete = true;
          this._handleStreamComplete();
          return;
        }

        this._emit("stream:success", { page: this.currentPage, data: localRecords });
        this.currentPage++;
      }
    } catch (error) {
      console.error("🚨 [ScrollStream Error]: Pipeline crash:", error);
      this._emit("stream:error", error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 👁️ SENSOR MASSAAL A: INFINITE SCROLL MODE (INTERSECTION OBSERVER)
   */
  public attachAnchor(anchorElement: HTMLElement, staticDispatcher?: (page: number) => any[] | null): void {
    if (this.config.mode !== "infinite" || !anchorElement) return;

    this.detachAnchor();
    this.currentAnchorElement = anchorElement;

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isLoading && !this.isComplete) {
          this.next(staticDispatcher);
        }
      });
    }, {
      root: null,
      rootMargin: `0px 0px ${this.config.threshold}px 0px`,
      threshold: 0
    });

    this.intersectionObserver.observe(this.currentAnchorElement);
  }

  /**
   * 🖱️ SENSOR MASSAAL B: LOAD MORE MODE (MANUAL BUTTON CLICK BINDING!)
   * ====================================================
   * 🧙‍♂️ THE MANUAL LOAD MORE WELDER (ORGAN BARU KOREKSI SAKRAL ANDA!)
   * Mengunci tombol klik manual dari luar secara otonom!
   * ====================================================
   */
  public attachButton(buttonElement: HTMLElement, staticDispatcher?: (page: number) => any[] | null): void {
    if (this.config.mode !== "load-more" || !buttonElement) return;

    this.detachButton(); // Bersihkan sisa listener tombol lama (SPA Insurance)
    this.currentButtonElement = buttonElement;

    // Definisikan sirkuit listener pemicu klik murni
    this.currentButtonListener = (e: Event) => {
      e.preventDefault();
      if (!this.isLoading && !this.isComplete) {
        console.log("🖱️ [ScrollStream]: Manual Load More button clicked. Stream detonated!");
        this.next(staticDispatcher);
      }
    };

    this.currentButtonElement.addEventListener("click", this.currentButtonListener);
  }

  public detachAnchor(): void {
    if (this.intersectionObserver && this.currentAnchorElement) {
      this.intersectionObserver.unobserve(this.currentAnchorElement);
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    this.currentAnchorElement = null;
  }

  /**
   * Mencabut event klik tombol manual secara steril dari memori RAM browser
   */
  public detachButton(): void {
    if (this.currentButtonElement && this.currentButtonListener) {
      this.currentButtonElement.removeEventListener("click", this.currentButtonListener);
    }
    this.currentButtonElement = null;
    this.currentButtonListener = null;
  }

  /**
   * Pengkondisian akhir otomatis: Jika data Sheets habis, sembunyikan tombol load-more!
   */
  private _handleStreamComplete(): void {
    this._emit("stream:complete", { totalPages: this.currentPage - 1 });

    // Matikan bodi fisik tombol klik di layar browser agar desainer tidak bingung
    if (this.currentButtonElement) {
      this.currentButtonElement.style.display = "none";
      this.currentButtonElement.classList.add("stream-complete");
    }
    this.detachButton();
  }

  public reset(): void {
    this.currentPage = 1;
    this.currentNextUrl = this.config.initialUrl;
    this.isLoading = false;
    this.isComplete = false;
    this.detachAnchor();
    this.detachButton();
  }

  private _emit(event: ScrollStreamEvent, payload: any): void {
    if (this.listeners[event]) this.listeners[event].forEach((cb) => cb(payload));
  }
}

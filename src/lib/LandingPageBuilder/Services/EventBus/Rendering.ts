import { GLOBAL_DISPLAY_LOG } from "../../interface";
import { DataLogger } from "../../Utils/DataLogger";

const DISPLAY_LOG = GLOBAL_DISPLAY_LOG;
/**
 * ============================================================================
 * 🪐 2. RENDERING EVENT BUS (KLAN ORKESTRASI TIMELINE LAYOUT STAGE)
 * Bertugas mengawal daur hidup putaran rendering halaman (beforeRender, ready, unmount).
 * ============================================================================
 */

export class RenderingEventBus {
  private static beforeRenderListenerRef: ((e: Event) => void) | null = null;
  private static readyListenerRef: ((e: Event) => void) | null = null;

  private static describeShell(shell: HTMLElement): string {
    const tag = shell?.tagName ? shell.tagName.toLowerCase() : "main";
    const id = shell?.id ? `#${shell.id}` : "";
    const className = shell?.className ? `.${String(shell.className).trim().split(/\s+/).filter(Boolean).join(".")}` : "";
    return `${tag}${id}${className}`;
  }

  public static listen() {
    if (this.beforeRenderListenerRef || this.readyListenerRef) return;
    this.beforeRenderListenerRef = (e: any) => {
      DataLogger(DISPLAY_LOG,
        { functionName: "🏗️ [RenderingEventBus]", action: `Receiver` },
        { message: "beforeRender event received", ...e.detail });
    };

    this.readyListenerRef = (e: any) => {

      DataLogger(DISPLAY_LOG,
        { functionName: "✅ [RenderingEventBus]", action: `Receiver` },
        { message: "ready event [received]", route: e.detail.route, shell: `${e.detail.shell.tagName.toLowerCase()}.${e.detail.shell.className}`, payload: JSON.stringify(e.detail.payload) });

    };

    document.addEventListener("page:beforeRender", this.beforeRenderListenerRef);
    document.addEventListener("page:ready", this.readyListenerRef);
  }

  public static shutdown() {
    if (this.beforeRenderListenerRef) {
      document.removeEventListener("page:beforeRender", this.beforeRenderListenerRef);
      this.beforeRenderListenerRef = null;
    }
    if (this.readyListenerRef) {
      document.removeEventListener("page:ready", this.readyListenerRef);
      this.readyListenerRef = null;
    }
  }
  /**
   * 🛰️ BROADCAST: Mengumumkan status kesiapan timeline layout ke level sasis atas
   * TODO: Lepaskan siaran 'page:ready' atau 'page:beforeRender' agar plugin luar / router terluar
   *       bisa melakukan interupsi sebelum visual disemburkan ke mata user.
   */
  public static broadcast(eventName: "beforeRender" | "ready", payload: any): void {

    DataLogger(DISPLAY_LOG,
      { functionName: "🛰️ [RenderingEventBus]", action: `Broadcast` },
      { message: `Emitting timeline checkpoint: [${eventName}]` });

    document.dispatchEvent(new CustomEvent(eventName === "beforeRender" ? "page:beforeRender" : "page:ready", {
      detail: payload
    }));
  }

  /**
   * 🎛️ RELAY: Meneruskan pipa instruksi render lintas rute halaman
   * TODO: Ambil data context/payload Google Sheets dari hulu PageBuilder, lalu relay/distribusikan
   *       bersih masuk ke parameter compile() milik sub-builder yang sedang mengantre.
   */
  public static relay(targetBuilder: string, actionPayload: any): void {
    DataLogger(DISPLAY_LOG,
      { functionName: "🛰️ [RenderingEventBus]", action: `Relay ${targetBuilder}` },
      { actionPayload });
  }

  /**
   * 📡 RECEIVE: Mendengarkan interupsi transisi perpindahan rute SPA
   * TODO: Pasang telinga untuk memburu getaran event 'routeChanged' dari HashRouter.
   *       Begitu meletup, langsung pemicu sirkuit pembersihan selektif Handler.detach() halaman lama.
   */
  public static receive(): void {
    DataLogger(DISPLAY_LOG,
      { functionName: "🛰️ [RenderingEventBus]", action: `Receiver` },
      { message: `Listening for layout route transitions...` });
    this.listen();
  }

  /**
   * 🛠️ HANDLER: Katup mikro daur hidup penguncian kontainer halaman makro (The Page Shell Guard)
   */
  public static handler(pageKey: string, shell: HTMLElement, mountTarget: HTMLElement = document.body) {
    return {
      // Tancapkan fisik cangkang halaman <main class="page"> seutuhnya ke dalam bumi container terluar.
      attach: () => {
        DataLogger(DISPLAY_LOG,
          { functionName: "🏢 [RenderingEventBus]", action: `Handler.attach` },
          {
            message: `Mounting shell layout for page: [${pageKey}]`,
            shell: `${RenderingEventBus.describeShell(shell)}`,
            childCount: `${shell.children.length} item`,
            innerHTML: `${shell.innerHTML.length} element`,
            parentTarget: `${RenderingEventBus.describeShell(mountTarget)}`
          });

        if (!shell.parentElement) mountTarget.appendChild(shell);
      },
      // Angkat b b boks sasis halaman lama dari container terluar browser (0ms Page Switching!).
      detach: () => {

        DataLogger(DISPLAY_LOG,
          { functionName: "🏢 [RenderingEventBus]", action: `Handler.detach` },
          {
            message: `Detaching shell layout for page: [${pageKey}]`,
            shell: `${RenderingEventBus.describeShell(shell)}`,
            childCount: `${shell.children.length} item`,
            innerHTML: `${shell.innerHTML.length} element`,
            parentTarget: `${shell.parentElement ? RenderingEventBus.describeShell(shell.parentElement as HTMLElement) : "none"}`
          });

        shell.remove();
      },
      // Sapu bersih seluruh isi innerHTML shell kontainer halaman, sterilkan residu visualnya.
      destroy: () => {

        DataLogger(DISPLAY_LOG,
          { functionName: "🏢 [RenderingEventBus]", action: `Handler.destroy` },
          {
            message: `Washing clean whole innerHTML for page: [${pageKey}]`,
            shell: `${RenderingEventBus.describeShell(shell)}`, childCount: `${shell.children.length} item`
          });

        shell.innerHTML = "";
      },
      // Re-hydrate/recompile sebagian komponen parsial jika data sheets mengalami mutasi parsial.
      update: (freshPageSchema: any) => {

        DataLogger(DISPLAY_LOG,
          { functionName: "🏢 [RenderingEventBus]", action: `Handler.update` },
          { message: `Hot-Swapping layout schema for page: [${pageKey}]` });

        console.log("🏢 [RenderingEventBus] -> %c:", "color:blue", ``);
        document.dispatchEvent(new CustomEvent("page:beforeRender", { detail: { pageKey, freshPageSchema, shell } }));
      }
    }
  }
}

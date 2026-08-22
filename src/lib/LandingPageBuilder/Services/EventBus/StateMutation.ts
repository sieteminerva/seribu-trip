import { GLOBAL_DISPLAY_LOG } from "../../interface";
import { DOMTreeMemory } from "../../Modules/DOMTreeMemory";
import { DataLogger } from "../../Utils/DataLogger";

const DISPLAY_LOG = GLOBAL_DISPLAY_LOG;

/**
 * ============================================================================
 * 🪐 3. STATE MUTATION BUS (KLAN REAKTIVITAS DATA BINDING SATU PINTU)
 * Mengawal getaran denyut nadi reaktivitas saat tameng Proxy Trap lokal disenggol user.
 * ============================================================================
 */

export class StateMutationEventBus {
  private static mutationListenerRef: ((e: Event) => void) | null = null;

  public static listen() {
    if (this.mutationListenerRef) return;

    this.mutationListenerRef = (e: any) => {
      const { key, updatedTarget, element } = e.detail || {};
      const childElement = (element instanceof HTMLElement ? element : e.target) as HTMLElement;
      if (!key || !updatedTarget || !childElement) return;

      for (const [globalKey, record] of DOMTreeMemory.getAll().entries()) {
        const matchItem = record.records.find(r => r.element === childElement);
        if (matchItem && matchItem.relations?.key === key) {
          matchItem.payload = updatedTarget;
          DataLogger(DISPLAY_LOG,
            { functionName: "⚡ [StateMutationBus | Sync]", action: `Broadcast` },
            { message: `Updated raw payload for "${globalKey}"` });
          break;
        }
      }
    };

    document.addEventListener("builder:mutation", this.mutationListenerRef);
  }

  public static shutdown() {
    if (this.mutationListenerRef) {
      document.removeEventListener("builder:mutation", this.mutationListenerRef);
      this.mutationListenerRef = null;
    }
  }
  /**
   * 🛰️ BROADCAST: Meledakkan siaran perubahan data reaktif secara horizontal bawaan browser
   * TODO: Dipicu JIT dari dalam target Proxy Setter trap anak. Letupkan CustomEvent 'state:mutation'
   *       membawa detail payload yang diperbarui agar melesat memantul (bubbles) ke udara!
   */
  public static broadcast(typeKey: string, updatedTarget: any, element?: HTMLElement): void {

    DataLogger(DISPLAY_LOG,
      { functionName: "⚡ [StateMutationBus]", action: `Broadcast` },
      { message: `Blasting live data mutation event for: ${typeKey}` });

    document.dispatchEvent(new CustomEvent("builder:mutation", {
      detail: { key: typeKey, updatedTarget, element }
    }));
  }

  /**
   * 🎛️ RELAY: Meneruskan pantulan getaran Proxy lokal agar langsung menyenggol visual view di layar
   * TODO: Tangkap mutasi data, lalu relay/instruksikan template() builder yang bersangkutan 
   *       untuk merubah isi teks target `.innerHTML` secara atomik seadanya tanpa repaint total!
   */
  public static relay(globalKey: string, prop: string, value: any): void {
    const mainRecord = DOMTreeMemory.getByGlobalKey(globalKey);
    if (!mainRecord) return;

    mainRecord.raw = mainRecord.raw || {};
    mainRecord.raw[prop] = value;
  }

  /**
   * 📡 RECEIVE: Mendengarkan mutasi data reaktif untuk kebutuhan sinkronisasi horizontal RAM
   * TODO: Pasang telinga radar pusat, dengarkan event 'state:mutation' di level dokumen terluar.
   *       Detik sinyal ditangkap, perbarui data target `.raw` di dalam DOMTreeMemory pusat agar tetap sinkron 1:1!
   */
  public static receive(): void {
    DataLogger(DISPLAY_LOG,
      { functionName: "⚡ [StateMutationBus]", action: `Receiver` },
      { message: `Central Data Reactivity Radar is ONLINE.` });

    this.listen();
  }

  /**
   * 🛠️ HANDLER: Katup mikro pengelolaan ikat jiwa antara Data Model (Proxy) dengan Visual DOM (View)
   */
  public static handler(globalKey: string, proxyData: any) {
    return {
      // TODO: Ikat alamat pointer live proxy reaktif anak ini masuk menemani raw data di level memori pusat.
      attach: () => {
        DataLogger(DISPLAY_LOG,
          { functionName: "🔗 [StateMutationBus]", action: `Handler.attach` },
          { message: `Binding data proxy model into central pool for ${globalKey}`, proxyData });
      },
      // TODO: Non-aktifkan sementara perangkap reaktivitas (Mute listener data) jika komponen sedang di-staging cache.
      detach: () => {

        DataLogger(DISPLAY_LOG,
          { functionName: "🔗 [StateMutationBus]", action: `Handler.detach` },
          { message: `Muting data reactivity trap for ${globalKey}` });
      },
      // TODO: Lepaskan dan hancurkan referensi objek Proxy dari RAM agar bersih disapu oleh Garbage Collector.
      destroy: () => {
        DataLogger(DISPLAY_LOG,
          { functionName: "🔗 [StateMutationBus]", action: `Handler.destroy` },
          { message: `Untying proxy references for ${globalKey}` });
      },
      // TODO: Timpa paksa (*force overwrite*) seluruh isi raw data pusat mengikuti getaran injeksi data massal eksternal.
      update: (freshRawPayload: any) => {

        DataLogger(DISPLAY_LOG,
          { functionName: "🔗 [StateMutationBus]", action: `Handler.update` },
          { message: `Overwriting central state model for ${globalKey}`, freshRawPayload });
      }
    }
  }
}

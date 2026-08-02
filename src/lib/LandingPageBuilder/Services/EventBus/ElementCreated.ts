import { GLOBAL_DISPLAY_LOG } from "../../interface";
import { DOMTreeMemory } from "../../Modules/DOMTreeMemory";
import { DataLogger } from "../../Utils/DataLogger";

const DISPLAY_LOG = GLOBAL_DISPLAY_LOG;

export class ElementCreatedEventBus {
  private static createdListenerRef: ((e: Event) => void) | null = null;

  public static listen() {
    if (this.createdListenerRef) return;

    this.createdListenerRef = (e: any) => {
      const { relations, raw, proxy, element, builderId, key, instanceId } = e.detail || {};
      const childElement = (element instanceof HTMLElement ? element : e.target) as HTMLElement;
      if (!relations || !childElement) return;
      DOMTreeMemory.receiveLiveBornEvent({ relations, raw, proxy, builderId, key, instanceId, element: childElement }, childElement);
    };

    document.addEventListener("builder:created", this.createdListenerRef);
  }

  public static shutdown() {
    if (this.createdListenerRef) {
      document.removeEventListener("builder:created", this.createdListenerRef);
      this.createdListenerRef = null;
    }
  }
  /**
   * 🛰️ BROADCAST: Melempar manifes elemen yang sukses lahir ke level atas
   * TODO: Ambil manifest list KEY yang aktif di DOMTreeMemory, lalu trigger dispatchEvent
   *       'element:manifest' agar LandingPageBuilder melek tahu elemen apa saja yang siap di-consume.
   */
  public static broadcast(routeKey: string, manifest: string[]): void {
    DataLogger(DISPLAY_LOG,
      { functionName: "🛰️ [ElementCreatedBus]", action: `Broadcast` },
      { message: `Publishing birth manifest for route: ${routeKey}` });

    document.dispatchEvent(new CustomEvent("element:manifest", {
      detail: { route: routeKey, keys: manifest }
    }));
  }

  public static broadcastCreated(detail: { key: string; instanceId: string; builderId: string; relations: any; raw: any; proxy: any; element: HTMLElement }): void {
    const elementDescriptor = detail.element instanceof HTMLElement
      ? `${detail.element.tagName.toLowerCase()}${detail.element.id ? "#" + detail.element.id : ""}${detail.element.className ? "." + String(detail.element.className).trim().split(/\s+/).filter(Boolean).join(".") : ""}`
      : "unknown-element";

    DataLogger(DISPLAY_LOG,
      { functionName: "🧩 [ElementCreatedBus]", action: `Broadcast` },
      { builder: detail.builderId, key: detail.key, instance: detail.instanceId, element: elementDescriptor });

    document.dispatchEvent(new CustomEvent("builder:created", {
      detail
    }));
  }

  public static attach(childElement: HTMLElement | any, globalSlotPathKey: string): boolean {
    if (!childElement || !globalSlotPathKey) return false;

    const el = childElement.element || childElement;
    if (!(el instanceof HTMLElement)) return false;

    const [targetIdentifier, slotName] = String(globalSlotPathKey).split("~");
    const [targetBuilderId, targetTypeKey] = targetIdentifier.split(":");
    if (!targetBuilderId || !targetTypeKey) return false;

    const targetGlobalKey = `${targetBuilderId}:${targetTypeKey}`;

    DataLogger(DISPLAY_LOG,
      { functionName: "🧩 [ElementCreatedBus]", action: `Attach` },
      { target: targetGlobalKey, slot: `${slotName || "default"}` });

    const attached = DOMTreeMemory.appendToParent(targetGlobalKey, el, slotName || null);

    if (attached) {
      DOMTreeMemory.linkChild(targetGlobalKey, el);
    }
    return attached;
  }

  public static detach(childElement: HTMLElement | any): boolean {
    if (!childElement) return false;
    const el = childElement.element || childElement;
    return DOMTreeMemory.detachElement(el);
  }

  /**
   * 🎛️ RELAY: Saluran interseptor JIT sebelum document.createElement diledakkan
   * TODO: Terima selector dan builderId hantaran DOMRenderer. Intip saku DOMTreeMemory / #nodes internal Builder.
   *       Jika elemen fisik pointer lama ditemukan, RETURN elemen tersebut untuk langsung di-bypass reuse!
   */
  public static relay(selector: string, builderId?: string): HTMLElement | null {
    const globalKey = selector.includes(":") || !builderId ? selector : `${builderId}:${selector}`;
    const cachedItems = DOMTreeMemory.getByGlobalKey(globalKey, "all");
    const latestItem = Array.isArray(cachedItems) ? cachedItems[cachedItems.length - 1] : cachedItems;
    return latestItem?.element || null;
  }

  /**
   * 📡 RECEIVE: Telinga radar pasif yang nangkring seumur hidup aplikasi
   * TODO: Pasang listener global di hulu dokumen untuk menangkap sinyal CustomEvent kelahiran.
   *       Begitu ditangkap, suapkan data records-nya langsung ke lambung pusat DOMTreeMemory.set().
   */
  public static receive(): void {

    DataLogger(DISPLAY_LOG,
      { functionName: "🛰️ [ElementCreatedBus]", action: `Attach` },
      { message: `Radar online listening for birth emissions...` });

    this.listen();
  }

  /**
   * 🛠️ HANDLER: Katup mikro daur hidup manipulasi fisik elemen hidup di RAM
   */
  public static handler(element: HTMLElement, globalKey: string) {
    return {
      attach: () => {
        const attached = DOMTreeMemory.appendToParent(globalKey, element);
        if (attached) {
          DOMTreeMemory.linkChild(globalKey, element);
        }
        const childCount = element.parentElement?.children.length || 0;

        DataLogger(DISPLAY_LOG,
          { functionName: "📌 [ElementCreatedBus]", action: `Handler.attach Stats` },
          { message: `Securing RAM slot for ${globalKey}`, globalKey, attached, childCount, element });

        return attached;
      },
      detach: () => {

        const detached = DOMTreeMemory.detachElement(element);

        DataLogger(DISPLAY_LOG,
          { functionName: "📌 [ElementCreatedBus]", action: `Handler.detach Stats` },
          { message: `Detaching visual wujud for ${globalKey}`, globalKey, detached });

        return detached;
      },
      destroy: () => {

        const detached = DOMTreeMemory.detachElement(element);

        DataLogger(DISPLAY_LOG,
          { functionName: "📌 [ElementCreatedBus]", action: `Handler.destroy Stats` },
          { message: `Total obliteration for ${globalKey}`, globalKey, detached });

        return detached;
      },
      update: (newPayload: any) => {
        DataLogger(DISPLAY_LOG,
          { functionName: "📌 [ElementCreatedBus]", action: `Handler.update` },
          { message: `In-place attribute mutation for ${globalKey}`, globalKey, newPayload });
      }
    }
  }
}

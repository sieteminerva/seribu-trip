
import type { iActionProperty, iBasicNode, iBuilderConfig, iElementProperty } from "../../interface";
import { Builder } from "../Base";

export type InputControlsElementType =
  | "@controls"
  | "@controls>add"
  | "@controls>remove"
  | "@controls>save"
  | "@controls>edit"

export interface iInputControlsConfig extends iBuilderConfig<InputControlsElementType> {

}

export class InputControlsBuilder extends Builder<InputControlsElementType, iInputControlsConfig> {
  readonly builderId = "input-controls";
  readonly name = "input-controls";
  readonly stylesheet: string = "";

  // Data internal model murni meluncur rata berupa array of objects reaktif
  private rowsData: Record<string, any>[] = [];

  constructor(config: Partial<iInputControlsConfig>) {
    super();
    const defaultSelectors: Required<Record<InputControlsElementType, iElementProperty>> = {
      "@controls": { tagName: "div", className: "controls" },
      "@controls>add": { tagName: "button", className: "add", icon: "＋" },
      "@controls>remove": { tagName: "button", className: "remove", icon: "🗑️" },
      "@controls>save": { tagName: "button", className: "save", icon: "☑️" },
      "@controls>edit": { tagName: "button", className: "edit", icon: "🖋️" },
    }

    const defaultConfig: Required<iInputControlsConfig> = {
      themeId: "default",
      namespace: null,
      selectors: defaultSelectors,
      emit: null,
    }

    this.config = this.resolveConfig(defaultConfig, config)
  }


  /**
   * 🧱 2. METODE PREPARE (PENCETAKAN CETAK BIRU STRUKTUR VISUAL AWAL)
   */
  public prepare(content: iActionProperty[], _config: Required<iInputControlsConfig>): HTMLElement {
    // A. Buat elemen container terluar via render bawaan sasis asli Anda
    const container = this.render("@controls", content) as HTMLElement;

    for (const element of content) {
      const control = this.render(`@controls>${element.type}` as InputControlsElementType, element, true);
      container.appendChild(control!);
    }

    return container;
  }

  /**
   * 🧱 3. METODE INITIALIZE (PENDONGKRAK REAKTIVITAS & BINDING PROXY)
   */
  public initialize(_element: HTMLElement, _content: iBasicNode): void {
    this.removeRowLine(_element, 0, this.config)
  }

  /**
   * 🛠️ HELPER INTERNAL 3: AKSI HAPUS BARIS DINAMIS JIT (CRUD DELETE)
   */
  private removeRowLine(rowElement: HTMLElement, index: number, config: any): void {
    const minRows = config.minRows ?? 1;
    if (this.rowsData.length <= minRows) {
      console.warn("⚠️ [InputControlsBuilder]: Minimum row capacity reached.");
      return;
    }

    // A. Angkat wujud fisik visualnya dari bumi layar DOM browser browser
    rowElement.remove();

    // B. Potong antrean data modelnya dari array internal RAM
    this.rowsData.splice(index, 1);

    // TODO: Jalankan proses re-indexing atau pemicu (.clear() / .destroy()) selektif 
    //       pada saku privat #nodes agar nomor urut suffix index "$" tidak melosot bolong!
    console.log(`🗑️ [InputControlsBuilder -> CRUD Delete]: Purged row index ${index}. Active rows remaining: ${this.rowsData.length}`);
  }

  protected template(_typeKey: string, _el: HTMLElement, _payload: any): void {
    // Metode bawaan abstrak yang sengaja kita biarkan pasif, karena perakitan 
    // isi perut layout dinamis dikawal ketat secara linear di dalam compileRowStructure
  }
}

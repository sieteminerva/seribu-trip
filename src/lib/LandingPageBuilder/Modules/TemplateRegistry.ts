export type TemplateHandler<T extends string = string> = (
  typeKey: T,
  element: HTMLElement,
  payload: any,
  selector: any
) => void | Promise<void>;

export class TemplateRegistry {
  // 💡 USULAN 1 AGENT: Gunakan tipe data kontrak yang kaku agar kebal dari sabotase memori
  private static _templates = new Map<string, TemplateHandler<any>>();

  /**
   * Mendaftarkan fungsi template dari luar (Theme / Plugin API)
   */
  public static register(id: string, handler: TemplateHandler<any>): void {
    this._templates.set(id, handler);
  }

  /**
   * Mengosongkan memori token agar terbebas dari kebocoran memori (deactivate loops)
   */
  public static unregister(id: string): void {
    this._templates.delete(id);
    console.log(`[TemplateRegistry] Wiped out cache token: ${id}`);
  }

  /**
   * 🧙‍♂️ THE DYNAMIC CASCADE RESOLVER 
   * Menjaga Inversion of Control: Builder tidak peduli siapa yang merender!
   */
  public static resolve(themeId: string, selectorKey: string, defaultHandler: TemplateHandler<any>): TemplateHandler<any> {
    const primaryKey = `${themeId}${selectorKey}`;

    if (this._templates.has(primaryKey)) {
      console.log(`[Cascade Registry] Custom Theme Override found for: ${primaryKey}`);
      return this._templates.get(primaryKey)!;
    }

    if (this._templates.has(selectorKey)) {
      return this._templates.get(selectorKey)!;
    }

    // Fallback terakhir: Kembalikan fungsi bawaan internal milik Builder itu sendiri
    return defaultHandler;
  }
}

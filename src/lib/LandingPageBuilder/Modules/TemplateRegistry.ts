export type TemplateHandler<T extends string = string> = (
  typeKey: T,
  element: HTMLElement,
  payload: any,
  selector: any
) => void | Promise<void>;


export interface iNodeRecords {
  records: iNodeRecordItem[]
  builderInstance: any;
}

export interface iNodeRecordItem {
  element: HTMLElement,
  raw: any;
  proxy: any
}

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
  public static resolve(themeId: string, selectorKey: string, defaultHandler: TemplateHandler<any> | null): TemplateHandler<any> | null {
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

  // ====================================================
  // 🪐 LANTAI BAWAH: THE CENTRAL LIVE NODES POOL PROXY (MAHKOTA KEJENIUSAN ANDA!)
  // ====================================================
  // nodes template registry
  static #nodes = new Map<string, iNodeRecords>();

  public static get nodes() {
    return {
      has: (builderId: string, key: string): boolean => {
        // 🟢 SINKRON: Lengkapi gerbang detektor has secara legal murni!
        return this.#nodes.has(`${builderId}:${key}`);
      },

      get: (builderId: string, key: string, index: number | "all" = 0): any => {
        const globalStorageKey = `${builderId}:${key}`;
        const mainRecord = this.#nodes.get(globalStorageKey);
        if (!mainRecord || !mainRecord.records || mainRecord.records.length === 0) return null;

        // Jika komponen meminta seluruh barisan elemen saudara (e.g. load(..., "all"))
        if (index === "all") {
          return mainRecord.records;
        }

        // Kembalikan murni 1 elemen fisik spesifik berdasarkan nomor indeks array-nya!
        return mainRecord.records[index] || null;
      },

      set: (builderInstance: any, typeKey: string, element: HTMLElement, payload: any, multiple: boolean, scopeId: string): any => {
        // const selectedBuilder = "product-card"
        // if (builderInstance.builderId === selectedBuilder) console.log({ builder: builderInstance.builderId, method: "this.nodes.set()", entries: this.#nodes.entries() })
        const tElement = element;

        // Kunci penanda dasar Singleton murni bawaan spesifikasi asli Anda
        const globalStorageKey = `${scopeId}:${typeKey}`;
        // ====================================================
        // 🛡️ THE STRICT ARCHITECTURAL MULTIPLE DETECTOR GUARD (BENTENG PERINGATAN ANDA!)
        // ====================================================
        if (this.#nodes.has(globalStorageKey) && !multiple) {
          console.warn(
            `🚨 [Framework Architectural Violation]: Element key "${String(typeKey)}" has already been rendered in builder "${scopeId}"!\n` +
            `Re-rendering a Singleton node is strictly prohibited.\n` +
            `Please use "this.render('${String(typeKey)}', payload, true)" if it is a multiple item or \n` +
            `"this.load('${String(typeKey)}')" instead to retrieve the active live memory pointer.`
          );
          const item = this.#nodes.get(globalStorageKey)?.records[0]
          // Fallback penyelamat: Kembalikan payload proxy singleton lama agar tidak crash!
          return item?.proxy;
        }

        // ====================================================
        // 🪐 MATRIKS IDENTITAS DATA SAUDARA KANDUNG (SIBLING HARMONY)
        // ====================================================
        const rawObj = payload && typeof payload === "object" ? { ...payload } : { value: payload };

        const singleProxyObj = new Proxy(rawObj, {
          set: (target: any, prop: string, payload: any) => {
            target[prop] = payload;

            // Cari kembali boks kembarannya secara spesifik murni berbasis alamat fisik tElement!
            const currentRecord = this.#nodes.get(globalStorageKey);
            if (currentRecord) {
              const recordItem = currentRecord.records.find(rec => rec.element === tElement);
              if (recordItem && typeof currentRecord.builderInstance.template === "function") {
                // Semburkan riasan wajah JIT mikro murni mengunci bodi elemen fisiknya sendiri!
                currentRecord.builderInstance.template(typeKey, recordItem.element, target);
              }
            }
            return true;
          }
        });

        // ====================================================
        // JALUR PUTARAN PERTAMA: INSTANSIASI GUDANG ARRAY AWAL
        // ====================================================

        const newItem: iNodeRecordItem = {
          element: tElement,
          raw: rawObj,
          proxy: singleProxyObj
        };

        // JALUR PUTARAN LANJUTAN: Jika gerbong kunci sudah ada, dorong boks kembaran baru ke list array!
        if (this.#nodes.has(globalStorageKey)) {
          this.#nodes.get(globalStorageKey)!.records.push(newItem);
          return singleProxyObj;
        }

        // JALUR PUTARAN PERTAMA (INITIAL PAINT)
        this.#nodes.set(globalStorageKey, {
          records: [newItem],
          builderInstance: builderInstance
        });

        return singleProxyObj;
      },

      delete: (builderId: string, key: string, index: number | "all"): void => {
        const globalStorageKey = `${builderId}:${key}`;
        if (index === "all") {
          this.#nodes.delete(globalStorageKey);
        } else if (typeof index === "number") {
          const mainRecord = this.#nodes.get(globalStorageKey);
          if (mainRecord && mainRecord.records) {
            // 🟢 FIX SINKRON: Potong murni tepat pada koordinat index, hapus sebanyak 1 item!
            mainRecord.records.splice(index, 1);
          }
        }
      },

      clear: (builderId: string): void => {
        for (const globalKey of this.#nodes.keys()) {
          if (globalKey.startsWith(`${builderId}:`)) {
            this.#nodes.delete(globalKey);
          }
        }
        console.log(`🧹 [TemplateRegistry]: Wiped sync nodes cache for builder ID: "${builderId}"`);
      },

      set2: (builderInstance: any, typeKey: string, element: HTMLElement, payload: any, multiple: boolean, scopeId: string): any => {
        const id = scopeId;
        const globalStorageKey = `${id}:${typeKey}`;
        let tElement = element;

        if (this.#nodes.has(globalStorageKey) && !multiple) {
          const item = this.#nodes.get(globalStorageKey)?.records[0];
          return item?.proxy;
        }

        const rawObj = payload && typeof payload === "object" ? { ...payload } : { value: payload };

        // LAPIS 1: Proxy Data Payload (Urat Nadi Pengunci Data)
        const singleProxyObj = new Proxy(rawObj, {
          set: (target: any, prop: string, value: any) => {
            target[prop] = value;
            const currentRecord = this.#nodes.get(globalStorageKey);
            if (currentRecord) {
              const recordItem = currentRecord.records.find(rec => rec.element === tElement);
              if (recordItem && typeof currentRecord.builderInstance.template === "function") {
                currentRecord.builderInstance.template(typeKey, recordItem.element, target);
              }
            }
            return true;
          }
        });

        // ====================================================
        // 🪐 LAPIS 2: THE REACTIVE DOM PROXY WRAPPER (AKSI MAGIS IMPIAN ANDA!)
        // 100% Aman dari TypeError Illegal Invocation browser!
        // Membungkus elemen dan proxy ke dalam satu kesatuan reaktif yang selalu up-to-date!
        // ====================================================
        const rawNodeItem: iNodeRecordItem = {
          element: tElement,
          raw: rawObj,
          proxy: singleProxyObj
        };

        const smartNodeItemProxy = new Proxy(rawNodeItem, {
          set: (target: iNodeRecordItem, prop: string, newValue: any) => {
            // Jika desainer mencoba mengganti bodi element fisik secara langsung (live hot-swap node)
            if (prop === "element" && newValue instanceof HTMLElement && target.element !== newValue) {
              console.log(`🔄 [DOM Mirroring]: Live hot-swapping element node for key "${typeKey}"`);

              // Lakukan penukaran visual secara fisik di layar browser secara otomatis!
              if (target.element.parentElement) {
                target.element.replaceWith(newValue);
              }

              target.element = newValue; // Update penunjuk alamat memori terbarunya

              // Picu ulang hidrasi template visual JIT agar menyerap gaya kosmetik terbaru!
              const currentRecord = this.#nodes.get(globalStorageKey);
              if (currentRecord && typeof currentRecord.builderInstance.template === "function") {
                currentRecord.builderInstance.template(typeKey, target.element, target.proxy);
              }
              return true;
            }

            // Izinkan mutasi untuk properti lainnya (raw atau proxy)
            (target as any)[prop] = newValue;
            return true;
          }
        });

        if (this.#nodes.has(globalStorageKey)) {
          this.#nodes.get(globalStorageKey)!.records.push(smartNodeItemProxy);
          return singleProxyObj;
        }

        this.#nodes.set(globalStorageKey, {
          records: [smartNodeItemProxy],
          builderInstance: builderInstance
        });

        return singleProxyObj;
      },
    };
  }
}

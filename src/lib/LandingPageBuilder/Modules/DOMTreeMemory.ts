import { GLOBAL_DISPLAY_LOG, type iNodeRecordItem, type iNodeRecords } from "../interface";
import { DataLogger } from "../Utils/DataLogger";

const DISPLAY_LOG = GLOBAL_DISPLAY_LOG;

export class DOMTreeMemory {
  static #nodes = new Map<string, iNodeRecords>();
  public static activeParentScopeKey: string | null = null;

  /**
   * 👑 RECEIVE LIVE BORN EVENT (GERBANG JEMBATAN LANGSUNG KARYA DEWA ANDA!)
   * Kebal 100% dari ranjau kebutaan DocumentFragment browser!
   * @param detail Paket metadata silsilah orisinal hantaran langsung dari rahim BuilderBase
   * @param childElement Elemen fisik asli yang baru saja dilahirkan JIT di level bawah
   */
  public static receiveLiveBornEvent(detail: { relations: any; raw: any; proxy: any; builderId?: string; key?: string; instanceId?: string; element?: HTMLElement }, childElement: HTMLElement): void {
    const { relations, raw, proxy, builderId, key, instanceId } = detail;
    if (!relations) return;

    const globalStorageKey = this.resolveKey(relations);

    // 1. Eksekusi pengisian data reaktif satu pintu via .set() wrapper kebanggaan Anda!
    this.set(relations, childElement, raw, false);

    // Update manual alamat proxy asli milik anak ke dalam records di level pusat global
    const globalBox = this.#nodes.get(globalStorageKey);
    if (globalBox && globalBox.records.length > 0) {
      const centralItem = globalBox.records[globalBox.records.length - 1];
      if (centralItem) centralItem.payload = proxy; // Kunci kedaulatan proxy hidup!
    }

    const storedEntries = this.#nodes.get(globalStorageKey)?.records?.length || 0;
    const elementDescriptor = childElement instanceof HTMLElement
      ? `${childElement.tagName.toLowerCase()}${childElement.id ? "#" + childElement.id : ""}${childElement.className ? "." + String(childElement.className).trim().split(/\s+/).filter(Boolean).join(".") : ""}`
      : "unknown-element";

    DataLogger(DISPLAY_LOG,
      { functionName: "🧭 [DOMTreeMemory]", action: `Store` },
      { builder: builderId || "unknown", key: key, instance: instanceId, globalKey: globalStorageKey, entries: storedEntries + " item(s)", element: elementDescriptor });

    // 2. ⚡ REAL-TIME GRAPH WELDING: Ambil alamat bapak klan statisnya
    const parentGlobalKey = relations.parent;

    if (parentGlobalKey && this.#nodes.has(parentGlobalKey)) {
      const parentBox = this.#nodes.get(parentGlobalKey);
      const parentItem = parentBox?.records[parentBox.records.length - 1];

      if (parentItem && parentItem.relations) {
        if (!parentItem.relations.children) parentItem.relations.children = [];
        if (!parentItem.relations.children.includes(globalStorageKey)) {
          parentItem.relations.children.push(globalStorageKey);

          DataLogger(DISPLAY_LOG,
            { functionName: "📌 [JIT Direct Channel]", action: `Connected` },
            { message: `[ -> ]: Fast-linked dynamic child "${globalStorageKey}" into static parent "${parentGlobalKey}"` });

        }
      }
    }
  }

  private static resolveKey(tree: iNodeRecordItem["relations"]) {
    if (!tree?.scope || !tree?.key) return "global:unknown";
    const key = [tree?.scope, tree?.key].join(":");
    return key;
  }

  public static resolveGlobalKey(tree: Pick<NonNullable<iNodeRecordItem["relations"]>, "scope" | "key"> | null | undefined): string {
    return this.resolveKey(tree as any);
  }

  public static hasGlobalKey(globalKey: string): boolean {
    return this.#nodes.has(globalKey);
  }

  public static getByGlobalKey(globalKey: string, index: number | "all" = 0): any {
    const mainRecord = this.#nodes.get(globalKey);
    if (!mainRecord || !mainRecord.records || mainRecord.records.length === 0) return null;
    if (index === "all") return mainRecord.records;
    return mainRecord.records[index] || null;
  }

  public static findGlobalKeyByElement(element: HTMLElement): string | null {
    for (const [globalKey, record] of this.#nodes.entries()) {
      if (record.records.some(item => item.element === element)) {
        return globalKey;
      }
    }
    return null;
  }

  public static linkChild(parentGlobalKey: string, childElement: HTMLElement): boolean {
    const childGlobalKey = this.findGlobalKeyByElement(childElement);
    if (!childGlobalKey) return false;

    const parentRecords = this.getByGlobalKey(parentGlobalKey, "all");
    const parentRecord = Array.isArray(parentRecords) ? parentRecords[parentRecords.length - 1] : parentRecords;
    const childRecords = this.getByGlobalKey(childGlobalKey, "all");
    const childRecord = Array.isArray(childRecords) ? childRecords[childRecords.length - 1] : childRecords;

    if (!parentRecord?.relations || !childRecord?.relations) return false;

    const previousParentKey = childRecord.relations.parent;
    if (previousParentKey && previousParentKey !== parentGlobalKey) {
      const previousParentRecords = this.getByGlobalKey(previousParentKey, "all");
      const previousParentRecord = Array.isArray(previousParentRecords)
        ? previousParentRecords[previousParentRecords.length - 1]
        : previousParentRecords;

      if (previousParentRecord?.relations?.children) {
        previousParentRecord.relations.children = previousParentRecord.relations.children.filter((key: string) => key !== childGlobalKey);
      }
    }

    childRecord.relations.parent = parentGlobalKey;
    if (!Array.isArray(parentRecord.relations.children)) parentRecord.relations.children = [];
    if (!parentRecord.relations.children.includes(childGlobalKey)) {
      parentRecord.relations.children.push(childGlobalKey);
    }

    return true;
  }

  public static appendToParent(globalKey: string, childElement: HTMLElement, slotName?: string | null): boolean {
    const parentRecords = this.getByGlobalKey(globalKey, "all");
    const parentRecord = Array.isArray(parentRecords) ? parentRecords[parentRecords.length - 1] : parentRecords;
    if (!parentRecord || !parentRecord.element || !(parentRecord.element instanceof HTMLElement)) return false;

    const parentElement = parentRecord.element as HTMLElement;
    const targetSlot = slotName
      ? (parentElement.getAttribute("data-slot") === slotName
        ? parentElement
        : parentElement.querySelector(`[data-slot="${slotName}"]`) as HTMLElement | null)
      : parentElement;

    const targetElement = targetSlot || parentElement;
    targetElement.appendChild(childElement);

    DataLogger(DISPLAY_LOG,
      { functionName: "🧭 [DOMTreeMemory]", action: `Attach` },
      { parent: globalKey, slot: slotName || "default", child: `${this.findGlobalKeyByElement(childElement) || childElement.tagName.toLowerCase()}`, childCount: targetElement.children.length });

    return true;
  }

  public static detachElement(childElement: HTMLElement | string): boolean {
    const element = typeof childElement === "string"
      ? (Array.isArray(this.getByGlobalKey(childElement, "all"))
        ? (this.getByGlobalKey(childElement, "all") as any[]).slice(-1)[0]?.element
        : this.getByGlobalKey(childElement)?.element)
      : childElement;

    if (!(element instanceof HTMLElement)) return false;
    if (element.parentElement) {

      DataLogger(DISPLAY_LOG,
        { functionName: "🧭 [DOMTreeMemory]", action: `Detach` },
        {
          element: `${element.tagName.toLowerCase()}${element.id ? "#" + element.id : ""}`,
          parent: `${element.parentElement.tagName.toLowerCase()}`
        });

      element.remove();
      return true;
    }

    return false;
  }

  public static has(tree: iNodeRecordItem["relations"]): boolean {
    const globalStorageKey = this.resolveKey(tree);
    return this.#nodes.has(globalStorageKey);
  }

  public static get(tree: iNodeRecordItem["relations"], index: number | "all" = 0): any {
    const globalStorageKey = this.resolveKey(tree);
    const mainRecord = this.#nodes.get(globalStorageKey);
    if (!mainRecord || !mainRecord.records || mainRecord.records.length === 0) return null;

    // Jika komponen meminta seluruh barisan elemen saudara (e.g. load(..., "all"))
    if (index === "all") {
      return mainRecord.records;
    }

    // Kembalikan murni 1 elemen fisik spesifik berdasarkan nomor indeks array-nya!
    return mainRecord.records[index] || null;
  }

  public static getAll() {
    return this.#nodes;
  }

  /**
   * 🚀 SYSTEM SLIM SET: Murni hanya mengunci pembuatan Proxy reaktif & Custom Event Bubbling!
   */
  public static set(tree: iNodeRecordItem["relations"], element: HTMLElement, payload: any, multiple: boolean): any {
    const globalStorageKey = this.resolveKey(tree);

    // const selectedBuilder = "modal"
    // if (builderId === selectedBuilder) console.log({ builder: builderId, method: `this.nodes.set(${builderId}, ${tree?.key})`, entries: this.#nodes.entries() })
    // console.log({ method: `this.nodes.set(${tree?.scope}, ${tree?.key})`, entries: this.#nodes.entries() })
    const tElement = element;

    // Kunci penanda dasar Singleton murni bawaan spesifikasi asli Anda
    // ====================================================
    // 🛡️ THE STRICT ARCHITECTURAL MULTIPLE DETECTOR GUARD (BENTENG PERINGATAN ANDA!)
    // ====================================================
    if (this.#nodes.has(globalStorageKey) && !multiple) {
      const existingEntries = this.#nodes.get(globalStorageKey)?.records?.length || 0;

      console.warn(
        `🚨 [Framework Architectural Violation]: Element key "${String(tree?.key)}" has already been rendered in builder "${globalStorageKey}"!\n` +
        `Re-rendering a Singleton node is strictly prohibited.\n` +
        `Please use "this.render('${String(tree?.key)}', payload, true)" if it is a multiple item or \n` +
        `"this.load('${String(tree?.key)}')" instead to retrieve the active live memory pointer.`
      );

      DataLogger(DISPLAY_LOG,
        { functionName: "🧭 [DOMTreeMemory]", action: `Set Skipped` },
        {
          globalKey: globalStorageKey, entries: existingEntries + " item(s)", multiple
        });

      const item = this.#nodes.get(globalStorageKey)?.records[0]
      // Fallback penyelamat: Kembalikan payload proxy singleton lama agar tidak crash!
      return item?.payload;
    }



    // ====================================================
    // 🪐 MATRIKS IDENTITAS DATA SAUDARA KANDUNG (SIBLING HARMONY)
    // ====================================================
    const rawObj = payload && typeof payload === "object" ? { ...payload } : { value: payload };

    const singleProxyObj = new Proxy(rawObj, {
      set: (target: any, prop: string, value: any) => {
        target[prop] = value;

        // Cukup letupkan sinyal event perubahan secara native lewat DOM Custom Event bawaan browser!
        // Sangat clean, decoupled, berkelas dunia, dan otomatis didengar oleh BuilderBase!
        tElement.dispatchEvent(new CustomEvent("state:mutation", {
          bubbles: true,
          detail: { typeKey: tree?.key, updatedTarget: target }
        }));

        return true;
      }
    });

    // ====================================================
    // JALUR PUTARAN PERTAMA: INSTANSIASI GUDANG ARRAY AWAL
    // ====================================================
    const newItem: iNodeRecordItem = {
      element,
      relations: tree,
      // raw: rawObj,
      // proxy: singleProxyObj
      key: tree?.key as string,
      payload: singleProxyObj
    };
    // GraphMetadata.attach(globalStorageKey, typeKey, tElement,  singleProxyObj);

    // JALUR PUTARAN LANJUTAN: Jika gerbong kunci sudah ada, dorong boks kembaran baru ke list array!
    if (this.#nodes.has(globalStorageKey)) {
      this.#nodes.get(globalStorageKey)!.records.push(newItem);

      DataLogger(DISPLAY_LOG,
        { functionName: "🧭 [DOMTreeMemory]", action: `Set Append` },
        { globalKey: globalStorageKey, entries: `${this.#nodes.get(globalStorageKey)!.records.length} item(s)`, multiple });

      return singleProxyObj;
    }

    // JALUR PUTARAN PERTAMA (INITIAL PAINT)
    this.#nodes.set(globalStorageKey, { records: [newItem] });

    DataLogger(DISPLAY_LOG,
      { functionName: "🧭 [DOMTreeMemory]", action: `Set Create` },
      { globalKey: globalStorageKey, entries: 1 + " item", multiple });
    // console.log(this.#nodes.entries())
    return singleProxyObj;
  }

  /**
   * @example
   * ```text
   * [EKSEKUSI: .delete(tree, 0)]
   *     │
   *     ├──► 1. Temukan Kunci Target: "input:inst-input:@field"
   *     │
   *     ├──► 2. Masuk ke Array Records index [0] (Nama Lengkap)
   *     │
   *     ├──► 3. Periksa Anak internal di bawahnya ──► Kosong (Children: [])
   *     │
   *     ├──► 4. Cabut Kulit Fisik DOM ──► inputElement.remove() dari layar HP user!
   *     │
   *     └──► 5. POTONG ARRAY UTAMAA (FIX SINKRON ANDA!)
   *             mainRecord.records.splice(0, 1);
   * ```
   * @param tree 
   * @param index 
   */
  public static delete(tree: iNodeRecordItem["relations"], index: number | "all"): void {
    const globalStorageKey = this.resolveKey(tree);
    if (globalStorageKey.includes("modal")) console.log(this.#nodes.entries());

    const mainRecord = this.#nodes.get(globalStorageKey);
    if (!mainRecord) return;

    if (index === "all") {

      // Jika kantong part kunci ini memegang anak-anak internal (e.g. "@form>fields" memegang input)
      if (mainRecord && mainRecord.records) {
        mainRecord.records.forEach((item) => {
          // Picu pemusnahan massal untuk anak internal di bawahnya sebersih-bersihnya
          if (item.relations?.children && item.relations.children.length > 0) {
            item.relations.children.forEach(childKey => this._removeRecursive(childKey));
          }
          // Cabut fisik dari DOM
          if (item.element && typeof item.element.remove === "function") item.element.remove();
        });
      }

      this.#nodes.delete(globalStorageKey);
    }
    else if (typeof index === "number") {
      const mainRecord = this.#nodes.get(globalStorageKey);
      if (mainRecord && mainRecord.records) {
        const targetItem = mainRecord.records[index];

        // Amputasi anak internal milik item indeks spesifik ini jika ada
        if (targetItem && targetItem.relations?.children && targetItem.relations.children.length > 0) {
          targetItem.relations.children.forEach(childKey => this._removeRecursive(childKey));
        }

        // Cabut fisik DOM satuan tersebut dari layar browser
        if (targetItem?.element && typeof targetItem.element.remove === "function") {
          targetItem.element.remove();
        }

        // 🟢 FIX SINKRON ANDA: Potong murni tepat pada koordinat index array records!
        mainRecord.records.splice(index, 1);
      }
    }
  }

  /**
   * @example
   * ```text
   * ┌────────────────────────────────────────────────────────┐
   * │ modal:inst-modal:@container                            │
   * │ └── relations.children: ["modal:inst-modal:@modal"]    │
   * └────────────────────────────────────────────────────────┘
   *                            │
   *                            ▼
   * ┌────────────────────────────────────────────────────────┐
   * │ modal:inst-modal:@modal                                │
   * │ └── relations.children: ["modal:inst-modal:@modal>body"]
   * └────────────────────────────────────────────────────────┘
   *                            │
   *                            ▼
   * ┌────────────────────────────────────────────────────────┐
   * │ modal:inst-modal:@modal>body                           │
   * │ └── relations.children: ["form:inst-form:@form"]       │ <── 🔗 Jembatan Adopsi Lintas Builder!
   * └────────────────────────────────────────────────────────┘
   *                            │
   *                            ▼
   * ┌────────────────────────────────────────────────────────┐
   * │ form:inst-form:@form                                   │
   * │ └── relations.children: ["form:inst-form:@form>fields"]│
   * └────────────────────────────────────────────────────────┘
   *                            │
   *                            ▼
   * ┌────────────────────────────────────────────────────────┐
   * │ form:inst-form:@form>fields                            │
   * │ └── relations.children: [                              │
   * │       "input:inst-input:@field:0",                     │ <── Target Amputasi .delete(tree, 0)
   * │       "input:inst-input:@field:1",                     │
   * │       ... merembet linear sampai indeks 14             │
   * │     ]                                                  │
   * └────────────────────────────────────────────────────────┘
   * ```
   * @param tree 
   */
  public static clear(tree?: iNodeRecordItem["relations"]): void {
    if (!tree || !tree.scope) return;

    const targetScopeId = tree.scope; // e.g. "modal:inst-modal"
    const prefixFilter = `${targetScopeId}:`;

    console.log(`🧼 [DOMTreeMemory -> clear]: Executing atomic mass liquidation for scope: "${targetScopeId}"`);

    for (const [globalKey, record] of this.#nodes.entries()) {
      // Saring murni hanya kunci milik kerajaan instansi scopeId ini saja!
      if (globalKey.startsWith(prefixFilter)) {

        record.records.forEach((item) => {
          // 🟢 REKURSIF GRAF ANDA: Jalankan pengurasan massal berantai ke seluruh anak cucu lintas builder!
          if (item.relations?.children && item.relations.children.length > 0) {
            item.relations.children.forEach((childGlobalKey) => {
              this._removeRecursive(childGlobalKey);
            });
          }
          // Cabut bodi fisik dirinya sendiri dari layar bodi browser
          if (item.element && typeof item.element.remove === "function") {
            item.element.remove();
          }
        });

        // Depak total nama kuncinya dari dalam Map pusat RAM global
        this.#nodes.delete(globalKey);
      }
    }
  }

  /**
   * 👑 PINTU 1: THE SMART AUTOMATED RESTORE ENGINE (PENGENDALIL AUTOMATIC OVERWRITE)
   * Cerdas mendeteksi perubahan payload dan sanggup menyiram ulang part komponen yang cacat!
   */
  public static restore(tree: iNodeRecordItem["relations"], incomingPayload: any, builderInstance: any): HTMLElement | null {
    const globalStorageKey = this.resolveKey(tree);
    const mainRecord = this.#nodes.get(globalStorageKey);
    if (!mainRecord || !mainRecord.records || mainRecord.records.length === 0) return null;

    const cachedItem = mainRecord.records[mainRecord.records.length - 1];
    if (!cachedItem || !cachedItem.element) return null;

    // EVALUASI PAYLOAD: Bandingkan alamat referensi memori raw target asli Anda
    const incomingRaw = incomingPayload && typeof incomingPayload === "object" ? incomingPayload : { value: incomingPayload };

    // ====================================================
    // 💥 SKENARIO C: PAYLOAD BERUBAH BARU (DETONASI FULL OVERWRITE!)
    // Jika data server Sheets berubah, bantai seluruh silsilah koloni lama dari RAM 
    // lewat fungsi .delete() bawaan agar lantai memori steril untuk proses cetak ulang!
    // ====================================================
    if (cachedItem.payload !== incomingRaw && JSON.stringify(cachedItem.payload) !== JSON.stringify(incomingRaw)) {
      console.log(`🔄 [DOMTreeMemory -> Overwrite]: Data payload mutated for "${globalStorageKey}". Triggering deep silsilah deletion.`);
      this.delete(tree, "all"); // Amputasi total seketurunannya dari RAM pusat!
      return null; // Mengembalikan null agar Base Class melakukan pemicuan rendering fresh dari awal
    }

    console.log(`🚀 [DOMTreeMemory -> HIT]: Restoring graph structures for scope: "${globalStorageKey}"`);

    // ====================================================
    // 💥 SKENARIO B: REKONEKSI & PART RE-HYDRATION OVERWRITE
    // Merayap turun memastikan seluruh bodi anak cucu masih menempel di RAM,
    // jika ada part yang copot, otomatis disiram re-render mikro!
    // ====================================================
    this._hydrateRecursive(cachedItem, builderInstance);

    return cachedItem.element;
  }

  /**
   * 🧙‍♂️ PRIVATE SNIPER OBLITERATOR (ASINKRONUS / SINKRONUS RECURSIVE PURGE)
   * Alat intelijen dalam internal Map untuk menyapu resik silsilah anak cucu secara rekursif murni di RAM!
   */
  private static _removeRecursive(nodeGlobalKey: string): void {
    const targetRecord = this.#nodes.get(nodeGlobalKey);
    if (!targetRecord) return;

    // Turun menyisir ke lantai bawah secara rekursif jika anak ini ternyata memiliki cucu lagi di bawahnya!
    targetRecord.records.forEach((item) => {
      if (item.relations?.children && item.relations.children.length > 0) {
        item.relations.children.forEach((grandChildKey) => {
          this._removeRecursive(grandChildKey); // Rekursif ke cucu di bawahnya!
        });
      }
      // Cabut elemen fisik DOM-nya dari bodi browser
      if (item.element && typeof item.element.remove === "function") {
        item.element.remove();
      }
    });

    // Lenyapkan total catatan koordinat kuncinya dari Map pusat global (0B leak secured!)
    this.#nodes.delete(nodeGlobalKey);
  }



  /**
  * 🧙‍♂️ INTERNAL RECURSIVE RE-HYDRATOR (PENGENDALIL PART OVERWRITE YANG HILANG)
  */
  private static _hydrateRecursive(parentRecordItem: iNodeRecordItem, builderInstance: any): void {
    if (!parentRecordItem.relations?.children) return;

    const childrenKeys = parentRecordItem.relations.children;

    childrenKeys.forEach((childGlobalKey) => {
      const childRecord = this.#nodes.get(childGlobalKey);

      // 🟢 DETEKSI PART HILANG: Jika part anak sempat terhapus dari Map RAM akibat manipulasi liar luar
      if (!childRecord || !childRecord.records || childRecord.records.length === 0) {
        console.warn(`⚠️ [Part Overwrite Check]: Detected broken child node "${childGlobalKey}". Triggering targeted re-hydration.`);

        if (builderInstance && typeof builderInstance.template === "function" && parentRecordItem.relations) {
          // Suntikkan dan siram ulang visual part yang hilang secara JIT tepat sasaran!
          builderInstance.template(parentRecordItem.relations.key, parentRecordItem.element, parentRecordItem.payload);
        }
        return;
      }

      const childRecordItem = childRecord.records[childRecord.records.length - 1];
      if (!childRecordItem || !childRecordItem.element) return;

      // Jalankan rekoneksi fisik DOM ke dalam slot bapaknya seutuhnya
      if (parentRecordItem.element && childRecordItem.element) {
        if (!parentRecordItem.element.contains(childRecordItem.element)) {
          parentRecordItem.element.appendChild(childRecordItem.element);
        }
      }

      // Merangkak turun secara rekursif mengawal kesehatan silsilah cucu di lantai bawah
      this._hydrateRecursive(childRecordItem, builderInstance);
    });
  }


}

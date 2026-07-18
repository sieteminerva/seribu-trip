import type { iBasicNode, iBuilderRegistry, iPageMetaReport } from "../interface";


export interface iInjectionRule {
  selector: string;     // Selektor target (misal: "p.eyebrow", "h2.title", "img")
  inputType?: string;   // Tipe input form (default: "text")
}

export class NodeTransformer {

  public static safeCloneNode<T extends iBasicNode | iBasicNode[]>(nodes: T): T {
    // 1. Pengaman dasar jika payload kosong polos
    if (!nodes) return nodes;

    // 2. Mesin pengklon internal terisolasi (Deep Copy Core Logic)
    const cloneItem = (item: any): any => {
      if (!item || typeof item !== "object") return item;
      if (item instanceof HTMLElement) return item; // Pertahankan referensi elemen fisik browser

      if (Array.isArray(item)) {
        return item.map(cloneItem);
      }

      const clonedObj: any = {};
      Object.keys(item).forEach((key) => {
        const val = item[key];
        // JALUR PENYELAMAT FUNGSIONAL: Amankan fungsi hidup agar tidak dihabisi browser!
        if (typeof val === "function") {
          clonedObj[key] = val;
        } else {
          clonedObj[key] = cloneItem(val);
        }
      });
      return clonedObj;
    };

    // ====================================================
    // 💡 DETEKSI POLIMORFIK ELEGAN (SOLUSI MUTLAK ANDA!)
    // ====================================================
    if (Array.isArray(nodes)) {
      // Jika input berupa array, eksekusi map murni
      return nodes.map(cloneItem) as unknown as T;
    }

    // Jika input berupa objek tunggal, langsung tembak masuk ke mesin pengklon tunggal!
    return cloneItem(nodes) as T;
  }

  public static resolveContentNode(nodeObj: iBasicNode): any {
    const selectorKey = Object.keys(nodeObj).find(o => o.includes('.') || o.includes("#"))
    const rawPayload = nodeObj[selectorKey as string]

    // JEMBATAN OTOMATIS: Deteksi apakah block menggunakan format ramah pemula
    if (rawPayload || typeof rawPayload === "object" || rawPayload instanceof HTMLElement) {
      return nodeObj;
    }

    const tagName = nodeObj.tagName || "div";
    const idToken = nodeObj.id ? `#${nodeObj.id.trim()}` : "";
    const classToken = nodeObj.className ? `.${nodeObj.className.trim().replace(/\s+/g, '.')}` : "";

    const generatedKey = `${tagName}${idToken}${classToken}`;
    const result: any = { [generatedKey]: {} };
    const innerBlock = result[generatedKey];

    // 1. Salin properti operasional utama jika ada
    if (nodeObj.builder) innerBlock.builder = nodeObj.builder;
    if (nodeObj.onCreated) innerBlock.onCreated = nodeObj.onCreated;
    if (nodeObj.onDestroy) innerBlock.onDestroy = nodeObj.onDestroy;
    if (nodeObj.isRoot !== undefined) innerBlock.isRoot = nodeObj.isRoot;
    if (nodeObj._field) innerBlock._field = nodeObj._field;

    const extractedAttrs = { ...(nodeObj.attrs || {}) };
    // 2. Kumpulkan semua atribut kustom (seperti src, href, alt) selevel tag dasar
    const reservedKeys = ['tag', 'tagName', 'id', 'className', 'builder', 'content', 'onCreated', 'onDestroy', 'attrs', 'isRoot'];

    Object.keys(nodeObj).forEach(key => {
      const isSystemPrivateProperty = key.startsWith("_");
      const isReserved = reservedKeys.includes(key)
      if (!isReserved && !isSystemPrivateProperty) {
        extractedAttrs[key] = nodeObj[key];
      }
    });

    if (Object.keys(extractedAttrs).length > 0) {
      innerBlock.attrs = extractedAttrs;
    }

    // 3. PERBAIKAN LOGIKA: Proses Konversi Konten secara Selektif
    if (nodeObj.content !== undefined) {
      const payload = nodeObj.content;

      if (payload instanceof HTMLElement || typeof payload === "string") {
        // Jika berupa HTML element hidup atau teks mentah
        innerBlock.content = payload;
      } else if (nodeObj.builder) {
        // 💡 FIX: Jika objek saat ini memiliki properti 'builder', 
        // JANGAN LAKUKAN KONVERSI REKURSIF pada content-nya! Biarkan payload data aslinya lewat secara utuh.
        innerBlock.content = payload;
      } else if (Array.isArray(payload)) {
        // Jika berupa array berisi anak-anak layout (iBasicNode[])
        const childLayoutObj: any = {};
        payload.forEach((childItem, index) => {
          const resolvedChild = NodeTransformer.resolveContentNode(childItem as iBasicNode);
          const childKey = Object.keys(resolvedChild)[0];
          childLayoutObj[`${childKey}$child-${index}`] = resolvedChild[childKey];
        });
        innerBlock.content = childLayoutObj;
      } else if (typeof payload === "object" && payload !== null) {
        // Jika berupa objek tata letak standar tunggal tanpa builder
        innerBlock.content = NodeTransformer.resolveContentNode(payload);
      }
    }

    return result;
  }

  /**
  * 🧙‍♂️ ABAKADABRA: Menyisir iBasicNode[] visual secara rekursif, menerapkan aturan selektor,
  * menerapkan algoritma fallback variabel, dan LANGSUNG memutahkan skema Form Builder (Categorized Form Group).
  */
  public static toFormNode(nodes: iBasicNode[], rules: iInjectionRule[]): any {
    const formGroupsMap = new Map<string, any[]>();

    // Jalankan fungsi rekursif hibrida terpaduss
    this.deepExtractAndBuildForm(nodes, "generic", rules, formGroupsMap);

    // Bungkus seluruh field yang terkumpul ke dalam susunan Fieldset Form Builderssss
    const finalizedFormSchema: any[] = [];
    formGroupsMap.forEach((fields, categoryName) => {

      finalizedFormSchema.push({

        legend: `Panel: ${categoryName.toUpperCase()}`,
        className: `segment group-${categoryName}`,
        group: fields

      });
    });

    return finalizedFormSchema;
  }


  public static getBuilderNode(nodes: iBasicNode[] | iBasicNode, name: string, visited = new Set()): iBasicNode | undefined {
    // 1. Validasi tipe data: abaikan jika bukan object atau null
    if (typeof nodes !== 'object' || nodes === null) {
      return undefined;
    }

    // 2. Cegah Circular Reference
    if (visited.has(nodes)) {
      return undefined;
    }

    // Tandai object ini sebagai 'sudah dikunjungi'
    visited.add(nodes);

    // 3. Langsung kembalikan jika nodes itu sendiri adalah builder yang dicari
    if ('builder' in nodes && (nodes as any).builder === name) {
      return nodes;
    }

    // 4. Proses jika nodes berbentuk Array
    if (Array.isArray(nodes)) {
      for (const item of nodes) {
        const found = NodeTransformer.getBuilderNode(item, name, visited);
        if (found) return found; // Jika ketemu, langsung return
      }
    }
    // 5. Proses jika nodes berbentuk Object (nested)
    else {
      for (const key in nodes) {
        if (Object.prototype.hasOwnProperty.call(nodes, key)) {
          const found = NodeTransformer.getBuilderNode((nodes as any)[key], name, visited);
          if (found) return found; // Jika ketemu, langsung return
        }
      }
    }

    return undefined;
  }



  /**
 * 🧙‍♂️ GLOBAL INTROSPECTOR: Scans iBasicNode or iBasicNode[] in a single-pass loop
 * and returns a highly detailed structural metadata manifest report.
 */
  public static scanMetaNodes(pages: iBasicNode | iBasicNode[]): iPageMetaReport {
    const isArray = Array.isArray(pages);
    const nodesArray = isArray ? (pages as iBasicNode[]) : [pages as iBasicNode];

    // Inisialisasi struktur dasar laporan meta awal
    const report: iPageMetaReport = {
      isArray,
      totalSections: 0,
      hasComponent: {
        carousel: { active: false, container: "", count: 0, instances: [] },
        accordion: { active: false, container: "", count: 0, instances: [] },
        form: { active: false, container: "", count: 0, instances: [] },
        "pricing-card": { active: false, container: "", count: 0, instances: [] },
        masonry: { active: false, container: "", count: 0, instances: [] },
        section: { active: false, container: "", count: 0, instances: [] }
      },
      timelinePaths: []
    };

    // Jalankan mesin pemindai rekursif tunggal
    this._executeDeepInspection(nodesArray, "root", report);

    for (const key in report.hasComponent) {
      if (report.hasComponent.hasOwnProperty(key) && !report.hasComponent[key as keyof iBuilderRegistry]?.active) {
        delete report.hasComponent[key as keyof iBuilderRegistry]
      }
    }

    return report;
  }



  private static deepExtractAndBuildForm(
    items: any,
    currentGroupName: string,
    rules: iInjectionRule[],
    formGroupsMap: Map<string, any[]>
  ) {
    if (!items) return;
    const itemsArray = Array.isArray(items) ? items : [items];

    itemsArray.forEach((node: any) => {
      // Perbarui nama group-nya secara dinamis jika ada property 'name'
      let activeGroupName = currentGroupName;
      if (node.name && typeof node.name === "string") {
        activeGroupName = this._sanitizeKey(node.name);
      }

      let isFieldProcessed = false;

      // ==========================================
      // JALUR 1: MANUAL OVERRIDE BYPASS (Kasta Tertinggi 👑)
      // ==========================================
      if (node._field && typeof node._field === "string" && node._field.trim().startsWith("@")) {
        const rawFieldValue = node._field.trim();
        const [rawGroupKey, explicitInputType = "text"] = rawFieldValue.split("~");
        const [explicitGroupName, explicitFieldKey] = rawGroupKey.slice(1).split(":");

        if (explicitGroupName && explicitFieldKey) {
          const finalGroup = this._sanitizeKey(explicitGroupName);

          if (!formGroupsMap.has(finalGroup)) formGroupsMap.set(finalGroup, []);

          formGroupsMap.get(finalGroup)!.push({
            type: node.builder ? "textarea" : explicitInputType,
            id: `admin-field-${finalGroup}-${explicitFieldKey}`,
            name: `${finalGroup}_${explicitFieldKey}`,
            title: `Sunting ${explicitFieldKey.replace(/_([a-z])/g, ' $1').toUpperCase()}`,
            value: this._extractNodeValue(node),
            config: {
              useLabel: true,
              ...(node.builder ? { info: `Manual Override - Component: ${node.builder}` } : { info: "Kunci Manual Override Aktif" })
            }
          });

          // Tandai bahwa elemen ini sudah diproses lewat jalur manual, jangan izinkan injectionRules menyentuhnya!
          isFieldProcessed = true;
        }
      }

      // ==========================================
      // JALUR 2: AUTOMATIC INJECTION RULES (Smart Default Fallback 🤖)
      // ==========================================
      if (!isFieldProcessed) {
        rules.forEach((rule) => {
          if (this._matchSelector(node, rule.selector)) {
            const fieldKey = this._generateFallbackFieldKey(node);
            const formInputType = rule.inputType || "text";

            if (!formGroupsMap.has(activeGroupName)) {
              formGroupsMap.set(activeGroupName, []);
            }

            formGroupsMap.get(activeGroupName)!.push({
              type: node.builder ? "textarea" : formInputType,
              id: `admin-field-${activeGroupName}-${fieldKey}`,
              name: `${activeGroupName}_${fieldKey}`,
              title: `Sunting ${fieldKey.replace(/_([a-z])/g, ' $1').toUpperCase()}`,
              value: this._extractNodeValue(node),
              config: {
                useLabel: true,
                ...(node.builder ? { info: `Auto Generated - Component: ${node.builder}` } : {})
              }
            });
          }
        });
      }

      // 3. Telusuri sub-layout di dalam properti 'content' secara rekursif
      if (node.content && typeof node.content === "object" && !(node.content instanceof HTMLElement)) {
        this.deepExtractAndBuildForm(node.content, activeGroupName, rules, formGroupsMap);
      }

      // 4. Dukung deteksi rekursif untuk Advanced Mode (String Selectors)
      Object.keys(node).forEach(key => {
        if ((key.includes('.') || key.includes('#')) && typeof node[key] === "object") {
          this.deepExtractAndBuildForm(node[key], activeGroupName, rules, formGroupsMap);
        }
      });
    });
  }

  /**
   * Helper: Mengekstrak isi konten secara aman dan melakukan stringify jika mendeteksi array/object data
   */
  private static _extractNodeValue(node: any): any {
    if (typeof node.content === "object" && node.content !== null && !(node.content instanceof HTMLElement)) {
      return JSON.stringify(node.content, null, 2);
    }
    return node.content;
  }

  private static _matchSelector(node: any, selector: string): boolean {
    const match = selector.match(/^([a-z0-9]+)?(?:\.([a-z0-9_-]+))?$/i);
    if (!match) return false;

    const [, targetTag, targetClass] = match;
    const currentTag = node.tagName || node.tag;
    const currentClass = node.className || "";

    const tagMatches = !targetTag || (currentTag && currentTag.toLowerCase() === targetTag.toLowerCase());
    const classMatches = !targetClass || currentClass.split(/\s+/).includes(targetClass);

    return !!(tagMatches && classMatches);
  }

  private static _generateFallbackFieldKey(node: any): string {
    if (node.id) return this._sanitizeKey(node.id);
    if (node.className) {
      const firstClass = node.className.trim().split(/\s+/);
      if (firstClass && firstClass !== "column" && firstClass !== "row" && firstClass !== "section") {
        return this._sanitizeKey(firstClass[0]);
      }
    }
    const fallbackTag = node.tagName || node.tag || "input";
    const randomHash = Math.random().toString(36).substring(2, 6);
    return `${fallbackTag}_${randomHash}`;
  }

  private static _sanitizeKey(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  }


  /**
   * Algoritma internal single-pass deep inspection
   */
  private static _executeDeepInspection(nodes: any[], parentSelectorPath: string, report: iPageMetaReport) {
    if (!nodes || !Array.isArray(nodes)) return;
    // FIX: Added .entries() to correctly unpack [index, node]
    for (const [index, node] of nodes.entries()) {
      if (!node || typeof node !== "object") continue; // FIX: Changed 'return' to 'continue' so it doesn't break the entire loop prematurely

      // 1. Hitung total seksi makro teratas (jika berada di level root)
      if (parentSelectorPath === "root") {
        report.totalSections++;
      }

      // 2. Bangun koordinat selector CSS unik tempat elemen ini berada
      const tagName = node.tagName || node.tag || "div";
      const idToken = node.id ? `#${node.id.trim()}` : "";
      // Ambil kelas pertama sebagai penanda selector yang rapi
      const firstClass = node.className ? `.${node.className.trim().split(/\s+/)[0]}` : "";

      const currentSelector = `${tagName}${idToken}${firstClass}`;
      const fullSelectorPath = parentSelectorPath === "root"
        ? currentSelector
        : `${parentSelectorPath} > ${currentSelector}`;

      // 3. DETEKSI SENSOR: Jika elemen visual ini memperalat Component Builder!
      if (node.builder && typeof node.builder === "string") {
        // FIX: Removed TypeScript type assertion 'as keyof iBuilderRegistry' for JavaScript compatibility
        const bName = node.builder.toLowerCase() as keyof iBuilderRegistry;

        // Jika tipe builder belum terdaftar di kamus (komponen kustom baru masa depan), buat rumah barunya dinamis
        if (!report.hasComponent[bName]) {
          report.hasComponent[bName] = { active: false, container: "", count: 0, instances: [] };
        }

        const compMeta = report.hasComponent[bName] as any;
        compMeta.active = true;
        compMeta.count++;
        // Kunci koordinat selector kontainer pembungkusnya secara presisi!
        compMeta.container = fullSelectorPath;
        // Simpan data internal itemnya untuk dibaca cepat oleh tema
        compMeta.instances.push(node.content);


      }

      // 4. KUMPULKAN JALUR TIMELINE: Ambil ID dan nama ramah untuk keperluan scroll timeline
      if (parentSelectorPath === "root" || node.id || node.name) {
        const sectionId = node.id || node.name?.toLowerCase().replace(/\s+/g, "-") || `section-${index}`;
        const sectionName = node.name || node.attrs?.["data-name"] || sectionId.replace(/[-_]/g, " ").toUpperCase();

        // Daftarkan ke manifes timeline jika data ID-nya belum terekam
        if (!report.timelinePaths.some(t => t.id === sectionId)) {
          report.timelinePaths.push({
            id: sectionId,
            name: sectionName,
            type: node.builder || "standard_layout"
          });
        }
      }

      // 5. REKURSI: Telusuri lebih dalam ke anak-anak properti 'content' jika berupa sub-layout objek/array
      if (node.content && typeof node.content === "object" && !(node.content instanceof HTMLElement)) {
        const childNodes = Array.isArray(node.content) ? node.content : [node.content];
        this._executeDeepInspection(childNodes, fullSelectorPath, report);
      }

      // Dukung penelusuran jika menulis menggunakan model Advanced Mode (String Selectors)
      Object.keys(node).forEach(key => {
        if ((key.includes('.') || key.includes('#')) && typeof node[key] === "object") {
          this._executeDeepInspection([node[key]], fullSelectorPath, report);
        }
      });
    }

  }

}

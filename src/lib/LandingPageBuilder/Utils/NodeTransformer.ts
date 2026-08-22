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
    if (nodeObj.config) innerBlock.config = nodeObj.config;
    if (nodeObj.selectors) innerBlock.selectors = nodeObj.selectors;
    if (nodeObj.onCreated) innerBlock.onCreated = nodeObj.onCreated;
    if (nodeObj.onDestroy) innerBlock.onDestroy = nodeObj.onDestroy;
    if (nodeObj.isRoot !== undefined) innerBlock.isRoot = nodeObj.isRoot;
    if (nodeObj._field) innerBlock._field = nodeObj._field;

    const extractedAttrs = { ...(nodeObj.attrs || {}) };
    // 2. Kumpulkan semua atribut kustom (seperti src, href, alt) selevel tag dasar
    const reservedKeys = [
      'tag', 'tagName', 'id', 'className', 'builder', 'content',
      'onCreated', 'onDestroy', 'attrs', 'isRoot', "options",
      'config', 'selectors' // 🟢 AMAN: Dua satpam pelindung baru pilihan Anda!
    ];

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
        innerBlock.content = payload;
      }
      // 💡 KALIBRASI UTAMA: Jika dia adalah sebuah builder yang memegang array data multi-instance
      else if (nodeObj.builder && Array.isArray(payload)) {
        // Biarkan data array lewat secara utuh, NAMUN tandai objek ini dengan flag kustom 
        // atau bungkus agar DOMRenderer di hilir tahu bahwa perulangan MASSAAL 
        // sepenuhnya didelegasikan ke dalam Builder internal, sehingga DOMRenderer LUAR harus diam!
        innerBlock.content = payload;
        innerBlock.isArrayDelegated = true; // Flag penyelamat agar DOMRenderer luar tidak ikut melakukan loop .forEach!
      }
      else if (nodeObj.builder) {
        // console.log({ payload })
        innerBlock.content = payload;
      }
      else if (Array.isArray(payload)) {
        const childLayoutObj: any = {};
        payload.forEach((childItem, index) => {
          const resolvedChild = NodeTransformer.resolveContentNode(childItem as iBasicNode);
          const childKey = Object.keys(resolvedChild)[0];
          childLayoutObj[`${childKey}$child-${index}`] = resolvedChild[childKey];
        });
        innerBlock.content = childLayoutObj;
      }
      else if (typeof payload === "object" && payload !== null) {
        innerBlock.content = NodeTransformer.resolveContentNode(payload);
      }
    }

    return result;
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

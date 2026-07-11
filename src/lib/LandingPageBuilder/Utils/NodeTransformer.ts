import type { iBasicNode } from "../interface";


export interface iInjectionRule {
  selector: string;     // Selektor target (misal: "p.eyebrow", "h2.title", "img")
  inputType?: string;   // Tipe input form (default: "text")
}

export class NodeTransformer {

  public static resolveContentNode(nodeObj: iBasicNode): any {

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

    Object.keys(nodeObj).forEach(key => {
      const isReserved = ['tag', 'tagName', 'id', 'className', 'builder', 'content', 'onCreated', 'onDestroy', 'attrs', 'isRoot'].includes(key);
      const isSystemPrivateProperty = key.startsWith("_");
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
  public static toFormNode(nodes: iBasicNode[], rules: iInjectionRule[]): any[] {
    const formGroupsMap = new Map<string, any[]>();

    // Jalankan fungsi rekursif hibrida terpadu
    this.deepExtractAndBuildForm(nodes, "generic", rules, formGroupsMap);

    // Bungkus seluruh field yang terkumpul ke dalam susunan Fieldset Form Builder
    const finalizedFormSchema: any[] = [];
    formGroupsMap.forEach((fields, categoryName) => {
      finalizedFormSchema.push({
        legend: `Panel Manajemen Seksi: ${categoryName.toUpperCase()}`,
        class: `ui segment cms-group-${categoryName}`,
        group: fields
      });
    });

    return finalizedFormSchema;
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
        activeGroupName = this.sanitizeKey(node.name);
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
          const finalGroup = this.sanitizeKey(explicitGroupName);

          if (!formGroupsMap.has(finalGroup)) formGroupsMap.set(finalGroup, []);

          formGroupsMap.get(finalGroup)!.push({
            type: node.builder ? "textarea" : explicitInputType,
            id: `admin-field-${finalGroup}-${explicitFieldKey}`,
            name: `${finalGroup}_${explicitFieldKey}`,
            title: `Sunting ${explicitFieldKey.replace(/_([a-z])/g, ' $1').toUpperCase()}`,
            value: this.extractNodeValue(node),
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
          if (this.matchSelector(node, rule.selector)) {
            const fieldKey = this.generateFallbackFieldKey(node);
            const formInputType = rule.inputType || "text";

            if (!formGroupsMap.has(activeGroupName)) {
              formGroupsMap.set(activeGroupName, []);
            }

            formGroupsMap.get(activeGroupName)!.push({
              type: node.builder ? "textarea" : formInputType,
              id: `admin-field-${activeGroupName}-${fieldKey}`,
              name: `${activeGroupName}_${fieldKey}`,
              title: `Sunting ${fieldKey.replace(/_([a-z])/g, ' $1').toUpperCase()}`,
              value: this.extractNodeValue(node),
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
  private static extractNodeValue(node: any): any {
    if (typeof node.content === "object" && node.content !== null && !(node.content instanceof HTMLElement)) {
      return JSON.stringify(node.content, null, 2);
    }
    return node.content;
  }

  private static matchSelector(node: any, selector: string): boolean {
    const match = selector.match(/^([a-z0-9]+)?(?:\.([a-z0-9_-]+))?$/i);
    if (!match) return false;

    const [, targetTag, targetClass] = match;
    const currentTag = node.tagName || node.tag;
    const currentClass = node.className || "";

    const tagMatches = !targetTag || (currentTag && currentTag.toLowerCase() === targetTag.toLowerCase());
    const classMatches = !targetClass || currentClass.split(/\s+/).includes(targetClass);

    return !!(tagMatches && classMatches);
  }

  private static generateFallbackFieldKey(node: any): string {
    if (node.id) return this.sanitizeKey(node.id);
    if (node.className) {
      const firstClass = node.className.trim().split(/\s+/);
      if (firstClass && firstClass !== "column" && firstClass !== "row" && firstClass !== "section") {
        return this.sanitizeKey(firstClass[0]);
      }
    }
    const fallbackTag = node.tagName || node.tag || "input";
    const randomHash = Math.random().toString(36).substring(2, 6);
    return `${fallbackTag}_${randomHash}`;
  }

  private static sanitizeKey(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  }
}

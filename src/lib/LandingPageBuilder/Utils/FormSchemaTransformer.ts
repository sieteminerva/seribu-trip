export interface iNodeOptions {
  fieldTypes?: {
    selector?: Record<string, string>;
    property?: Record<string, string>;
  };
  [key: string]: any;
}

export interface iBasicNode {
  name?: string;
  tagName?: string;
  tag?: string;
  id?: string;
  className?: string;
  builder?: string;
  options?: iNodeOptions;
  content?: any;
  [key: string]: any;
}

export interface iInjectionRule {
  selector?: string;
  property?: string;
  inputType: string;
  [key: string]: any;
}

export interface iFormField {
  id?: string;
  className?: string;
  name?: string;
  label?: string;
  type?: string;
  legend?: string;
  value?: any;
  selectorMatched?: string;
  rule?: iInjectionRule;
  group?: iFormField[];
  mode?: "table" | "normal";
}

export class FormSchemaTransformer2 {

  public static toFormNode(nodes: iBasicNode[], globalRules: iInjectionRule[] = []): any[] {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes.map(node => {
      const categoryName = node.builder || node.name || node.id || "Section";
      const extractedGroup = this._processNode(node, globalRules, node.options);

      return {
        legend: `Panel: ${categoryName.toUpperCase()}`,
        className: `segment group-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        group: this.toTable(extractedGroup)
      } as any;

    }).filter(panel => panel.group && panel.group.length > 0);

  }

  public static toTable(inputData: any[]): any[] {
    console.log({ inputData })
    if (!Array.isArray(inputData)) return [];

    return inputData.map((item) => {
      // 1. Validasi awal (Guard Clause)
      if (!item || item.mode !== "table" || !Array.isArray(item.group)) {
        return item;
      }

      const group = item.group;
      const referenceGroup = group[0]?.group || [];
      if (referenceGroup.length === 0) return item;

      // 2. Transformasi Skema & Header dalam SATU kali loop (Menghemat memori)
      const orderedKeys: string[] = [];
      const tableHeaders: string[] = [];
      const cleanSchema = referenceGroup.map(({ name, label, type }: any) => {
        orderedKeys.push(name);
        tableHeaders.push(label);
        return {
          name,
          label,
          type,
          placeholder: `Fill the ${name}`
        };
      });

      // 3. Ekstrak data 'body' tabel secara efisien
      const tableBody = group.map((groupObj: any) => {
        const currentInnerGroup = groupObj?.group || [];

        // Menggunakan object literal biasa (lebih cepat dari `new Map` untuk data ukuran kecil-menengah)
        const itemMap: Record<string, any> = {};
        for (let i = 0; i < currentInnerGroup.length; i++) {
          const innerItem = currentInnerGroup[i];
          if (innerItem?.name) {
            itemMap[innerItem.name] = innerItem;
          }
        }

        // Susun baris berdasarkan orderedKeys
        return orderedKeys.map((key) => {
          const targetItem = itemMap[key];
          if (!targetItem) return "";

          const value = targetItem.value || "";
          return targetItem.type === "textarea" || targetItem.type === "file"
            ? { text: value }
            : value;
        });
      });
      const randomSuffix = Math.random().toString(36).substring(7);
      // 4. Kembalikan objek baru tanpa mutasi langsung pada array asal (Immutability)
      return {
        legend: item.legend,
        id: `group-${randomSuffix}`,
        group: cleanSchema,
        // submitButton: true,
        table: {
          id: `table-${randomSuffix}`,
          className: "form table",
          // builder: "table",
          content: {
            header: tableHeaders,
            body: tableBody
          }
        }
      };
    });
  }



  private static _processNode(
    node: any,
    globalRules: iInjectionRule[],
    parentOptions?: iNodeOptions
  ): iFormField[] {
    if (!node || typeof node !== "object" || node instanceof HTMLElement) {
      return [];
    }

    // Merge options down the AST tree
    const currentOptions: iNodeOptions = {
      ...parentOptions,
      ...node.options,
      fieldTypes: {
        selector: {
          ...(parentOptions?.fieldTypes?.selector || {}),
          ...(node.options?.fieldTypes?.selector || {})
        },
        property: {
          ...(parentOptions?.fieldTypes?.property || {}),
          ...(node.options?.fieldTypes?.property || {})
        }
      }
    };

    // -------------------------------------------------------------------
    // 1. LEAF AST NODE (node with primitive string content)
    // -------------------------------------------------------------------
    if (typeof node.content === "string") {
      const rawFieldName = node.builder || node.name || node.id || node.className || node.tagName || node.tag || "field";
      const fieldName = rawFieldName.toLowerCase().replace(/\s+/g, '-');

      const { inputType, ruleMatched, selectorMatched } = this._resolveInputType(node, rawFieldName, globalRules, currentOptions);

      const field: iFormField = {
        name: fieldName,
        label: rawFieldName.replace(/[-_]/g, ' ').trim().toUpperCase(),
        type: inputType,
        selectorMatched: selectorMatched,
        value: node.content
      };

      if (ruleMatched) field.rule = ruleMatched;
      return [field];
    }

    // -------------------------------------------------------------------
    // 2. RAW PLAIN DATA OBJECT (e.g., { image: "...", title: "..." })
    // -------------------------------------------------------------------
    const isAstNode = "content" in node || "data" in node || "tagName" in node || "tag" in node || "builder" in node;
    if (!isAstNode) {
      const fields: iFormField[] = [];
      for (const [key, val] of this._flattenObject(node)/* Object.entries(node) */) {
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          const propType = currentOptions.fieldTypes?.property?.[key] || "text";
          fields.push({
            name: key,
            label: key.toUpperCase(),
            type: propType,
            value: val
          });
        }
      }
      return fields;
    }

    // -------------------------------------------------------------------
    // 3. CONTAINER RECURSION (Array or Object content)
    // -------------------------------------------------------------------
    const container = node.hasOwnProperty("data") && Array.isArray(node.data) ? node.data : node.content;
    if (Array.isArray(container)) {
      const fields: iFormField[] = [];

      for (const item of container) {
        if (typeof item === "object" && item !== null) {
          const childFields = this._processNode(item, globalRules, currentOptions);

          if (childFields.length === 0) continue;
          // Check if item is a plain object (data record like a carousel item)
          const isItemAstNode = "content" in item || "data" in item || "tagName" in item || "tag" in item || "builder" in item;

          if (!isItemAstNode) {
            // Wrap plain data records inside an item group
            // console.log("[BEING CALLED!]")
            fields.push({ group: childFields, mode: item?.options?.mode || "normal" } as iFormField);
          } else {
            // AST layout nodes simply collect and flatten their child fields
            if (Array.isArray(item.content) || Array.isArray(item.data)) {
              fields.push({
                legend: item.builder || item.name || item.id || item.className,
                group: childFields,
                mode: item?.options?.mode || "normal"
              });
            } else {
              fields.push(...childFields);
            }

          }

        }
      }

      return fields;
    }

    if (container && typeof container === "object") {
      return this._processNode(container, globalRules, currentOptions);
    }

    return [];
  }

  private static _resolveInputType(
    node: any,
    _keyOrSelector: string,
    globalRules: iInjectionRule[],
    options?: iNodeOptions
  ): { inputType: string; ruleMatched?: iInjectionRule; selectorMatched: string } {
    const tagName = (node.tagName || node.tag || "").toLowerCase();
    const className = (node.className || "").toLowerCase();
    const selectorCandidate = tagName && className ? `${tagName}.${className}` : className ? `.${className}` : tagName;

    // 1. Check options.fieldTypes.selector override
    if (options?.fieldTypes?.selector) {
      const selectors = options.fieldTypes.selector;
      for (const [selector, type] of Object.entries(selectors)) {
        if (selector === selectorCandidate || selector === tagName || selector === `.${className}`) {
          return { inputType: type, selectorMatched: selectorCandidate };
        }
      }
    }

    // 2. Check global rules mapping
    const matchedRule = globalRules.find(r =>
      r.selector === selectorCandidate ||
      r.selector === tagName ||
      r.selector === `.${className}`
    );

    if (matchedRule) {
      return {
        inputType: matchedRule.inputType,
        ruleMatched: matchedRule,
        selectorMatched: selectorCandidate
      };
    }

    // Default fallback type
    return { inputType: "text", selectorMatched: selectorCandidate };
  }

  /**
   * Flatten a nested plain object into [dotPath, value] pairs.
   * Arrays are skipped — only scalar leaf values are emitted.
   *
   * Example:
   *   { title: "Hello", artwork: { src: "img.png", mask: { fullbody: "" } } }
   *   => [["title","Hello"], ["artwork.src","img.png"], ["artwork.mask.fullbody",""]]
   */
  private static _flattenObject(
    obj: Record<string, any>,
    prefix: string = "",
    depth: number = 0,
    maxDepth: number = 4
  ): Array<[string, any]> {
    const result: Array<[string, any]> = [];
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        depth < maxDepth
      ) {
        // Recurse into nested plain object
        result.push(...this._flattenObject(val, fullKey, depth + 1, maxDepth));
      } else if (!Array.isArray(val)) {
        result.push([fullKey, val]);
      }
    }
    return result;
  }

}




export class FormSchemaTransformer {
  // Array kunci penampung data yang dapat dikonfigurasi secara dinamis
  public static RESERVED_CONTAINERS: string[] = ["content", "data"];

  public static toFormNode(nodes: iBasicNode[], globalRules: iInjectionRule[] = []): any[] {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes
      .map(node => {
        const categoryName = node.builder || node.name || node.id || "Section";
        const extractedGroup = this._processNode(node, globalRules, node.options);

        return {
          legend: `Panel: ${categoryName.toUpperCase()}`,
          className: `segment group-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
          group: this.toTable(extractedGroup)
        };
      })
      .filter(panel => panel.group && panel.group.length > 0);
  }

  public static toTable(inputData: any[]): any[] {
    if (!Array.isArray(inputData)) return [];

    return inputData.map((item) => {
      if (!item || item.mode !== "table" || !Array.isArray(item.group)) {
        return item;
      }

      const group = item.group;
      if (group.length === 0) return item;

      // Cari baris pertama yang valid untuk dijadikan referensi skema kolom header
      const firstRowObj = group[0];
      const referenceGroup = Array.isArray(firstRowObj?.group) ? firstRowObj.group : [];
      if (referenceGroup.length === 0) return item;

      const orderedKeys: string[] = [];
      const tableHeaders: string[] = [];
      const cleanSchema = referenceGroup.map(({ name, label, type }: any) => {
        orderedKeys.push(name);
        tableHeaders.push(label);
        return {
          name,
          label,
          type,
          placeholder: `Fill the ${name || 'value'}`
        };
      });

      const tableBody = group.map((groupObj: any) => {
        const currentInnerGroup = groupObj?.group || [];

        const itemMap: Record<string, any> = {};
        for (let i = 0; i < currentInnerGroup.length; i++) {
          const innerItem = currentInnerGroup[i];
          if (innerItem?.name) {
            itemMap[innerItem.name] = innerItem;
          }
        }

        return orderedKeys.map((key) => {
          const targetItem = itemMap[key];
          if (!targetItem) return "";

          const value = targetItem.value ?? "";
          return targetItem.type === "textarea" || targetItem.type === "file"
            ? { text: value }
            : value;
        });
      });

      const randomSuffix = Math.random().toString(36).substring(2, 7);

      return {
        legend: item.legend || "Table Details",
        id: `group-${randomSuffix}`,
        group: cleanSchema,
        mode: "table",
        table: {
          id: `table-${randomSuffix}`,
          className: "form table",
          content: {
            header: tableHeaders,
            body: tableBody
          }
        }
      };
    });
  }

  // ... (Metode toFormNode dan toTable tetap sama seperti sebelumnya) ...

  private static _processNode(
    node: any,
    globalRules: iInjectionRule[],
    parentOptions?: iNodeOptions
  ): iFormField[] {
    if (!node || typeof node !== "object" || (typeof HTMLElement !== "undefined" && node instanceof HTMLElement)) {
      return [];
    }

    const currentOptions: iNodeOptions = {
      ...parentOptions,
      ...node.options,
      fieldTypes: {
        selector: {
          ...(parentOptions?.fieldTypes?.selector || {}),
          ...(node.options?.fieldTypes?.selector || {})
        },
        property: {
          ...(parentOptions?.fieldTypes?.property || {}),
          ...(node.options?.fieldTypes?.property || {})
        }
      }
    };

    // ===================================================================
    // TANGKAP MODE TABEL DI LEVEL PALING ATAS
    // ===================================================================
    if (node.options?.mode === "table") {
      const rowsArray = this._findRowsArray(node);
      if (rowsArray && Array.isArray(rowsArray)) {
        const tableRows = rowsArray.map((rowItem: any) => {
          const isolatedOptions = { ...currentOptions, mode: "normal" as const };
          const rowFields = this._processNode(rowItem, globalRules, isolatedOptions);
          return {
            group: rowFields,
            mode: "normal"
          };
        }).filter(row => row.group.length > 0);

        return [{
          legend: node.name || node.builder || node.id || "Table Data",
          group: tableRows,
          mode: "table"
        } as any];
      }
    }

    // -------------------------------------------------------------------
    // 1. LEAF AST NODE (Konten teks primitif string)
    // -------------------------------------------------------------------
    if (typeof node.content === "string") {
      const rawFieldName = node.builder || node.name || node.id || node.className || node.tagName || node.tag || "field";
      const fieldName = rawFieldName.toLowerCase().replace(/\s+/g, '-');

      const { inputType, ruleMatched, selectorMatched } = this._resolveInputType(node, globalRules, currentOptions);

      const field: iFormField = {
        name: fieldName,
        label: rawFieldName.replace(/[-_]/g, ' ').trim().toUpperCase(),
        type: inputType,
        selectorMatched: selectorMatched,
        value: node.content
      };

      if (ruleMatched) field.rule = ruleMatched;
      return [field];
    }

    // -------------------------------------------------------------------
    // 2. RAW PLAIN DATA OBJECT (Record murni non-AST objek)
    // -------------------------------------------------------------------
    const isAstNode = "content" in node || "data" in node || "tagName" in node || "tag" in node || "builder" in node;
    if (!isAstNode) {
      const fields: iFormField[] = [];
      const flattened = this._flattenObject(node);

      // Ambil daftar properti yang diizinkan dari konfigurasi user jika ada
      const allowedProperties = currentOptions.fieldTypes?.property;
      const hasDefinedSchema = allowedProperties && Object.keys(allowedProperties).length > 0;

      for (const [key, val] of flattened) {
        // PERBAIKAN MUTLAK: Jika user mendefinisikan skema, BUANG semua properti liar (seperti artwork.mask.*)
        if (hasDefinedSchema && !allowedProperties.hasOwnProperty(key)) {
          continue;
        }

        const propType = allowedProperties?.[key] || "text";

        fields.push({
          name: key, // Tetap gunakan format dot "artwork.src" agar sinkron dengan keys di header tabel
          label: key.split('.').pop()?.toUpperCase() || key.toUpperCase(),
          type: propType,
          value: val
        });
      }
      return fields;
    }

    // -------------------------------------------------------------------
    // 3. CONTAINER RECURSION (Array Kontainer Layout Biasa)
    // -------------------------------------------------------------------
    const container = node.hasOwnProperty("data") && Array.isArray(node.data) ? node.data : node.content;

    if (Array.isArray(container)) {
      const fields: iFormField[] = [];

      for (const item of container) {
        if (typeof item === "object" && item !== null) {
          const childFields = this._processNode(item, globalRules, currentOptions);
          if (childFields.length === 0) continue;

          const isItemAstNode = "content" in item || "data" in item || "tagName" in item || "tag" in item || "builder" in item;

          if (!isItemAstNode) {
            fields.push({
              group: childFields,
              mode: item?.options?.mode || "normal"
            } as iFormField);
          } else {
            const firstChild = childFields[0];
            if (childFields.length === 1 && firstChild && (firstChild as any).mode === "table") {
              fields.push(...childFields);
            } else if (Array.isArray(item.content) || Array.isArray(item.data)) {
              fields.push({
                legend: item.name || item.builder || item.id || "Sub Section",
                group: childFields,
                mode: item?.options?.mode || "normal"
              });
            } else {
              fields.push(...childFields);
            }
          }
        }
      }
      return fields;
    }

    if (container && typeof container === "object") {
      return this._processNode(container, globalRules, currentOptions);
    }

    return [];
  }

  /**
   * Mengambil array data baris secara dinamis berdasarkan konfigurasi RESERVED_CONTAINERS
   */
  private static _findRowsArray(node: any): any[] | null {
    if (!node) return null;
    if (Array.isArray(node)) return node;

    // Jika node memiliki properti RESERVED_CONTAINERS, langsung cek apakah itu array atau berisi array
    for (const key of this.RESERVED_CONTAINERS) {
      if (node.hasOwnProperty(key)) {
        const val = node[key];
        if (Array.isArray(val)) return val;

        // Hanya boleh turun 1 tingkat jika properti tersebut adalah pembungkus (seperti blog.content.data)
        if (val && typeof val === "object") {
          for (const subKey of this.RESERVED_CONTAINERS) {
            if (val.hasOwnProperty(subKey) && Array.isArray(val[subKey])) {
              return val[subKey];
            }
          }
        }
      }
    }
    return null;
  }

  private static _resolveInputType(
    node: any,
    globalRules: iInjectionRule[],
    options?: iNodeOptions
  ): { inputType: string; ruleMatched?: iInjectionRule; selectorMatched: string } {
    const tagName = (node.tagName || node.tag || "").toLowerCase();
    const className = (node.className || "").toLowerCase();
    const selectorCandidate = tagName && className ? `${tagName}.${className}` : className ? `.${className}` : tagName;
    const dotClassName = className ? `.${className}` : "";
    if (options?.fieldTypes?.selector) {
      const selectors = options.fieldTypes.selector;
      if (selectors[selectorCandidate])
        return {
          inputType: selectors[selectorCandidate],
          selectorMatched: selectorCandidate
        }; if (tagName && selectors[tagName])
        return {
          inputType: selectors[tagName],
          selectorMatched: selectorCandidate
        };
      if (dotClassName && selectors[dotClassName]) return {
        inputType: selectors[dotClassName],
        selectorMatched: selectorCandidate
      };
    }
    const matchedRule = globalRules.find(r => r.selector === selectorCandidate || r.selector === tagName || (dotClassName && r.selector === dotClassName));
    if (matchedRule) {
      return {
        inputType: matchedRule.inputType,
        ruleMatched: matchedRule,
        selectorMatched: selectorCandidate
      };
    }
    return {
      inputType: "text",
      selectorMatched: selectorCandidate
    };
  }

  private static _flattenObject(
    obj: Record<string, any>,
    prefix: string = "",
    depth: number = 0,
    maxDepth: number = 4
  ): Array<[string, any]> {
    const result: Array<[string, any]> = [];
    if (!obj || typeof obj !== "object") return result;

    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        depth < maxDepth
      ) {
        // Rekursi masuk lebih dalam ke objek bersarang
        result.push(...this._flattenObject(val, fullKey, depth + 1, maxDepth));
      } else if (!Array.isArray(val) && val !== null && typeof val !== "object") {
        // HANYA masukkan nilai primitif ujung (string, number, boolean) ke hasil akhir
        result.push([fullKey, val]);
      }
    }
    return result;
  }
}
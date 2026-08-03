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

export class FormSchemaTransformer {

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
          builder: "table",
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
    const isAstNode = "content" in node || "tagName" in node || "tag" in node || "builder" in node;
    if (!isAstNode) {
      const fields: iFormField[] = [];
      for (const [key, val] of Object.entries(node)) {
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
    if (Array.isArray(node.content)) {
      const fields: iFormField[] = [];

      for (const item of node.content) {
        if (typeof item === "object" && item !== null) {
          const childFields = this._processNode(item, globalRules, currentOptions);

          if (childFields.length === 0) continue;
          // Check if item is a plain object (data record like a carousel item)
          const isItemAstNode = "content" in item || "tagName" in item || "tag" in item || "builder" in item;

          if (!isItemAstNode) {
            // Wrap plain data records inside an item group
            fields.push({ group: childFields, mode: item?.options?.mode || "normal" } as iFormField);
          } else {
            // AST layout nodes simply collect and flatten their child fields
            if (Array.isArray(item.content)) {
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

    if (node.content && typeof node.content === "object") {
      return this._processNode(node.content, globalRules, currentOptions);
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

}

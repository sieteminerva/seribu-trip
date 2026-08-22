export class BuilderTransformer {

  static toBuilderNode(obj: any) {
    const content = obj.data || [];

    // Menggunakan Map dengan key gabungan "builderName|namespace" jika ada namespace
    const builderMap = new Map<string, { builder: string; name: string | null; items: any[] }>();

    let sectionName = "";
    let container = "";
    for (const item of content) {
      const itemAsAny = item as any;

      if ("builder" in item && typeof itemAsAny?.builder === 'string') {
        if ("section" in item) {
          // Split berdasarkan titik dua (colon)
          const sectionPart = itemAsAny.section.split(":")

          sectionName = sectionPart[0];

          container = sectionPart[1];

          if (container && container.includes("container") && "content" in item && typeof item.content === "string") {
            const childs = this._getArrayContent(content, item?.content);
            item.content = childs
            // console.log("item$", childs)
          }
        }

        const builderName = itemAsAny.builder;

        // Buat unique key unik untuk Map. Jika tidak ada namespace, default ke "default"
        const mapKey = `${builderName}` + `${sectionName ? ':' + sectionName : ""}`;

        // Ambil group yang sudah ada atau buat blueprint baru
        const existingGroup = builderMap.get(mapKey) || { builder: builderName, name: sectionName, items: [] };

        if (item.node) {
          const { baseName, id, classNames } = this.parseKey(item.node);

          if (classNames.length) item["className"] = classNames.join(" ");
          if (id) item["id"] = id;
          if (baseName) item["tagName"] = baseName;

        }

        if (!item.hasContainer) {
          // if (!Array.isArray(item.content)) delete item.builder;
          (existingGroup.items as any[]).push(item)
          builderMap.set(mapKey, existingGroup);
        }

        // console.log(item)
      }
    }
    // console.log(builderMap.entries())


    const nameGroupMap = new Map<string, any[]>();

    builderMap.forEach((group) => {

      const { builder, name, items } = group;

      console.log(items)
      let resolvedContent: any[] = [];

      // Switch case tetap bekerja berdasarkan builderName dasar tanpa terganggu namespace
      switch (builder) {
        case "section":
          resolvedContent = this.resolveSectionSchema(items);
          break;
        case "masonry":
          resolvedContent = this.resolveMasonrySchema(items);
          break;
        case "pricing-card":
          resolvedContent = this.resolvePricingSchema(items);
          break;
        case "product-card-grid":
          resolvedContent = this.resolveProductSchema(items);
          break;
        case "accordion":
          resolvedContent = this.resolveAccordionSchema(items);
          break;
        default:
          resolvedContent = this.resolveDefault(items);
      }

      // const node = {
      //   builder,
      //   name,
      //   content: items
      // };

      const groupKey = name || "";

      const existingNameGroup = nameGroupMap.get(groupKey) || [];
      existingNameGroup.push(resolvedContent);
      nameGroupMap.set(groupKey, existingNameGroup);

    });

    const result = [] as any[];
    for (const v of builderMap.values()) {
      result.push(...v.items)
    }

    // nameGroupMap.forEach((buildersArray, nameKey) => {
    //   result.push({
    //     name: nameKey || null, // mengembalikan ke null jika sebelumnya kosong
    //     content: buildersArray // berisi array dari { builder, content }
    //   });
    // });

    return result;
  }


  /**
   * @private Mengurusi trik panah ">" dan selector DOMRenderer untuk seksi teks statis
   */
  private static resolveSectionSchema(items: any[]): any[] {
    const groups = this._groupByHierarchy(items);

    const outputContent: any[] = [];
    for (const [rootName, groupedItems] of Object.entries(groups)) {
      const isClass = rootName.startsWith(".");
      outputContent.push({
        [isClass ? "className" : "tagName"]: isClass ? rootName.slice(1).replace(/\$\d+/, "").split(".").join(" ") : rootName,
        content: groupedItems
      });
    }
    return outputContent;
  }

  /**
   * @private Mengurusi ekstraksi array gambar flat untuk struktur Grid Masonry
   */
  private static resolveMasonrySchema(rows: any[]): any[] {
    // Komponen masonry hanya butuh array bersih berisi gambar, tanpa pusing memikirkan selektor HTML
    return rows.map(item => ({
      uid: item.uid,
      title: item.title || "",
      imageUrl: item.imageUrl || item.src || "",
      category: item.category
    }));
  }

  /**
   * @private Mengurusi Product Schema
   */
  private static resolveProductSchema(items: any[]): any[] {

    function _stringColorToArray(value: string) {
      const separator = "~"
      const array = value.split(",")
      return array.map(item => {
        const obj = {} as any;
        const a = item.split(separator)
        obj["name"] = a[0].trim();
        obj["value"] = a[1].trim();
        return obj;
      });
    }

    return items.map(item => {
      const product = {
        uid: item.uid,
        title: item.title || "",
        imageUrl: item.imageUrl || item.src || "",
        category: item.category,
        price: item.price
      } as any;

      if (item.colors) product["colors"] = _stringColorToArray(item.colors)

      if (item.mask) {
        const maskKey = item.mask.split(",").map((i: string) => i.trim())
        let mask = {} as any;
        maskKey.forEach((k: string) => {
          const f = items.find((i: any) => i.uid === k)
          if (f?.node === "mask") {
            mask[f.name] = {
              imageUrl: f.imageUrl,
              name: f.name
            }
          }
        });

        product.mask = mask;
      }

      if (item.category === "mask") {
        return;
      }
      item = product;
      return item;
    }).filter((p: any) => p !== undefined);
  }

  /**
   * @private Mengurusi skema tabel harga / durasi paket trip
   */
  private static resolvePricingSchema(items: any[]): any[] {
    // Logika kustom untuk mem-parsing data finansial/paket dari Sheets Anda
    return items.map(item => {
      const card = {
        uid: item.uid,
        header: item.title,
        price: item.price,
      } as any

      if (item.content && typeof item.content === "string" && item.content.split(",").length > 1) {
        card.body = this._getArrayContent(items, item.content);
      }

      if (item.node?.startsWith(".")) {
        card.className = item.node.replace(".", "")
      }

      if (!item.content) {
        return;
      }


      return card;
    }).filter((p: any) => p !== undefined);
  }

  /**
   * @private Mengurusi skema tabel harga / durasi paket trip
   */
  private static resolveAccordionSchema(items: any[]): any[] {
    // Logika kustom untuk mem-parsing data finansial/paket dari Sheets Anda
    return items.map(item => {

      const accordion = {
        uid: item.uid,
      } as any

      if (item.content && typeof item.content === "string" && item.content.split(",").length > 1) {
        accordion.content = this._getArrayContent(items, item.content);
      }

      if (item.node?.startsWith(".")) {
        accordion.className = item.node.replace(".", "")
      }

      if (!accordion.content) {
        return;
      }


      return accordion;
    }).filter((p: any) => p !== undefined);
  }

  private static resolveDefault(items: any[]): any[] {
    return items.map((item: any) => {
      delete item.builder
      return item;
    })
  }

  private static parseKey(key: string): { id?: string; classNames: string[]; baseName: string; parsedAttrs: Record<string, string> } {
    const config = { id: '#', class: '.', ignored: '$', include: '-' }
    const { id: idSep, class: classSep, ignored } = config;

    // 1. Clean the key string from the ignored token delimiter ($) if present
    let cleanKey = key.includes(ignored) ? key.split(ignored)[0] : key;

    const parsedAttrs: Record<string, string> = {};

    // ====================================================
    // 🧙‍♂️ THE ATTRIBUTE BRACKET EXTRACTOR (SIHIR REGEX PILIHAN JENIUS ANDA!)
    // Mendeteksi dan memeras semua pola [attr='value'] atau [attr="value"] di dalam key string
    // ====================================================
    const attrRegex = /\[\s*([a-zA-Z0-8_-]+)\s*=\s*['"]?([^'"]*)['"]?\s*\]/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(cleanKey)) !== null) {
      const attrName = attrMatch[1];
      const attrValue = attrMatch[2];
      parsedAttrs[attrName] = attrValue;
    }

    // Bersihkan seluruh blok kurung siku [...] dari key utama agar tidak mengacaukan parsing ID dan Class
    cleanKey = cleanKey.replace(/\[[^\]]*\]/g, '');

    // Escape karakter separator untuk RegEx
    const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 2. Ambil Base Name / Tag Name (Karakter di awal sebelum bertemu # atau .)
    const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
    let baseName = baseNameMatch ? baseNameMatch[1] : 'div';

    // 3. Ambil ID secara presisi (Karakter setelah # sebelum bertemu . atau [ berikutnya)
    const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
    const id = idMatch ? idMatch[1] : undefined;

    // 4. Ambil Semua Class Names secara berulang (Semua karakter setelah tanda titik)
    const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, 'g');
    let classNames: string[] = [];
    let match;
    while ((match = classRegex.exec(cleanKey)) !== null as any) {
      classNames.push((match as any)[1]);
    }

    return {
      id,
      classNames,
      baseName: baseName.replace(/-/g, ' '),
      parsedAttrs
    };
  }


  // private static _hasArrayContent(item: any) {
  //   if (item.hasOwnProperty("content") && item.content.split(",").length > 1) return true;
  //   return false;
  // }

  private static _getArrayContent(items: any[], contentString: string) {
    let content = [] as any[];

    const contentKey = contentString?.split(",").map((i: string) => i.trim())
    contentKey.forEach((k: string) => {
      const f = items.find((i: any) => i.uid === k.trim())

      const obj = {} as any;
      if (f?.title) obj["title"] = f.title;
      if (f?.node) obj["className"] = f.node.replace(".", "")
      if (f?.description) obj["description"] = f.description
      if (f) f.hasContainer = true;
      content.push(f)
    });

    return content.filter((i: any) => i !== undefined);
  }


  private static _groupByHierarchy(items: any) {
    const groups: Record<string, any[]> = {};

    for (const item of items) {
      if (typeof item?.node === 'string' && item.node.includes(">")) {
        const parts = item.node.split(">");
        const root = parts[0];
        const node = parts[1].trim();

        if (!groups[root]) groups[root] = [];

        // Gunakan fungsi parseKey bajakan (copy-paste) Anda yang super cepat di bawah
        const selector = this.parseKey(node);
        item.className = selector.classNames.join(" ").replace(/\$\d+/, "").trim();
        item.tagName = selector.baseName;

        const sortedItem = {
          uid: item.uid,
          className: item.className,
          tagName: item.tagName
        } as any;

        if (item.hasOwnProperty("name") || item.hasOwnProperty("property") && item.hasOwnProperty("text")) sortedItem[item.name || item.property] = item.text;
        if (item.hasOwnProperty("imageUrl")) sortedItem.imageUrl = item.imageUrl;

        groups[root].push(sortedItem);
      }
    }

    return groups;
  }

  // private static _groupBySection(item: any) {
  //   if ("section" in item) {

  //   }
  // }

}



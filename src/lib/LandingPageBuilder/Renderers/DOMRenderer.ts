
import type { BuilderRegistry } from "../BuilderRegistry";
import type { DefaultSelectors, iNodeContent } from "../interface";

export class DOMRenderer<
  C extends Partial<any> = {},
  S extends string = DefaultSelectors
> {
  config!: any;

  private cleanupMap = new Map<HTMLElement, (element: HTMLElement) => void>();
  // ... Kode constructor, parseKey, dan render tetap sama seperti LayoutRenderer sebelumnya
  constructor(config?: C) {
    const defaultConfig: any = {
      selectors: {
        grid: { tagName: 'div', isClass: true, name: 'grid', className: 'grid' },
        row: { tagName: 'div', isClass: true, name: 'row', className: 'row' },
        column: { tagName: 'div', isClass: true, name: 'column', className: 'column' }
      },
      separator: { id: '#', class: '.', ignored: '$', include: '-' }
    };

    this.config = {
      ...defaultConfig,
      ...config,
      selectors: { ...defaultConfig.selectors, ...config?.selectors }
    };
  }

  private parseKey(key: string): { id?: string; classNames: string[]; baseName: string } {
    const { id: idSep, class: classSep, ignored } = this.config.separator;

    // 1. Buang bagian setelah tanda ignored ($) jika ada
    let cleanKey = key;
    if (key.includes(ignored)) {
      cleanKey = key.split(ignored)[0];
    }

    // Escape karakter separator untuk RegEx jika berupa karakter khusus (seperti titik atau pagar)
    const escId = idSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escClass = classSep.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 2. Ambil Base Name / Tag Name (Karakter apa saja di awal sebelum bertemu # atau .)
    const baseNameMatch = cleanKey.match(new RegExp(`^([^${escId}${escClass}]+)`));
    let baseName = baseNameMatch ? baseNameMatch[1] : 'div';

    // 3. Ambil ID secara presisi (Karakter setelah # sebelum bertemu . berikutnya)
    const idMatch = cleanKey.match(new RegExp(`${escId}([^${escId}${escClass}]+)`));
    const id = idMatch ? idMatch[1] : undefined;

    // 4. Ambil Semua Class Names secara berulang (Semua karakter setelah tanda titik)
    const classRegex = new RegExp(`${escClass}([^${escId}${escClass}]+)`, 'g');
    const classNames: string[] = [];
    let match;
    while ((match = classRegex.exec(cleanKey)) !== null) {
      classNames.push(match[1]);
    }

    // Normalisasi nama dasar jika ada tanda hubung kustom bawaan konfigurasi lama Anda
    baseName = baseName.replace(/-/g, ' ');

    return { id, classNames, baseName };
  }

  // Inside DOMRenderer.ts

  private buildStructure(structure: any, parentNode: HTMLElement | DocumentFragment, builder: BuilderRegistry | null) {
    for (const [key, value] of Object.entries(structure)) {
      if (!value || typeof value !== 'object') continue;

      const { id, classNames, baseName } = this.parseKey(key);
      const builderName = (value as any).builder;
      const isRootFlag = (value as any).isRoot === true;

      let currentElement: HTMLElement;
      let customComponentFromBuilder: HTMLElement | null = null;

      // ====================================================
      // KASUS A: Input berupa HTMLElement Hidup (Bypass Murni)
      // ====================================================
      if ((value as any).content instanceof HTMLElement && !builderName && !isRootFlag) {
        currentElement = (value as any).content;
      }

      // ====================================================
      // KASUS B: Element memiliki properti BUILDER & isRoot = TRUE 👑
      // ====================================================
      else if (builderName && isRootFlag && builder && builder.has(builderName)) {
        const builderFn = builder.get(builderName);
        if (builderFn) {
          // 🧙‍♂️ AMAN & UTUH: Loloskan seluruh object value (termasuk .attrs) ke builder!
          const resultComponent = builderFn(value);
          if (resultComponent instanceof HTMLElement) {
            customComponentFromBuilder = resultComponent;
          }
        }
        // Jika builder mengembalikan element, jadikan elemen utama. Jika gagal, buat div fallback.
        currentElement = customComponentFromBuilder || document.createElement(baseName || 'div');
      }

      // ====================================================
      // KASUS C: Template visual biasa / Builder dengan isRoot = FALSE
      // ====================================================
      else {
        const tagName = baseName || 'div';
        currentElement = document.createElement(tagName);
      }

      // ====================================================
      // 💡 PROSES PELEBURAN (MERGING) ATRIBUT & CLASS
      // ====================================================
      if (id) {
        currentElement.id = id;
      }

      if (classNames.length > 0) {
        const existingClasses = currentElement.className ? currentElement.className.trim().split(/\s+/) : [];
        const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
        currentElement.className = Array.from(combinedClasses).join(' ');
      }

      // Gabungkan custom attributes murni dari level JSON data
      if ((value as any).attrs && typeof (value as any).attrs === 'object') {
        for (const [aName, aValue] of Object.entries((value as any).attrs)) {
          // Jaga agar tidak menimpa atribut yang sudah dipasang secara sengaja oleh internal builder
          if (!currentElement.hasAttribute(aName)) {
            currentElement.setAttribute(aName, String(aValue));
          }
        }
      }

      // Jalankan onCreated Lifecycle hook
      if (typeof (value as any).onCreated === 'function') {
        (value as any).onCreated(currentElement);
      }

      // ====================================================
      // 💡 EVALUASI KONTEN (Anti-Infinite Loop Secure Guard)
      // ====================================================
      // Inside DOMRenderer.ts -> buildStructure Langkah 6 (Evaluasi Konten)

      if (!customComponentFromBuilder && (value as any).content !== undefined) {
        const nodePayload = (value as any).content; // Menargetkan anak .content asli

        // A: Jalur Builder Alternatif (isRoot = false), loloskan objek VALUE seutuhnya!
        if (builderName && builder?.has(builderName)) {
          const builderFn = builder.get(builderName);
          if (builderFn) {
            const normalComponent = builderFn(value);
            // 💡 FIX SAFETY: Pastikan komponen yang dikembalikan bukan dirinya sendiri sebelum append!
            if (normalComponent instanceof Node && normalComponent !== currentElement) {
              currentElement.appendChild(normalComponent);
            }
          }
        }
        // B: 👑 FIX MUTLAK ANTI-HIERARCHY ERROR: Jalur cetak Node fisik langsung
        else if (nodePayload instanceof Node) {
          // 💡 SENSOR PROTEKSI: Hanya lakukan append jika nodePayload BUKAN currentElement itu sendiri!
          if (nodePayload !== currentElement && !currentElement.contains(nodePayload)) {
            currentElement.appendChild(nodePayload);
          } else {
            console.log("[DOMRenderer Guard] Prevented self-append loop anomaly safely.");
          }
        }
        // C: Jalur rekursif anak JSON bersarang
        else if (typeof nodePayload === 'object' && nodePayload !== null) {
          const subFragment = document.createDocumentFragment();
          this.buildStructure(nodePayload, subFragment, builder);
          currentElement.appendChild(subFragment);
        }
        // D: Jalur injeksi string HTML/Teks biasa
        else {
          currentElement.innerHTML = String(nodePayload);
        }
      }


      // ====================================================
      // 💡 REKURSI KEY BERSARANG KUSTOM (. atau #)
      // ====================================================
      const reservedKeys = ['content', 'onCreated', 'onDestroy', 'builder', 'attrs', 'isRoot'];
      const childKeys = Object.keys(value).filter(k => !reservedKeys.includes(k));

      if (childKeys.length > 0) {
        const subFragment = document.createDocumentFragment();
        const childStructure: any = {};
        for (const childKey of childKeys) {
          childStructure[childKey] = (value as any)[childKey];
        }
        this.buildStructure(childStructure, subFragment, builder);
        currentElement.appendChild(subFragment);
      }

      // Tempelkan elemen matang ke parent tree
      parentNode.appendChild(currentElement);
    }
  }



  /**
   * Main entry method to parse Advanced Mode structures securely
   */
  public render(content: iNodeContent<S>, builder: BuilderRegistry | null): HTMLElement {
    const rootElement = document.createElement('div');
    const fragment = document.createDocumentFragment();
    this.buildStructure(content, fragment, builder);
    rootElement.appendChild(fragment);
    return (rootElement.firstElementChild as HTMLElement) || rootElement;
  }


  /**
   * Safe Destroy Method: Call this to unmount a layout element tree from the DOM.
   * It will recursively trigger onDestroy hooks to prevent memory leaks.
   */
  public unmount(targetElement: HTMLElement) {
    // 1. Scan all child elements inside the target that have registered cleanup hooks
    this.cleanupMap.forEach((onDestroyFn, element) => {
      if (targetElement.contains(element) || targetElement === element) {
        try {
          onDestroyFn(element);
        } catch (error) {
          console.error("Failed to execute onDestroy lifecycle hook:", error);
        }
        this.cleanupMap.delete(element); // Remove from memory tracking
      }
    });

    // 2. Safely remove the element from the live DOM tree
    if (targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  }
}

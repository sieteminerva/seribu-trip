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

  private buildStructure(structure: any, parentNode: HTMLElement | DocumentFragment, builder: BuilderRegistry | null) {
    for (const [key, value] of Object.entries(structure)) {
      if (!value || typeof value !== 'object') continue;

      const { id, classNames, baseName } = this.parseKey(key);
      const builderName = (value as any).builder;
      const isRootFlag = (value as any).isRoot === true;

      let currentElement: HTMLElement;
      let customComponentFromBuilder: HTMLElement | null = null;

      // 1. Eksekusi builder terlebih dahulu jika terdeteksi pola isRoot = true
      if (builderName && isRootFlag && builder && builder.has(builderName)) {
        const builderFn = builder.get(builderName);
        if (builderFn) {
          const nodePayload = (value as any).content;
          const resultComponent = builderFn(nodePayload);
          if (resultComponent instanceof HTMLElement) {
            customComponentFromBuilder = resultComponent;
          }
        }
      }

      // 2. Tentukan Elemen Utama: Pakai hasil builder (jika isRoot), atau cetak div/tag wrapper baru
      if (customComponentFromBuilder) {
        currentElement = customComponentFromBuilder; // Elemen dibajak langsung dari builder!
      } else {
        const tagName = baseName || 'div';
        currentElement = document.createElement(tagName);
      }

      // 3. PROSES PELEBURAN (MERGING): Gabungkan ID & Class dari wrapper ke elemen target
      if (id) {
        // Jika builder sudah melahirkan ID, wrapper akan menimpa ID tersebut jika didefinisikan kustom
        currentElement.id = id;
      }

      if (classNames.length > 0) {
        // Gabungkan kelas CSS bawaan builder dengan kelas CSS kustom dari template wrapper
        const existingClasses = currentElement.className ? currentElement.className.trim().split(/\s+/) : [];
        const combinedClasses = new Set([...existingClasses, ...classNames].filter(Boolean));
        currentElement.className = Array.from(combinedClasses).join(' ');
      }

      // 4. Penggabungan Atribut HTML Kustom (attrs)
      if ((value as any).attrs && typeof (value as any).attrs === 'object') {
        for (const [aName, aValue] of Object.entries((value as any).attrs)) {
          currentElement.setAttribute(aName, String(aValue));
        }
      }

      // 5. Jalankan onCreated Lifecycle hook
      if (typeof (value as any).onCreated === 'function') {
        (value as any).onCreated(currentElement);
      }

      // 6. Evaluasi Konten jika TIDAK menggunakan jalur isRoot (jalur standard fallback)
      if (!customComponentFromBuilder && (value as any).content !== undefined) {
        const nodePayload = (value as any).content;

        if (builderName && builder && builder.has(builderName)) {
          const builderFn = builder.get(builderName);
          if (builderFn) {
            const normalComponent = builderFn(nodePayload);
            if (normalComponent instanceof Node) currentElement.appendChild(normalComponent);
          }
        } else if (nodePayload instanceof Node) {
          currentElement.appendChild(nodePayload);
        } else if (typeof nodePayload === 'object' && nodePayload !== null) {
          const subFragment = document.createDocumentFragment();
          this.buildStructure(nodePayload, subFragment, builder);
          currentElement.appendChild(subFragment);
        } else {
          currentElement.innerHTML = String(nodePayload);
        }
      }

      // 7. Rekursi untuk child keys tetap berjalan normal (jika ada struktur bersarang di bawahnya)
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

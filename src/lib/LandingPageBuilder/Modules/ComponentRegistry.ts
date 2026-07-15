import type { ComponentBuilderFn, iBasicNode, iBuilderRegistry } from "../interface";
import { NodeTransformer } from "../Utils/NodeTransformer";


// 💡 DEKLARASI KONTAK LAZY LOAD UNTUK MODEL METADATA (STYLE 3)
export interface iSimpleWayManifest {
  path: string;
  stylesheet?: string;
  config?: any;
  schema?: any;
}

export type LoadFn = (options: { script: string; stylesheet?: string }) => Promise<any>;

// Polimorfisme Tanda Tangan Registrasi yang Sah di Framework Anda
export type RegisterFn<K extends keyof iBuilderRegistry> =
  | ComponentBuilderFn<iBuilderRegistry[K]> // OldWayFn / Standard murni
  | ((data: iBuilderRegistry[K], load: LoadFn) => Promise<HTMLElement | null>) // ConfigurableWayFn
  | ((data: iBuilderRegistry[K]) => iSimpleWayManifest); // SimpleWayFn Manifest

// 💡 PETA REGISTER VITE: Hanya aktif dan dibaca saat masa development lokal!
const viteComponentModules = import.meta.glob("/src/components/**/*.ts");
const viteStyleModules = import.meta.glob("/src/components/**/*.css");

export class ComponentRegistry {
  private builders = new Map<keyof iBuilderRegistry, RegisterFn<any>>();
  private registeredSheets = new Set<CSSStyleSheet>();
  // 💡 Deklarasikan cache secara formal agar tipe data aman dan tidak memakai (this as any)
  private _resolvedCache = new Map<string, any>();

  public register<K extends keyof iBuilderRegistry>(name: K, builderFn: RegisterFn<K>): this {
    this.builders.set(name, builderFn);
    return this;
  }

  public has(name: string): boolean {
    return this.builders.has(name as keyof iBuilderRegistry);
  }

  /**
   * 🧙‍♂️ THE PRE-LOAD HYDRATOR
   */
  public async preloadComponents(componentNames: string[], pagesData: any[]): Promise<void> {
    const promises = componentNames.map(async (name) => {
      const fn = this.builders.get(name as any);
      if (!fn) return;

      const matchedData = NodeTransformer.getBuilderNode(pagesData as iBasicNode[], name);

      const result = fn(matchedData, async ({ script, stylesheet }) => {
        let jsModule: any = null;
        let cssModule: any = null;

        if (import.meta.env?.DEV) {
          if (script) {
            const normalizedPath = script.startsWith("/src") ? script : `/src/${script.replace(/^\.\//, "")}`;
            const loader = viteComponentModules[normalizedPath];
            if (loader) jsModule = await loader();
          }
          if (stylesheet) {
            const normalizedCss = stylesheet.startsWith("/src") ? stylesheet : `/src/${stylesheet.replace(/^\.\//, "")}`;
            const loader = viteStyleModules[normalizedCss];
            if (loader) cssModule = await loader();
          }
        } else {
          const scriptPromise = script ? import(/* @vite-ignore */ `${script}`) : Promise.resolve(null);
          const cssPromise = stylesheet ? import(/* @vite-ignore */ `${stylesheet}`, { with: { type: "css" } }) : Promise.resolve(null);
          [jsModule, cssModule] = await Promise.all([scriptPromise, cssPromise]);
        }

        if (cssModule && cssModule.default instanceof CSSStyleSheet) {
          this.injectStyle(cssModule.default);
        }

        if (!script) return {};
        return jsModule?.default || Object.values(jsModule || {}).find(v => typeof v === 'function');
      });

      // 💡 PERBAIKAN: Tangani hasil return dari eksekusi fungsi di fase preload
      if (result instanceof Promise) {
        // JALUR ASINKRONUS (Style 3 / Komponen Baru berbasis Kelas)
        const resolved = await result;
        if (typeof resolved === "function") {
          this._resolvedCache.set(name, resolved);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * ⚡ AMAN & SINKRONUS MURNI (.run Method)
   */
  public build<K extends keyof iBuilderRegistry>(name: K, data: any): any {

    const fn = this.builders.get(name);
    if (!fn) return null;
    // 1. Cek jalur komponen asinkronus (Style 3 Manifest kelas baru)
    const PreloadedBuilderClass = this._resolvedCache.get(name);

    if (typeof PreloadedBuilderClass === "function") {
      const config = data.config || {};
      const schema = data.schema || [];

      if (typeof PreloadedBuilderClass.create === "function") {
        return PreloadedBuilderClass.create(schema, config);
      }

      return new PreloadedBuilderClass(config).create(schema);
    }

    // Fallback jika komponen dipanggil instan tanpa lewat fase preload sama sekali
    const result = fn(data, () => Promise.resolve({}));
    if (result instanceof Promise) return result;
    if (result instanceof HTMLElement) return result;
    if (result && typeof result === "object") return result;

    return null;
  }

  private injectStyle(sheet: CSSStyleSheet): void {
    if (!this.registeredSheets.has(sheet)) {
      this.registeredSheets.add(sheet);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
  }
}



export class BuilderRegistry2 {

  private builders = new Map<string, ComponentBuilderFn>();

  public register<K extends keyof iBuilderRegistry>(name: K, builderFn: ComponentBuilderFn<iBuilderRegistry[K]>): this {
    this.builders.set(name, builderFn);
    return this;
  }

  public get<K extends keyof iBuilderRegistry>(name: K): ComponentBuilderFn<iBuilderRegistry[K]> | undefined {
    return this.builders.get(name) as any;
  }

  public has(name: string): boolean {
    return this.builders.has(name);
  }
}



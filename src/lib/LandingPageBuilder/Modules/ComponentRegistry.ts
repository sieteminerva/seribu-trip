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
  | ((data: iBuilderRegistry[K], config?: any) => iSimpleWayManifest); // SimpleWayFn Manifest

// 💡 PETA REGISTER VITE: Hanya aktif dan dibaca saat masa development lokal!
const viteComponentModules = import.meta.glob("/src/components/**/*.ts");
const viteStyleModules = import.meta.glob("/src/components/**/*.css");

export class ComponentRegistry {
  private builders = new Map<keyof iBuilderRegistry, RegisterFn<any>>();
  private registeredSheets = new Set<CSSStyleSheet>();
  // 💡 Deklarasikan cache secara formal agar tipe data aman dan tidak memakai (this as any)
  private _resolvedCache = new Map<string, any>();

  private _dynamicConfigs = new Map<keyof iBuilderRegistry, Record<string, any>>();

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
  public _build<K extends keyof iBuilderRegistry>(name: K, data: any): any {

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


  // TODO redesign the build method its hacky, sould accept 2nd optional parameter on .create
  public build<K extends keyof iBuilderRegistry>(name: K, data: any): any {
    const fn = this.builders.get(name);
    if (!fn) return null;

    // Ambil data konfigurasi kustom tema yang terparkir di gudang pusat kita
    const activeThemeConfig = this._dynamicConfigs.get(name) || {};
    const contentPayload = data?.content || data;

    const PreloadedBuilderClass = this._resolvedCache.get(name);
    // console.log(typeof PreloadedBuilderClass)

    if (typeof PreloadedBuilderClass === "function") {
      if (typeof PreloadedBuilderClass.create === "function") {
        return PreloadedBuilderClass.create(contentPayload, activeThemeConfig);
      }

      const instance = new PreloadedBuilderClass(activeThemeConfig);
      console.log({ instance, type: typeof instance })
      if (instance && typeof instance === "object") {
        const existingConfig = (instance as any).config || {};
        (instance as any).config = {
          ...existingConfig,
          ...activeThemeConfig,
          selectors: { ...(existingConfig.selectors || {}), ...(activeThemeConfig.selectors || {}) }
        };

        // Salinkan parameter luar ke permukaan objek instans
        Object.entries(activeThemeConfig).forEach(([cKey, cValue]) => {
          if (cKey !== "selectors") (instance as any)[cKey] = cValue;
        });
      }

      console.log(`[Registry Cache Lock] Configuration successfully fused into cached class instance: "${String(name)}"`);
      return instance.create(contentPayload, activeThemeConfig);
    }

    // console.log(`[Registry Fallback Link] Component "${String(name)}" is running under synchronous legacy fallback pipeline.`);

    // Pastikan wadah objek config bawaan database Sheets eksis di level data mentah
    const finalMergedConfig = {
      ...data.config,
      ...activeThemeConfig,
      selectors: {
        ...(data.config?.selectors || {}),
        ...(activeThemeConfig?.selectors || {})
      }
    };

    // Eksekusi fungsi pabrik asli untuk memicu pembentukan instans awal
    const result = fn(data, finalMergedConfig);

    // 💡 THE SAKRAL RE-ROUTING TRANSITION FLUID:
    // Jika 'result' ternyata mengembalikan sebuah HTMLElement utuh (karena fungsi pendaftarnya hardcoded),
    // kita gunakan taktik Dynamic Prototype Overriding untuk memintas konfigurasinya!
    if (result instanceof HTMLElement) {
      // Jika Anda sudah merubah CarouselBuilder agar .create() menerima parameter kedua,
      // pastikan fungsi bungkusan di main.ts diseragamkan kelak. 
      // Untuk malam ini, kita paksa las data konfigurasinya langsung ke level data input!
      data.config = finalMergedConfig;
      return fn(data, () => Promise.resolve({}));
    }

    // Jika result mengembalikan objek manifest instans sejati, ledakkan parameter keduanya!
    if (result && typeof result === "object" && typeof (result as any).create === "function") {
      const legacyInstance = result as any;
      if (!legacyInstance.config) legacyInstance.config = finalMergedConfig;
      return legacyInstance.create(contentPayload, finalMergedConfig);
    }

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

  // Inside Modules/ComponentRegistry.ts -> THE FINAL FORCED INJECTION CONTRACT

  public setConfig(builderName: keyof iBuilderRegistry, newConfig: Record<string, any>): void {
    console.log(`[Registry Config Central] Storing live configuration inject request for: "${String(builderName)}"`);

    // Lakukan deep-merge terisolasi di dalam Map agar selectors kustom tema tidak hilang saling menimpa
    const existingConfig = this._dynamicConfigs.get(builderName) || {};
    this._dynamicConfigs.set(builderName, {
      ...existingConfig,
      ...newConfig,
      selectors: {
        ...(existingConfig.selectors || {}),
        ...(newConfig.selectors || {})
      }
    });

    console.log(`[Registry Success] Configuration for "${String(builderName)}" officially sealed in dynamic config state.`);
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



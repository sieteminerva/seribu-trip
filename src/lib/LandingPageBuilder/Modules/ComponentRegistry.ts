import type { ComponentBuilderFn, iBasicNode, iBuilderRegistry } from "../interface";
import { NodeTransformer } from "../Utils/NodeTransformer";
import { Builder } from "../Components/Base";
import { DOMTreeMemory } from "./DOMTreeMemory";


// 💡 DEKLARASI KONTAK LAZY LOAD UNTUK MODEL METADATA (STYLE 3)
export interface iSimpleWayManifest {
  path: string;
  stylesheet?: string;
  script?: string;
  config?: any;
  schema?: any;
}

export type LoadFn = (options: { script?: string; stylesheet?: string }) => Promise<any>;

// Polimorfisme Tanda Tangan Registrasi yang Sah di Framework Anda
export type RegisterFn<K extends keyof iBuilderRegistry> =
  | ComponentBuilderFn<iBuilderRegistry[K]> // OldWayFn / Standard murni (Style 1)
  | ((data: iBuilderRegistry[K], load: LoadFn) => Promise<HTMLElement | null>) // ConfigurableWayFn (Style 2)
  | ((data: iBuilderRegistry[K], config?: any) => iSimpleWayManifest); // SimpleWayFn Manifest (Style 3)

// 💡 PETA REGISTER VITE: Hanya aktif dan dibaca saat masa development lokal!
const viteModules = import.meta.glob("/src/**/*.{ts,tsx,js,jsx,css}");

function normalizeVitePath(pathStr: string): string {
  if (!pathStr) return "";
  let clean = pathStr.trim().replace(/\\/g, "/");
  if (clean.startsWith("./")) clean = clean.slice(2);
  if (clean.startsWith("/")) clean = clean.slice(1);
  if (!clean.startsWith("src/")) clean = `src/${clean}`;
  return `/${clean}`;
}

function resolveRelativePath(baseScriptPath: string, stylePath: string): string {
  if (!stylePath) return "";
  if (!stylePath.startsWith("./") && !stylePath.startsWith("../")) {
    return stylePath;
  }
  if (!baseScriptPath) return stylePath;
  const scriptDir = baseScriptPath.substring(0, baseScriptPath.lastIndexOf("/") + 1);
  return (scriptDir + stylePath.replace(/^\.\//, "")).replace(/\/+/g, "/");
}

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

  public getRegisteredNames(): string[] {
    return Array.from(this.builders.keys()) as string[];
  }

  public get(name: string) {
    if (this.has(name)) {
      return this.builders.get(name as keyof iBuilderRegistry);
    }
  }

  public has(name: string): boolean {
    return this.builders.has(name as keyof iBuilderRegistry);
  }

  private async loadModule(script?: string, stylesheet?: string, componentName?: string): Promise<any> {
    let jsModule: any = null;
    let cssModule: any = null;

    if (import.meta.env?.DEV) {
      if (script) {
        const normScript = normalizeVitePath(script);
        const loader = viteModules[normScript] || viteModules[script];
        if (typeof loader === "function") {
          jsModule = await loader();
        } else if (loader) {
          jsModule = loader;
        }
      }
    } else {
      const scriptPromise = script ? import(/* @vite-ignore */ `${script}`) : Promise.resolve(null);
      [jsModule] = await Promise.all([scriptPromise]);
    }

    const builderClass = jsModule?.default
      || (jsModule && Object.values(jsModule).find(v => typeof v === 'function' || (v && typeof (v as any).create === 'function')))
      || jsModule;

    // Resolve stylesheet: explicit > builderClass.stylesheet > builderClass.prototype?.stylesheet > instance.stylesheet
    let effectiveStyle: string | CSSStyleSheet | undefined = stylesheet;

    if (!effectiveStyle && builderClass) {
      let classStyle = builderClass.stylesheet || builderClass.prototype?.stylesheet;

      if (!classStyle && typeof builderClass === "function") {
        try {
          const dummy = new (builderClass as any)({});
          classStyle = dummy?.stylesheet;
        } catch {
          try {
            const dummy = new (builderClass as any)();
            classStyle = dummy?.stylesheet;
          } catch { }
        }
      }

      if (typeof classStyle === "string" || classStyle instanceof CSSStyleSheet) {
        effectiveStyle = classStyle;
      }
    }

    if (effectiveStyle) {
      if (effectiveStyle instanceof CSSStyleSheet) {
        this.injectStyle(effectiveStyle);
      } else if (typeof effectiveStyle === "string") {
        const resolvedCssPath = script ? resolveRelativePath(script, effectiveStyle) : effectiveStyle;
        if (import.meta.env?.DEV) {
          const normCss = normalizeVitePath(resolvedCssPath);
          const loader = viteModules[normCss] || viteModules[resolvedCssPath] || viteModules[effectiveStyle];
          if (typeof loader === "function") {
            cssModule = await loader();
          } else if (loader) {
            cssModule = loader;
          }
        } else {
          cssModule = await import(/* @vite-ignore */ `${resolvedCssPath}`, { with: { type: "css" } }).catch(() => null);
        }
        if (cssModule) {
          const sheet = cssModule.default instanceof CSSStyleSheet ? cssModule.default : cssModule;
          if (sheet instanceof CSSStyleSheet) {
            this.injectStyle(sheet);
          }
        }
      }
    } else if (componentName) {
      console.warn(`[ComponentRegistry] Warning: No stylesheet provided or defined for component "${String(componentName)}".`);
    }

    return builderClass;
  }

  /**
   * 🧙‍♂️ THE PRE-LOAD HYDRATOR
   */
  public async preloadComponents(componentNames: string[], pagesData: any[]): Promise<void> {
    const promises = componentNames.map(async (nameKey) => {
      const name = nameKey as keyof iBuilderRegistry;
      const fn = this.builders.get(name);
      if (!fn) return;

      const matchedData = NodeTransformer.getBuilderNode(pagesData as iBasicNode[], name as string);

      const loadFn: LoadFn = async ({ script, stylesheet }) => {
        const loadedClass = await this.loadModule(script, stylesheet, name as string);
        if (loadedClass) {
          this._resolvedCache.set(name as string, loadedClass);
        }
        return loadedClass;
      };

      try {
        const result = await fn(matchedData || {}, loadFn);

        // Handle Style 3 Manifest object returned by fn
        if (result && typeof result === "object" && !(result instanceof HTMLElement) && !(result instanceof Promise)) {
          const manifest = result as iSimpleWayManifest;
          const scriptPath = manifest.path || manifest.script;
          if (scriptPath || manifest.stylesheet) {
            const loadedClass = await loadFn({ script: scriptPath, stylesheet: manifest.stylesheet });
            if (loadedClass) {
              this._resolvedCache.set(name as string, loadedClass);
            }
          }
        }

      } catch (_err) {
        // Silently swallow errors from synchronous builders invoked with empty dummy data during preloading
      }

    });

    await Promise.all(promises);
  }

  /**
   * ⚡ AMAN & SINKRONUS MURNI (.run Method)
   */



  public build<K extends keyof iBuilderRegistry>(name: K, data: any): HTMLElement | null {
    const fn = this.builders.get(name);
    if (!fn) return null;

    // 1. Fetch dynamic theme configuration registered at runtime via setConfig()
    const activeThemeConfig = this._dynamicConfigs.get(name) || {};

    // Extract content payload: skip extraction for arrays (direct content data)
    let contentPayload = data;
    if (data && typeof data === "object" && !Array.isArray(data) && data.content !== undefined) {
      contentPayload = data.content;
    }

    // 2. Prepare merged configuration for synchronous builder functions
    const userConfig = (data && typeof data === "object" && !Array.isArray(data)) ? (data.config || {}) : {};
    const finalMergedConfig = {
      ...userConfig,
      ...activeThemeConfig,
      selectors: {
        ...(userConfig?.selectors || {}),
        ...(activeThemeConfig?.selectors || {})
      }
    };

    // Stamp merged config onto input data before invoking builder factory
    if (data && typeof data === "object" && !Array.isArray(data) && data.config) {
      data.config = finalMergedConfig;
    }

    // 3. Check if this component has a preloaded class in cache (Style 2/3)
    //    If so, skip the registration function entirely and build directly
    const cachedClass = this._resolvedCache.get(name as string);
    if (cachedClass && typeof cachedClass === "function") {
      // Style 3 manifest builders: use cached class directly
      try {
        const instance = new cachedClass(finalMergedConfig);
        if (instance && typeof instance.create === "function") {
          return instance.create(contentPayload, finalMergedConfig);
        }
      } catch { /* fall through to registration function */ }
    }

    // 4. Invoke builder factory function (Style 1 synchronous builders)
    const dummyLoadFn: LoadFn = ({ script, stylesheet }) => {
      if (script && stylesheet) console.log("[Script & Stylesheet Loaded!]")
      const cached = this._resolvedCache.get(name as string);
      return Promise.resolve(cached || {});
    };

    const result = fn(data, dummyLoadFn);

    // Style 1 (Synchronous returning HTMLElement or custom control objects like Modal)
    if (result && typeof result === "object" && !(result instanceof Promise)) {
      if (result instanceof HTMLElement) {
        return result;
      }

      if (typeof (result as any).create === "function") {
        const instance = result as any;
        if (!instance.config) instance.config = finalMergedConfig;
        if (!instance.stylesheet) {
          console.warn(`[ComponentRegistry] Warning: No stylesheet provided or defined for component "${String(name)}".`);
        }
        return instance.create(contentPayload, finalMergedConfig);
      }

      // If object is NOT a Style 3 Manifest (has no .path or .script), return it directly (e.g. Modal control interface)
      if (!(result as any).path && !(result as any).script) {
        return result as any;
      }
    }

    // Style 3 (Simple Declarative Manifest Object)
    let manifestSchema = contentPayload;
    let manifestConfig = finalMergedConfig;

    if (result && typeof result === "object" && !(result instanceof HTMLElement) && !(result instanceof Promise)) {
      if ((result as any).schema !== undefined) manifestSchema = (result as any).schema;
      if ((result as any).config) {
        manifestConfig = {
          ...finalMergedConfig,
          ...((result as any).config || {}),
          selectors: {
            ...(finalMergedConfig?.selectors || {}),
            ...((result as any).config?.selectors || {})
          }
        };
      }
    }

    // Style 2 & Style 3: Hydrate using PreloadedBuilderClass from _resolvedCache
    const PreloadedBuilderClass = this._resolvedCache.get(name as string);
    if (PreloadedBuilderClass) {
      // Static .create() method
      if (typeof PreloadedBuilderClass.create === "function") {
        return PreloadedBuilderClass.create(manifestSchema, manifestConfig);
      }
      // Class constructor or Factory function
      if (typeof PreloadedBuilderClass === "function") {
        try {
          const instance = new PreloadedBuilderClass(manifestConfig);
          if (instance && typeof instance.create === "function") {
            return instance.create(manifestSchema, manifestConfig);
          }
          if (instance instanceof HTMLElement) {
            return instance;
          }
        } catch {
          const rawResult = PreloadedBuilderClass(manifestSchema, manifestConfig);
          if (rawResult instanceof HTMLElement) return rawResult;
          if (rawResult && typeof rawResult.create === "function") {
            return rawResult.create(manifestSchema, manifestConfig);
          }
        }
      }
      // Instance with .create() method
      if (typeof (PreloadedBuilderClass as any).create === "function") {
        return (PreloadedBuilderClass as any).create(manifestSchema, manifestConfig);
      }
    }

    return null;
  };


  private injectStyle(sheet: CSSStyleSheet): void {
    if (!this.registeredSheets.has(sheet)) {
      this.registeredSheets.add(sheet);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
  }

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

  public clear(): void {

    this._dynamicConfigs.clear();
    this.registeredSheets = new Set<CSSStyleSheet>();

    if (typeof DOMTreeMemory !== "undefined" && typeof DOMTreeMemory?.clear === "function") {
      DOMTreeMemory.clear();
    }

    if (typeof Builder !== "undefined" && typeof Builder.resetCounters === "function") {
      Builder.resetCounters();
    }

    console.log(`🧹 [ComponentRegistry]: Cleaned node registries and instance identity counters.`);
  }

  public destroy() {

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

  //   const PreloadedBuilderClass = this._resolvedCache.get(name);

  //   if (typeof PreloadedBuilderClass === "function") {
  //     const config = data.config || {};
  //     const schema = data.schema || [];

  //     if (typeof PreloadedBuilderClass.create === "function") {
  //       return PreloadedBuilderClass.create(schema, config);
  //     }

  //     return new PreloadedBuilderClass(config).create(schema);
  //   }

  //   // Fallback jika komponen dipanggil instan tanpa lewat fase preload sama sekali
  //   const result = fn(data, () => Promise.resolve({}));
  //   if (result instanceof Promise) return result;
  //   if (result instanceof HTMLElement) return result;
  //   if (result && typeof result === "object") return result;

  //   return null;
  // }
}



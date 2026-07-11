import type { ComponentBuilderFn, iBuilderRegistry } from "./interface";




export class BuilderRegistry {
  // Gunakan tipe data Map internal yang fleksibel namun aman
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
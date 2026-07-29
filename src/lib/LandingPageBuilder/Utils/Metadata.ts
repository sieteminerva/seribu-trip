import type { iMetadataContext } from "../interface";


export function ensureMetadataIdentity(
  selector: string,
  scopeId: string = "",
  childSuffix: string = "",
  templateKey?: string
): { tree: any, key: string } {
  const cleanScope = scopeId || "";
  const cleanLocalKey = `${selector}${childSuffix ? "-" + childSuffix : ""}`;

  // 🟢 HASIL PELEBURAN COMPOSE_GLOBAL_KEY: Penentu mutlak format string koordinat RAM global pusat
  const finalizedGlobalKey = cleanScope ? `${cleanScope}:${cleanLocalKey}` : cleanLocalKey;

  return {
    tree: {
      scope: cleanScope,
      key: cleanLocalKey,
      template: templateKey || cleanLocalKey,
      parent: null as string | null,
      children: [] as string[]
    },
    key: finalizedGlobalKey // Alamat GPS Absolut Terpadu (e.g. "page-admin:input.form-control")
  };
}

export function setMetadata(element: HTMLElement, localRecordsPool: any[], _rootPartKey?: string): void {
  if (!element || !localRecordsPool) return;

  // Kunci salinan array records di dalam closure agar rebasing context tidak menimpa sumber aslinya
  const capturedRecords = localRecordsPool.map((item: any) => ({
    ...item,
    relations: item?.relations ? { ...item.relations, children: item.relations.children ? [...item.relations.children] : [] } : null
  }));

  element.getMetadata = (context?: iMetadataContext): any[] => {
    if (!context) return capturedRecords;

    const scopeId = context.scopeId ?? "";
    const parentKey = context.parentKey ?? null;

    const keyMap = new Map<string, string>();

    // PUTARAN 1: Petakan koordinat perpindahan alamat menggunakan hukum tunggal ensureMetadataIdentity!
    capturedRecords.forEach((item: any) => {
      const origin = item.relations || {};

      // Gunakan langsung setter tunggal warisan emas Anda!
      const originGlobalKey = ensureMetadataIdentity(origin.key, origin.scope).key;
      const rebasedGlobalKey = ensureMetadataIdentity(origin.key, scopeId).key;

      keyMap.set(originGlobalKey, rebasedGlobalKey);
    });

    // PUTARAN 2: Jalankan eksekusi rebasing silsilah graf secara total, horizontal, anti salah alamat!
    capturedRecords.forEach((item: any) => {
      const origin = item.relations || {};

      const originGlobalKey = ensureMetadataIdentity(origin.key, origin.scope).key;
      const rebasedGlobalKey = keyMap.get(originGlobalKey) || ensureMetadataIdentity(origin.key, scopeId).key;

      if (!item.relations) item.relations = {};
      item.relations.scope = scopeId;
      item.relations.template = origin.template || origin.key;

      const isRootCandidate = origin.parent === null || origin.parent === undefined || origin.parent === "";

      if (isRootCandidate) {
        item.relations.parent = parentKey;
      } else if (origin.parent) {
        item.relations.parent = keyMap.get(origin.parent) || origin.parent;
      }

      const originChildren = Array.isArray(origin.children) ? origin.children : [];
      item.relations.children = originChildren.map((childKey: string) => keyMap.get(childKey) || childKey);

      // Simpan key ter-rebase absolut agar terbaca akurat satu pintu di level sasis terluar DOMTreeMemory
      item.relations.key = rebasedGlobalKey;
    });

    return capturedRecords;
  };
}





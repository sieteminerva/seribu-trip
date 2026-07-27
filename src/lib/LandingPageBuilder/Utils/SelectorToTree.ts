import type { iNodeRecordItem } from "../interface";

/**
   * 👑 THE SOVEREIGN SELECTOR GRAPH PARSER (SIHIR KILAT HASIL IDE DEWA ANDA!)
   * Membedah kamus selectors kaku milik anak komponen menggunakan split(">") JIT di RAM,
   * lalu memutahkan peta silsilah komposit utuh Record<TType, relations> untuk siap di-merge!
   * @param scopeId
   * @param selectors Kamus config.selectors milik komponen anak (e.g. this.config.selectors)
   * @returns Peta silsilah kedaulatan internal elemen yang suci bersih
   */
export function selectorToTree(scopeId: string, selectors: Record<string, any>): Record<string, iNodeRecordItem["relations"]> {
  const allKeys = Object.keys(selectors);
  const hasContainerRoot = allKeys.includes("@container");
  const ambientActiveParentScope = (globalThis as any).DOMTreeMemory?.activeParentScopeKey;
  const hasAmbientParent = ambientActiveParentScope && ambientActiveParentScope !== scopeId;

  const scopedRelation = {} as Record<string, iNodeRecordItem["relations"]>;

  for (const currentKey of allKeys) {
    const globalCurrentKey = `${scopeId}:${currentKey}`;

    if (!scopedRelation[currentKey]) {
      scopedRelation[currentKey] = { scope: scopeId, key: currentKey, parent: null, children: [] };
    }

    if (currentKey.includes(">")) {
      const parts = currentKey.split(">");
      parts.pop();
      const parentTypeKey = parts.join(">");
      // const globalParentKey = `${scopeId}:${parentTypeKey}`;

      if (!scopedRelation[parentTypeKey]) {
        scopedRelation[parentTypeKey] = { scope: scopeId, key: parentTypeKey, parent: null, children: [] };
      }

      scopedRelation[currentKey].parent = parentTypeKey;
      if (!scopedRelation[parentTypeKey].children.includes(currentKey)) {
        scopedRelation[parentTypeKey].children.push(globalCurrentKey);
      }
    }
    else {
      if (currentKey !== "@container" && hasContainerRoot) {
        const globalContainerKey = `${scopeId}:@container`;

        if (!scopedRelation[globalContainerKey]) {
          scopedRelation[globalContainerKey] = { scope: scopeId, key: "@container", parent: null, children: [] };
        }

        scopedRelation[currentKey].parent = globalContainerKey;
        if (!scopedRelation[globalContainerKey].children.includes(currentKey)) {
          scopedRelation[globalContainerKey].children.push(currentKey);
        }
      } else if (currentKey === "@container" || !hasContainerRoot) {
        if (hasAmbientParent) {
          scopedRelation[currentKey].parent = `${ambientActiveParentScope}:@container`;
        }
      }
    }
  }

  return scopedRelation;

}
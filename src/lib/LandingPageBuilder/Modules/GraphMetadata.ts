import type { iNodeRecordItem, iNodeRecords } from "../interface";

export class GraphMetadata {
  // Pangkalan penanda global penentu rahim bapak aktif saat ini
  public static activeParentScopeKey: string | null = null;

  /**
   * 📌 PIPELINE WELD: Menjahit data korelasi silsilah parent-child murni di level RAM objek
   */
  public static attach(scopeId: string, typeKey: string, element: HTMLElement, raw: any, proxy: any): iNodeRecordItem {
    const globalStorageKey = `${scopeId}:${typeKey}`;
    const currentParentKey = GraphMetadata.activeParentScopeKey;

    const newItem: iNodeRecordItem = {
      element,
      relations: {
        parent: (currentParentKey !== globalStorageKey) ? currentParentKey : null,
        children: []
      },
      raw,
      proxy
    };

    // Cari instansi bapak di dalam pool memori (jika ada), lalu daftarkan token kunci si anak!
    if (currentParentKey && currentParentKey !== globalStorageKey) {
      // Akses secara sunyi bypass lewat penunjuk internal map hantaran global
      const parentRecord = (GraphMetadata as any)._nodesProxyRef?.get(currentParentKey);
      if (parentRecord && parentRecord.records.length > 0) {
        const activeParentItem = parentRecord.records[parentRecord.records.length - 1];
        if (activeParentItem && !activeParentItem.relations.children.includes(globalStorageKey)) {
          activeParentItem.relations.children.push(globalStorageKey);
          console.log(`👶 [Graph Engine]: Linked child "${globalStorageKey}" safely into parent "${currentParentKey}"`);
        }
      }
    }

    return newItem;
  }

  /**
   * 💥 PURGE CASCADE REKURSIF: Penghancur massal silsilah bersarang yang 100% aman anti-leak!
   */
  public static purge(scopeId: string, nodesMap: Map<string, iNodeRecords>): void {
    // Sediakan jembatan bypass internal untuk fungsi weld di atas agar tidak kembung circular import
    (GraphMetadata as any)._nodesProxyRef = nodesMap;

    const prefixFilter = `${scopeId}:`;

    for (const [globalKey, record] of nodesMap.entries()) {
      if (globalKey.startsWith(prefixFilter)) {

        record.records.forEach((item) => {
          // 🟢 AMUNISI REKURSIF PROPOSAL DEWA ANDA: Babat habis seluruh anak cucunya!
          if (item.relations!.children!.length > 0) {
            item.relations!.children?.forEach((childGlobalKey) => {
              console.log(`🔥 [Graph Purge]: Obliterating nested dynamic child relation node: "${childGlobalKey}"`);

              const childRecord = nodesMap.get(childGlobalKey);
              if (childRecord) {
                childRecord.records.forEach(r => r.element?.remove()); // Cabut fisik dari DOM
              }
              nodesMap.delete(childGlobalKey); // Sapu resik memorinya dari RAM pusat!
            });
          }
          // Cabut bodi fisik dirinya sendiri dari layar browser
          if (item.element && typeof item.element.remove === "function") item.element.remove();
        });

        nodesMap.delete(globalKey);
      }
    }
    console.log(`🧹 [Graph Engine]: Wiped tracking relations nodes context for builder scope: "${scopeId}"`);
  }
}

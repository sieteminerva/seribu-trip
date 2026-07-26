import type { iBuilderRegistry } from "../interface";
import { ComponentRegistry } from "./ComponentRegistry";

export interface iGraphMetadataNode {
  nodeId: string;               // ID Unik Node (Format: "route:builderId:entityId" atau "route:plain-dom-id")
  routePath: string;           // Rute pemilik (e.g., "blog", "product", "gallery")
  themeId: string;             // Terikat dengan ThemeRenderer mana saat dicetak

  // 🎭 KASTA 1: POINTER UTAMAA ELEMEN FISIK
  element: HTMLElement;

  // 🎭 KASTA 2: METADATA SILSILAH (THE PARENT-CHILD RELATION LINKER)
  parentId: string | null;     // Menunjuk nodeId milik bapak yang melahirkannya
  childrenIds: Set<string>;    // Daftar seluruh nodeId anak cucu yang lahir di dalam perutnya

  // 🎭 KASTA 3: STATUS KESEGARAN DATA
  builderName: string | null;  // Mengidentifikasi builder pemilik (e.g., "product-card", null jika plain HTML)
  dataSnapshot: string;        // Hasil JSON.stringify(data) asli server Sheets untuk validasi cache
  status: "active" | "cached" | "detached"; // State daur hidup di level RAM
}


export class GraphMetadata {
  // Pangkalan militer tunggal pelacak silsilah lintas semesta komponen Anda
  private static registry = new Map<string, iGraphMetadataNode>();

  // Penunjuk ambien rute dan bapak aktif saat ini
  public static currentActiveRoute: string = "home";

  /**
   * 🚀 GERBANG AUTOMATED RESOLVE PARENT (KUNCIAN REVOLUSIONER UNTUK EVENT EMITTER ANDA!)
   * Cerdas memburu siapa bapak pemilik elemen kontainer hantaran dari event payload JIT!
   */
  public static resolveParentIdByElement(childElement: HTMLElement, currentBuilderId: string): string | null {
    // 1. Jika anak lahir dari constructor normal, gunakan ambient parent scope aktif
    if (this.currentActiveRoute && currentBuilderId === "landing-page") {
      return `${this.currentActiveRoute}:root`;
    }

    // 2. 🧙‍♂️ SIHIR EVENT EMITTER: Cari di level live DOM tree bapak terdekatnya 
    // yang sudah terdaftar legal di dalam Map registry global kita!
    let currentParentDOM = childElement.parentElement;

    while (currentParentDOM) {
      for (const [nodeId, nodeRecord] of this.registry.entries()) {
        if (nodeRecord.element === currentParentDOM) {
          // KETEMU! Kembalikan Node ID bapak angkatnya tempat ia menempel di Event!
          return nodeId;
        }
      }
      currentParentDOM = currentParentDOM.parentElement; // Merangkak naik ke atas pohon DOM HTML
    }

    // Fallback keamanan: Jika lahir mengambang tanpa bapak (portal), ikat langsung ke root halaman aktif
    return `${this.currentActiveRoute}:root`;
  }

  /**
   * 🚀 TRACK NODE: Mencatat kelahiran elemen fresh dari pipa mana pun secara terpadu
   */
  public static track(nodeId: string, node: iGraphMetadataNode): void {
    this.registry.set(nodeId, node);

    // Update daftar children di level bapaknya secara otomatis agar hubungan dua arah terkunci!
    if (node.parentId && this.registry.has(node.parentId)) {
      this.registry.get(node.parentId)!.childrenIds.add(nodeId);
    }
  }

  /**
   * 💥 OBLITERATE CASCADE: Pemusnah massal rekursif saat tab berganti 
   * atau modal ditutup via destroyOnClose=true!
   */
  public static obliterate(nodeId: string): void {
    const node = this.registry.get(nodeId);
    if (!node) return;

    console.log(`💀 [Graph Matrix Purge]: Deep cleaning family node tree for: "${nodeId}"`);

    // 🟢 REKURSIF SWEEP: Buru dan hancurkan seluruh anak cucu keturunannya sampai ke akar atomik!
    if (node.childrenIds.size > 0) {
      node.childrenIds.forEach((childId) => {
        this.obliterate(childId); // Turun ke anak di lantai bawah secara rekursif!
      });
      node.childrenIds.clear();
    }

    // Cabut fisik DOM-nya dari layar peramban browser
    if (node.element && typeof node.element.remove === "function") {
      node.element.remove();
    }

    // Likuidasi instansi buildernya dari pool ComponentRegistry untuk mencuci bersih RAM
    if (node.builderName) {
      const builderInstance = new ComponentRegistry();
      builderInstance.get(node.builderName as keyof iBuilderRegistry)
      if (builderInstance && typeof builderInstance.destroy === "function") {
        builderInstance.destroy();
      }
    }

    // Hapus total catatan koordinatnya dari Map pusat global (0B leak secured!)
    this.registry.delete(nodeId);
  }
}

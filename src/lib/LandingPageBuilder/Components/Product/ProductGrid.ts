// Components/ProductCardComponent.ts (The Pure Grid List Factory Component)
import { Builder } from "../Base";
import { ProductCardBuilder } from "./ProductCard";

export class ProductGridBuilder extends Builder<"@grid" | "@grid>container", any> {
  readonly builderId = "product-card-grid" as any;
  readonly name = "product-card-grid" as any;
  stylesheet: string = "";

  constructor() {
    super();
    this.config = {
      selectors: {
        "@grid": { tagName: "section", className: "grid" },
        "@grid>container": { tagName: "div", className: "row full-width" }
      }
    };
  }

  /**
   * 👑 PINTU PREPARE: Melumat array massal kiriman dari ProductController pusat
   */
  public prepare(data: any): HTMLElement {
    const rawList = Array.isArray(data.content) ? data.content : [];

    // 1. Lahirkan cangkang luar grid list
    const gridRoot = this.render("@grid", rawList);
    const container = this.render("@grid>container", rawList);

    // ====================================================
    // 🧱 COMPONENT INSTANTIATION LOOP (PARADE KELAHIRAN KARTU KAOS)
    // Memutar data array, memicu pembuatan instansi ProductCardBuilder segar,
    // lalu menancapkan fisiknya ke rahim kolom grid secara linear!
    // ====================================================

    rawList.forEach((productData: any) => {
      // Nyalakan instansi kartu produk kustom terisolasi bawaan resep kemarin malam
      const cardComponent = new ProductCardBuilder({
        optionShape: "round",
        autoplay: false,
        duration: 3500,
        mode: "auto"
      });

      const rawFabrics = Array.isArray(productData.fabrics) ? productData.fabrics : [];
      const baseImage = productData.artwork?.src || productData.src || "";

      const mappedVariants = rawFabrics.map((fabric: any) => ({
        name: fabric.color,
        color: fabric.HEX,      // Ambil kode HEX untuk disiram ke background-color bapak
        src: baseImage       // Gunakan aset gambar transparan yang sama untuk di-multiply!
      }));

      // Bungkus kembali ke dalam properti internal state
      const productItem = {
        id: productData.uid || `prod-${Math.random().toString(36).substring(7)}`,
        title: productData.caption?.title || productData.name || "T-Shirt",
        description: productData.caption?.description || "",
        price: productData.price === "getPrice" ? "Rp 85.000" : String(productData.price), // Fallback sample price tag
        variants: mappedVariants
      };

      // Tembakkan pembuatan bodi fisik JIT membawa data pakaian
      const cardDOMElement = cardComponent.create(productItem);

      if (cardDOMElement instanceof HTMLElement && container) {
        container.appendChild(cardDOMElement);
      }
    });

    if (container && gridRoot) {
      gridRoot.appendChild(container);
    }

    return this.load("@grid") as HTMLElement;
  }

  protected template(_typeKey: string, _el: HTMLElement, _payload?: any): void { }
  public initialize(): void { }
}

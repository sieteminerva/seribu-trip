
import { FormBuilder } from "../lib/LandingPageBuilder/Components/Form/Form";
import type { iBasicNode } from "../lib/LandingPageBuilder/interface";
import type { LandingPageBuilder, iPageController } from "../lib/LandingPageBuilder/LandingPage";

export class WizardPage implements iPageController {
  readonly route = "wizard";
  readonly name: string = "wizard"
  builder: LandingPageBuilder;

  constructor(
    Builder: LandingPageBuilder
  ) {
    this.builder = Builder;
  }

  // Hook onPrepare: dipanggil oleh LandingPageBuilder sebelum merender rute 'wizard'
  async onPrepare(context: any) {

    // Ambil sub-route (nama halaman yang ingin diedit) dari pending fragment, default ke 'home'
    // const targetSubRoute = (this.builder.currentRoute).toLowerCase();

    // Ambil data asli halaman tersebut dari pages registry
    const menu = context.menu;
    if (!(context.menu instanceof HTMLElement) && context.menu?.content) {
      context.menu = this.attachMenu(menu!);
    }

    // const originalPageContent = context.pages[targetSubRoute] || [];
    // console.log({ targetSubRoute, originalPageContent, menu: context.builder.menu })
    // console.log(context)
    context.pages = this.content()
    return context;
  }

  // Hook onReady: dipanggil setelah elemen dashboard selesai dirender di DOM
  onReady(elements: Map<string, HTMLElement>, shell: HTMLElement) {
    console.log("[Wizard] Page DOM is ready", elements, shell);
  }

  // Hook onDestroy: dipanggil saat berpindah dari rute 'dashboard'
  onDestroy() {
    console.log("[Wizard] Cleaning up and destroying page...");
  }

  attachMenu(menuNode: iBasicNode) {
    const name = "wizard";
    if (!menuNode.content.actions) {
      menuNode.content.actions = []
    }
    const item = {
      href: `#${name}`,
      title: "Wizard",
      label: "Wizard",
      attrs: {
        style: "width:1.8rem; height:1.8rem;"
      },
    }

    if (!menuNode.content.navigations.some((i: any) => i.href === `#${name}`)) {
      menuNode.content.navigations.push(item)
    }

    // console.log(menuNode)
    return menuNode;
  }

  content() {
    console.log("[Creating Settings Form]")
    const formConfig = {
      id: "wizardo",
      multistep: true,
      selectors: {
        "@form>group": { tagName: "fieldset", className: "inline-style" },
      },
      // submitButton: false,
    };

    const IntroSet = {
      id: "intro-set",
      group: [
        {
          type: "select",
          id: "web-type",
          title: "Jenis maha karya yang ingin kamu tunjukkan ke dunia adalah website",
          placeholder: "berjenis apa?",
          config: {
            options: [
              { value: "blog", label: "Catatan Cerita / Blog" },
              { value: "ecommerce", label: "Toko Online / E-Commerce" },
              { value: "profile", label: "Profil Pribadi" },
              { value: "news", label: "Warta & Berita" },
              { value: "portfolio", label: "Galeri Portofolio" },
              { value: "gallery", label: "Etalase Visual" }
            ]
          }
        },
        {
          type: "text",
          id: "web-name",
          title: "Kamu akan meluncurkannya dengan alamat nama digital",
          placeholder: "namapilihanmu.com",
          config: {
            popover: WizardPage.createPopover({
              info: "Alamat unik ini akan menjadi pintu gerbang utama orang-orang menemukan tokomu.",
              placeholder: "Contoh: rona-rajutan.com atau kriya-kayu.id"
            })
          }
        },
        {
          type: "textarea",
          id: "web-reason",
          title: "Di mana di dalam halaman utamanya, kamu ingin berkisah secara singkat bahwa website ini hadir untuk",
          placeholder: "Ceritakan alasan atau mimpi besar di balik karyamu...",
          config: {
            popover: WizardPage.createPopover({
              info: "Tuliskan satu kalimat pemikat (Hero Headline) yang akan langsung dibaca pengunjung pertama kali.",
              placeholder: "Contoh: Membawa kehangatan anyaman tradisi ke ruang modern minimalis."
            })
          }
        },
        {
          type: "text",
          id: "web-author",
          title: "Situs web ini dirancang secara personal, dan dirajut oleh tangan dingin",
          placeholder: "nama indahnya kamu...",
          config: {
            popover: WizardPage.createPopover({
              info: "Kamu bebas menuliskan nama lengkapmu, nama panggilan, atau nama studio usahamu.",
              placeholder: "Beri tahu dunia siapa pemilik sah karya ini."
            })
          }
        },
      ]
    }

    const DetailSet = {
      id: "detail-set",
      group: [
        {
          type: "file",
          id: "product",
          title: "Untuk mengisi seluruh isi etalase datanya secara instan, silakan unggah baris berkas CSV",
          placeholder: "Pilih file template .csv data...",
          config: {
            attributes: [
              { name: "data-max-upload", value: 1 },
              { name: "accept", value: ".csv, text/csv" },
              { name: "data-uploader-csv", value: "true" }
            ],
            popover: WizardPage.createPopover({
              info: "Kami akan membaca isi teks CSV ini dan mengubahnya menjadi baris tabel interaktif di halaman berikutnya.",
              placeholder: "Mendukung format ekspor Excel standar (.csv)"
            })
          }
        },
      ]
    }

    const ContactSet = {
      id: "contact-set",
      group: [
        {
          type: "email",
          id: "email",
          title: "Jika ada pengunjung atau calon pembeli yang ingin menyapa, surat elektronik mereka akan mendarat di kotak masuk",
          placeholder: "alamat email aktifmu",
          config: {
            popover: WizardPage.createPopover({
              placeholder: "contoh ruang.karya@indonesia.com",
              info: "Alamat email akan dicantumkan sebagai contact di website."
            })
          }
        },
        {
          type: "text",
          id: "company",
          title: "Seluruh hak cipta dan kepemilikan operasional website ini bernaung di bawah payung nama",
          placeholder: "nama badan usaha / studionya",
          config: {
            popover: WizardPage.createPopover({
              placeholder: "contoh PT.Ruang Karya",
              info: "Nama perusahaan juga akan dicantumkan di website"
            })
          }
        },
        {
          type: "file",
          id: "logo",
          title: "Dan sebagai penanda identitas visual yang khas, mari sematkan gambar logo usahamu",
          placeholder: "unggah logo tokomu disini..."
        },
      ]
    }

    const AddressSet = {
      id: "address-set",
      group: [
        {
          type: "textarea",
          id: "jalan",
          title: "Pusat workshop atau rumah tempat kamu melahirkan seluruh karya hebat ini beralamat di",
          placeholder: "Tuliskan nama jalan, nomor rumah, atau ruko usahamu...",
          config: {
            popover: WizardPage.createPopover({
              info: "Alamat fisik ini akan memandu sistem peta direktori untuk mempromosikan lokasi workshop-mu.",
              placeholder: "Contoh: Jl. Tenun Ikat No. 12B, RT 02/RW 04"
            })
          }
        },
        {
          type: "select",
          title: "Tepatnya, wilayah tersebut berada di cakupan wilayah",
          placeholder: "pilih provinsi...",
          config: { className: "loading", attributes: [{ name: "data-level", value: "propinsi" }] }
        },
        {
          type: "select",
          title: "pada wilayah administrasi daerah",
          placeholder: "pilih kota/kabupaten...",
          config: { attributes: [{ name: "data-level", value: "kota" }] }
        },
        {
          type: "select",
          title: "meluas ke area wilayah tingkat",
          placeholder: "pilih kecamatan...",
          config: { attributes: [{ name: "data-level", value: "kecamatan" }] }
        },
        {
          type: "select",
          title: "hingga menyentuh batas terkecil di",
          placeholder: "pilih kelurahan...",
          config: { attributes: [{ name: "data-level", value: "kelurahan" }] }
        },
        {
          type: "text",
          title: "dengan penguncian kode pos resmi",
          placeholder: "kodepos",
          config: { attributes: [{ name: "data-level", value: "kodepos" }] }
        },
      ]
    }


    const formContent = [
      IntroSet,
      DetailSet,
      ContactSet,
      AddressSet
    ]

    const form = new FormBuilder(formConfig).create(formContent);
    form.addEventListener("formSubmit", (e: any) => {
      const detail = e.detail;

      console.log("AAA", e.detail)
      detail.complete(true, true)
    })
    return [
      {
        content: [
          {
            tagName: "h3",
            className: "title",
            content: "Rakit Website Modern dengan Bahasa Manusia"
          },
          {
            tagName: "p",
            className: "description",
            content: "Anda berada di tempat yang tepat jika saat ini mulai menyadari pentingnya website bagi eksistensi diri, merek dagang, maupun identitas usaha Anda. Kehadiran website kini telah menjadi kebutuhan dasar dalam menghadapi persaingan bisnis di era digital. Keluhan serta keresahan Anda mungkin salah satu yang terbisik sampai ke telinga kami, mendorong hati kecil kami untuk merajut tautan ini..."
          },
        ]
      },
      {
        content: form
      }
    ]

  }

  static createPopover(content: { info: string, placeholder: string }) {
    const popover = document.createElement("div");
    popover.className = "input-popover";
    popover.popover = "manual";

    const input = document.createElement("textarea");
    input.placeholder = content.placeholder;

    const label = document.createElement("label");
    label.className = "info";
    label.textContent = content.info;

    popover.append(input, label)

    return popover;
  }
}

import type { iBasicNode } from "./lib/LandingPageBuilder/interface";

export const HomePageContent: iBasicNode[] = [
  {
    name: "Hero",
    tagName: "section",
    id: "hero-section",
    className: "section row align-mid stackable",
    options: {
      fieldTypes: {
        selector: {
          "p.eyebrow": "text",
          "h2.title": "text",
          "p.description": "textarea"
        },
        property: {
          "title": "text",
          "image": "file",
          "description": "textarea"
        }
      },
    },
    content: [
      {
        tagName: "div",
        className: "column half",
        content: [
          { tagName: "p", className: "eyebrow", content: "Private Trip Keluarga • Kepulauan Seribu" },
          { tagName: "h2", className: "title", content: "Liburan laut yang tenang dan privat." },
          { tagName: "p", className: "description", content: "Kami menyusun perjalanan keluarga ke pulau impian dengan itinerary yang jelas, fasilitas yang nyaman, dan dukungan tim lokal yang siap membantu setiap langkahnya." }
        ]
      },
      {
        tag: "div",
        id: "carousel-container",
        className: "column half",
        builder: "carousel",
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            title: "Eksplorasi Keindahan",
            description: "Nikmati perjalanan privat yang nyaman dan tenang bersama keluarga.",
            image: "https://placehold.co/640x420/1e3a5f/ffffff?text=Kepulauan+Seribu",
          },
          {
            title: "Pantai Pasir Putih",
            description: "Menghabiskan waktu dengan pemandangan sunset yang luar biasa.",
            image: "https://placehold.co/640x420/8764b5/ffffff?text=Pantai+Pasir+Putih",
          },
          {
            title: "Aktivitas Menyenangkan",
            description: "Snorkeling dan aktivitas air lain yang disesuaikan untuk semua umur.",
            image: "https://placehold.co/640x420/3c2554/ffffff?text=Petualangan+Seru",
          },
          {
            title: "Eksplorasi Keindahan",
            description: "Nikmati perjalanan privat yang nyaman dan tenang bersama keluarga.",
            image: "https://placehold.co/640x420/1e3a5f/ffffff?text=Kepulauan+Seribu",
          },
          {
            title: "Pantai Pasir Putih",
            description: "Menghabiskan waktu dengan pemandangan sunset yang luar biasa.",
            image: "https://placehold.co/640x420/8764b5/ffffff?text=Pantai+Pasir+Putih",
          },
          {
            title: "Aktivitas Menyenangkan",
            description: "Snorkeling dan aktivitas air lain yang disesuaikan untuk semua umur.",
            image: "https://placehold.co/640x420/3c2554/ffffff?text=Petualangan+Seru",
          },
          {
            title: "Eksplorasi Keindahan",
            description: "Nikmati perjalanan privat yang nyaman dan tenang bersama keluarga.",
            image: "https://placehold.co/640x420/1e3a5f/ffffff?text=Kepulauan+Seribu",
          },
          {
            title: "Pantai Pasir Putih",
            description: "Menghabiskan waktu dengan pemandangan sunset yang luar biasa.",
            image: "https://placehold.co/640x420/8764b5/ffffff?text=Pantai+Pasir+Putih",
          },
          {
            title: "Aktivitas Menyenangkan",
            description: "Snorkeling dan aktivitas air lain yang disesuaikan untuk semua umur.",
            image: "https://placehold.co/640x420/3c2554/ffffff?text=Petualangan+Seru",
          }
        ],
      }
    ]
  },
  {
    name: "Stats",
    id: "stats-section",
    tagName: "section",
    // where is the best place to put the .options ?
    options: {
      fieldTypes: {
        selector: {
          "p.eyebrow": "text",
          ".rating": "text",
          ".description": "textarea"
        }
      },
    },
    content: [
      {
        className: "column full compact",
        // because we can also put it here <= ?
        content: {
          tagName: "p", className: "eyebrow", content: "Keunggulan perusahaan",
        }
      },
      {
        className: "row card",
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            className: "column stat",
            content: [
              { tagName: "strong", className: "rating", content: "4.9/5" },
              { tagName: "span", className: "description", content: "rating keluarga yang telah berangkat" }
            ]
          },
          {
            className: "column stat",
            content: [
              { tagName: "strong", className: "rating", content: "24/7" },
              { tagName: "span", className: "description", content: "support lapangan dan koordinasi darurat" }
            ]
          },
          {
            className: "column stat",
            content: [
              { tagName: "strong", className: "rating", content: "100%" },
              { tagName: "span", className: "description", content: "tim lokal asal pulau dan kru yang terpercaya" }
            ]
          }
        ]
      }
    ],
  },
  {
    name: "About",
    id: "about-section",
    tagName: "section",
    className: "row card",
    content: [
      {
        tagName: "div",
        className: "column half",
        content: [
          { tagName: "p", className: "eyebrow", content: "Tentang Kami" },
          { tagName: "h2", className: "title", content: "Operator lokal resmi yang menggabungkan kenyamanan, ketepatan, dan sentuhan personal." },
          { tagName: "p", className: "description", content: "Kami merancang setiap trip dengan memperhatikan kebutuhan keluarga: jadwal yang tidak terburu-buru, fasilitas yang aman, dan pengalaman yang terasa hangat serta berkesan." },
        ]
      },
      {
        tagName: "div",
        className: "column half",
        content: [
          {
            tagName: "img",
            className: "img-fluid",
            src: encodeURI("https://placehold.co/720x420/8764b5/ffffff?text=Tim+Lokal"),
          },
        ],
      }
    ],
  },
  {
    name: "Benefit",
    id: "benefit-section",
    className: "row",
    tagName: "section",
    options: {
      fieldTypes: {
        selector: {
          "h3.title": "text",
          "p.description": "textarea",
        },
      },
    },
    content: [
      {
        name: "Kenapa Memilih Kami",
        id: "benefits-section",
        className: "column card",
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            tagName: "div", className: "row", content: [
              { tagName: "h3", className: "title", content: "Trip privat", },
              { tagName: "p", className: "description", content: "Trip privat dan tidak digabungkan dengan kelompok lain." },
            ]
          },
          {
            tagName: "div", className: "row", content: [
              { tagName: "h3", className: "title", content: "Harga jelas" },
              { tagName: "p", className: "description", content: "Estimasi harga yang jelas sebelum pembayaran." },
            ]
          },
          {
            tagName: "div", className: "row", content: [
              { tagName: "h3", className: "title", content: "Support penuh" },
              { tagName: "p", className: "description", content: "Tim lapangan yang siap membantu dari keberangkatan hingga kembali." },
            ]
          },
        ],
      },
      {
        name: "Rencana Perjalanan",
        id: "itinerary-section",
        className: "column card",
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            tagName: "div", className: "row", content: [
              { tagName: "h3", className: "title", content: "1. Persiapan & Keberangkatan" },
              { tagName: "p", className: "description", content: "Koordinasi yang jelas, jadwal kumpul yang rapi, dan transportasi yang sudah dipilih sesuai kebutuhan." },
            ]
          },
          {
            tagName: "div", className: "row", content: [
              { tagName: "h3", className: "title", content: "2. Aktivitas di Pulau" },
              { tagName: "p", className: "description", content: "Snorkeling, santai di pantai, sunset, dan pilihan add-ons yang dapat disesuaikan dengan usia anggota keluarga." },
            ]
          },
          {
            tagName: "div", className: "row", content: [
              { tagName: "h3", className: "title", content: "3. Kembali dengan Kenangan" },
              { tagName: "p", className: "description", content: "Semua dokumen, tiket, dan informasi trip akan dikirimkan dengan rapi untuk memudahkan perjalanan pulang." },
            ]
          },
        ],
      },
    ]
  },
  // advanced writing object
  {
    name: "CTA",
    'section#cta-section.section.banner': {
      content: {
        'h2.title': { content: "Siap merancang liburan keluarga yang nyaman?" },
        'div.actions': {
          onCreated: (el: HTMLElement, _render: any, build: (name: string, data: any) => HTMLElement | null) => {
            const btn = document.createElement("button");
            btn.className = "button primary";
            btn.textContent = "Pesan Sekarang";

            // sss
            btn.addEventListener("click", () => {
              const form = build("form", OrderFormSchema.content);

              // console.log(form)
              if (form) {
                const modal = build("modal", form);
                if (modal) {
                  (modal as any).open()
                }
              }


              // console.log("content.ts>HomePageContent>CTA.onCreated", modal)
            });
            el.mount(btn);
          }
        }
      }
    }
  },
  {
    name: "Trust",
    id: "trust-section",
    tagName: "section",
    className: "row card transparent",
    content: [
      { tagName: "p", className: "eyebrow", content: "Keamanan & Kepercayaan" },
      { tagName: "h2", className: "title", content: "Semua titik perjalanan kami dikelola dengan perhatian pada keamanan dan kenyamanan." },
      { tagName: "p", className: "description", content: "Nomor kontak darurat, manifest data penumpang, dan dokumentasi trip kami siapkan dengan detail sehingga Kakak bisa berangkat dengan tenang." },
    ]
  },
  {
    name: "FAQ",
    id: "faq-section",
    tagName: "section",
    className: "row",
    options: {
      fieldTypes: {
        selector: {
          "h2.title": "text",
        },
        property: {
          title: "text",
          description: "textarea"
        }
      },
    },
    content: [
      { tagName: "h2", className: "title txt-center", content: "Pertanyaan Populer (FAQ)" },
      {
        className: "column full compact",
        builder: "accordion",
        // isRoot: true,
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            title: "Apakah ada batas minimal peserta untuk booking?",
            description: "Tidak. Kami siap membantu rombongan kecil maupun besar, dan kami akan menyesuaikan paket sesuai kebutuhan Kakak."
          },
          {
            title: "Apakah bisa reschedule jika cuaca buruk?",
            description: "Ya. Jika operasional dibatalkan karena faktor cuaca atau otoritas pelabuhan, kami akan membantu penjadwalan ulang dengan transparan."
          },
          {
            title: "Apakah pembayaran bisa melalui QRIS?",
            description: "Ya. Kami mendukung pembayaran QRIS dan akan langsung mengonfirmasi status transaksi setelah pembayaran berhasil."
          },
        ],
      }
    ]
  }
];

const OrderFormSchema = {
  id: "order-form",
  builder: "form",
  content: [
    {
      legend: "1. Data Kontak Koordinator",
      group: [
        {
          type: "text",
          id: "input-name",
          name: "name",
          title: "Nama Lengkap Kakak",
          placeholder: "Contoh: Budi Santoso",
          required: true,
          config: { useLabel: true },
        },
        {
          type: "tel",
          id: "input-phone",
          name: "phone",
          title: "Nomor WhatsApp (Aktif)",
          placeholder: "Contoh: 081234567890",
          required: true,
          info: "E-Tiket dan update manifest akan dikirim ke nomor ini via WhatsApp.",
          config: { useLabel: true },
        },
        {
          type: "tel",
          id: "emergency-contact",
          name: "emergencyPhone",
          title: "Emergency Contact (Aktif)",
          placeholder: "Contoh: 081234567890",
          required: true,
          info: "Nomor darurat selain peserta yang turut melakukan perjalanan.",
          config: { useLabel: true },
        },
        {
          type: "number",
          id: "input-pax",
          name: "pax",
          title: "Jumlah Anggota Peserta (Pax)",
          min: 1,
          value: 4,
          required: true,
          config: { useLabel: true },
        },
      ],
    },
    {
      legend: "2. Pilih Destinasi & Fasilitas Utama (Base Tier)",
      group: [
        {
          type: "select",
          id: "select-destination",
          name: "destination",
          title: "Pulau Tujuan",
          required: true,
          config: {
            useLabel: true,
            options: [
              { value: "pulau_pari", label: "Pulau Pari" },
              { value: "pulau_tidung", label: "Pulau Tidung" },
              { value: "pulau_pramuka", label: "Pulau Pramuka" },
            ],
          },
        },
        {
          type: "date",
          id: "input-date",
          name: "tripDate",
          title: "Tanggal Keberangkatan (Sabtu)",
          required: true,
          config: { useLabel: true },
        },
        {
          type: "select",
          id: "select-transportation",
          name: "transportation",
          title: "Tipe Transportasi Kapal",
          required: true,
          config: {
            useLabel: true,
            options: [
              { value: "TRADITIONAL", label: "Kapal Kayu Tradisional (Muara Angke) - Hemat Berkelompok" },
              { value: "SPEEDBOAT", label: "Speedboat Kilat (Marina Ancol) - Sat-set & Nyaman" },
            ],
          },
        },
        {
          type: "select",
          id: "select-accommodation",
          name: "accommodation",
          title: "Tipe Tempat Menginap (Homestay)",
          required: true,
          config: {
            useLabel: true,
            options: [
              { value: "STANDARD", label: "Standard Shared Homestay (Full AC, Bersih & Nyaman)" },
              { value: "EXCLUSIVE", label: "Exclusive Private House (Beachfront View, Toilet Dalam)" },
            ],
          },
        },
      ],
    },
    {
      legend: "3. Menu Layanan Tambahan (Add-ons Opsional)",
      description: "Pilih aktivitas seru apa saja yang ingin dimasukkan ke dalam paket trip keluarga Kakak:",
      group: [
        {
          type: "checkbox",
          id: "snorkeling",
          name: "addons",
          title: "Snorkeling Session (Termasuk Sewa Alat Lengkap & Pemandu Lokal)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
        {
          type: "checkbox",
          id: "island_adv",
          name: "addons",
          title: "Island Adventure Land Tour (Sewa Sepeda + Keliling Spot Foto Esensial)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
        {
          type: "checkbox",
          id: "banana_boat",
          name: "addons",
          title: "Banana Boat Ride (Wahana air berkelompok, seru & basah)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
        {
          type: "checkbox",
          id: "jet_ski",
          name: "addons",
          title: "Jet Ski Session (Sewa unit lokal per sesi berdurasi)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
        {
          type: "checkbox",
          id: "drone_photo",
          name: "addons",
          title: "Drone Aerial Photography (Dokumentasi video/foto udara sinematik)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
        {
          type: "checkbox",
          id: "underwater_photo",
          name: "addons",
          title: "Underwater GoPro Photography (Foto di dalam air bersama ikan karang)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
        {
          type: "checkbox",
          id: "paddle_surf",
          name: "addons",
          title: "Paddle Surfing (Sewa papan paddle board santai di pantai)",
          config: { useLabel: true, style: "toggle", position: "right", content: "round" },
        },
      ],
    },
    `<section id="pricing-summary-box" class="section row card" style="background: var(--page-bg)!important;">
      <div class="column half">    
        <h2>Ringkasan Biaya Perjalanan</h2>
        <ul class="unstyled-list">
          <li>Total Peserta: <span id="summary-pax">4</span> Orang</li>
          <li>Biaya Per Pax Estimasi: <span id="summary-per-pax">Rp 0</span></li>
        </ul>
        <h3>Total Pembayaran: <span id="summary-total-price">Rp 0</span></h3>
      </div>
      <div class="column half">    
        <button class="button primary" type="submit" id="button-submit-order">Pesan Paket Trip & Bayar Via QRIS</button>
      </div>
    </section>`,
  ]
}


export const PackagePageContent = [
  {
    name: "package",
    options: {
      fieldTypes: {
        selector: {
          ".eyebrow": "text",
          ".title": "text",
          "p.description": "textarea",
        },
      },
    },
    content: [
      {
        className: "column full txt-center",
        content: [
          { tagName: "p", className: "eyebrow", content: "Paket Liburan" },
          { tagName: "h2", className: "title", content: "Pilih Paket Sesuai Kebutuhan Keluarga Anda" },
          { tagName: "p", className: "description", content: "Temukan opsi perjalanan yang paling pas untuk keluarga Anda dengan berbagai pilihan fasilitas dan aktivitas seru." },
        ]
      },
      {
        id: "pricing-plans",
        builder: "pricing-card",
        isRoot: true,
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            header: "Standard",
            body: [
              { title: "Kapal Kayu Tradisional", className: "" },
              { title: "Standard Shared Homestay", className: "" },
              { title: "Snorkeling Session", className: "" },
              { title: "Island Adventure Tour", className: "" },
              { title: "Banana Boat & Jet Ski", className: "disabled" },
              { title: "Dokumentasi Drone", className: "disabled" },
              { title: "Mulai dari Rp 450.000 / pax", className: "price-tag" },
            ],
            price: 450000,
            action: {
              label: "Pilih",
              onClick: () => window.location.hash = "#home",
            },
          },
          {
            header: "Medium",
            className: "is-featured",
            body: [
              { title: "Speedboat Kilat (Ancol)", className: "" },
              { title: "Standard Shared Homestay", className: "" },
              { title: "Snorkeling & Island Tour", className: "" },
              { title: "Banana Boat Ride", className: "" },
              { title: "Underwater Photo", className: "" },
              { title: "Jet Ski & Drone", className: "disabled" },
              { title: "Mulai dari Rp 850.000 / pax", className: "price-tag" },
            ],
            price: 850000,
            action: {
              label: "Pilih",
              onClick: () => window.location.hash = "#home",
            },
          },
          {
            header: "Premium",
            body: [
              { title: "Speedboat Kilat (Ancol)", className: "" },
              { title: "Exclusive Private House", className: "" },
              { title: "All Basic Add-ons", className: "" },
              { title: "Jet Ski Session", className: "" },
              { title: "Paddle Surfing", className: "" },
              { title: "Drone Aerial Photo", className: "" },
              { title: "Mulai dari Rp 1.500.000 / pax", className: "price-tag" },
            ],
            price: 1500000,
            action: {
              label: "Pilih",
              onClick: () => window.location.hash = "#home",
            },
          },
        ],
      }
    ]
  }
];

export const GalleryPageContent = [
  {
    name: "Gallery",
    options: {
      fieldTypes: {
        selector: {
          "p.eyebrow": "text",
          "h2.title": "text",
          "p.description": "textarea"
        },
        property: {
          "title": "text",
          "image": "file",
          "description": "textarea",
          "category": "select"
        }
      },
    },
    content: [
      {
        className: "column full txt-center",
        content: [
          { tagName: "p", className: "eyebrow", content: "Galeri" },
          { tagName: "h2", className: "title", content: "Momen Tak Terlupakan Bersama Kami" },
          { tagName: "p", className: "description", content: "Lihat pengalaman liburan keluarga yang telah mempercayakan perjalanannya bersama SeribuTrip." },
        ]
      },
      {
        builder: "masonry",
        id: "gallery-grid",
        isRoot: true,
        options: {
          mode: "table" // normal which is unwrapped, the other mode is "table", use single set based input set, and current data will be rendered in table
        },
        content: [
          {
            image: "https://placehold.co/600x800/8764b5/ffffff?text=Pantai",
            category: "A",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/800x600/1e3a5f/ffffff?text=Snorkeling",
            category: "A",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/600x400/8764b5/ffffff?text=Sunset",
            category: "A",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/400x600/1e3a5f/ffffff?text=Keluarga",
            category: "B",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/800x800/8764b5/ffffff?text=Pemandangan",
            category: "B",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/600x600/1e3a5f/ffffff?text=Kapal",
            category: "B",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/400x600/1e3a5f/ffffff?text=Penginapan",
            category: "C",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/800x800/8764b5/ffffff?text=Permainan",
            category: "C",
            title: "",
            decription: ""
          },
          {
            image: "https://placehold.co/600x600/1e3a5f/ffffff?text=Suasana Malam",
            category: "C",
            title: "",
            decription: ""
          },
        ]
      }
    ] as iBasicNode
  }
];

export const ProductPageContent = [
  {
    builder: "product-card-grid",
    options: {
      fieldTypes: {
        property: {
          "uid": "text",
          "name": "text",
          "category": "select",
          "artwork.src": "file", // <= ini membawa semua object artwork padahal yang mau diambil property src. _flattenObject nya sptnya bermasalah
          "description": "textarea",
          "price": "number"
        }
      },
      mode: "table"
    },
    content: [
      {
        "uid": "dsr7524x",
        "name": "O-Neck Standard",
        "category": "T-Shirt",
        "title": "Standard O-neck",
        "description": "",
        "price": "getPrice",
        "colors": [
          {
            "name": "white",
            "value": "#ffffff"
          },
          {
            "name": "black",
            "value": "#212121"
          },
          {
            "name": "light grey",
            "value": "#cacaca"
          },
          {
            "name": "red",
            "value": "#f83939"
          },
          {
            "name": "violet",
            "value": "#9966cc"
          },
          {
            "name": "dark brown",
            "value": "#37220e"
          },
          {
            "name": "navy",
            "value": "#151935"
          },
          {
            "name": "green",
            "value": "#1bb752"
          }
        ],
        "imageUrl": "apparel/man_tshirt_standard_o-neck.png",
        "artwork": {
          "mask": {
            "fullbody": "",
            "sleeve_right": "",
            "sleeve_left": "",
            "ribs_neck": "",
            "ribs_lefthand": "",
            "ribs_righthand": ""
          }
        }
      },
      {
        "uid": "dsr7523s",
        "name": "Man Long Sleeve",
        "category": "Shirt",
        "title": "Man Long Sleeve",
        "description": "",
        "price": "getPrice",
        "colors": [
          {
            "name": "black",
            "value": "#212121"
          },
          {
            "name": "white",
            "value": "#fffbfb"
          },
          {
            "name": "dark grey",
            "value": "#423b3b"
          },
          {
            "name": "misty grey",
            "value": "#cacaca"
          },
          {
            "name": "violet",
            "value": "#9966cc"
          },
          {
            "name": "cream",
            "value": "#fbfde2"
          },
          {
            "name": "orange",
            "value": "#ff932e"
          },
        ],
        "imageUrl": "apparel/man_shirt_long_slevee.png",
        "artwork": {
          "mask": {
            "fullbody": "",
            "sleeve_right": "",
            "sleeve_left": "",
            "ribs_neck": "",
            "ribs_lefthand": "",
            "ribs_righthand": ""
          }
        }
      },
      {
        "uid": "dsr7534e",
        "name": "Event's Balloon",
        "category": "Merchandise",
        "title": "Event's Balloon",
        "description": "",
        "price": "getPrice",
        "colors": [
          {
            "name": "black",
            "value": "#212121"
          },
          {
            "name": "white",
            "value": "#fffbfb"
          },
          {
            "name": "red",
            "value": "#ff0000"
          },
          {
            "name": "pink",
            "value": "#ff89ed"
          },
          {
            "name": "violet",
            "value": "#9966cc"
          },
          {
            "name": "transparent",
            "value": "#fbfde2"
          },
          {
            "name": "blue",
            "value": "#0245fc"
          },
          {
            "name": "green",
            "value": "#1bb752"
          }
        ],
        "imageUrl": "apparel/Promotion_Balloon.png",
        "artwork": {
          "mask": {
            "fullbody": "",
            "sleeve_right": "",
            "sleeve_left": "",
            "ribs_neck": "",
            "ribs_lefthand": "",
            "ribs_righthand": ""
          }
        }
      },
      {
        "uid": "dsk7524m",
        "name": "Standard Mug",
        "category": "Merchandise",
        "title": "Standard Mug",
        "description": "",
        "price": "getPrice",
        "colors": [
          {
            "name": "black",
            "value": "#212121"
          },
          {
            "name": "white",
            "value": "#fffbfb"
          },
          {
            "name": "cream",
            "value": "#fbfde2"
          }
        ],
        "imageUrl": "apparel/Promotion_Mug.png",
        "artwork": {
          "mask": {
            "fullbody": "",
            "sleeve_right": "",
            "sleeve_left": "",
            "ribs_neck": "",
            "ribs_lefthand": "",
            "ribs_righthand": ""
          }
        }
      },
      {
        "uid": "psr4524b",
        "name": "Pin",
        "category": "Merchandise",
        "title": "Pin",
        "description": "",
        "price": "getPrice",
        "colors": [
          {
            "name": "black",
            "value": "#212121"
          },
          {
            "name": "white",
            "value": "#fffbfb"
          },
          {
            "name": "cream",
            "value": "#fbfde2"
          },
          {
            "name": "yellow",
            "value": "#F7EA14"
          },
          {
            "name": "red",
            "value": "#EC2A2A"
          }
        ],
        "imageUrl": "apparel/Promotion_Pin.png",
        "artwork": {
          "mask": {
            "fullbody": "",
            "sleeve_right": "",
            "sleeve_left": "",
            "ribs_neck": "",
            "ribs_lefthand": "",
            "ribs_righthand": ""
          }
        }
      },
      {
        "uid": "dsf7454a",
        "name": "Cushion",
        "category": "Accesories",
        "title": "Cushion",
        "description": "",
        "price": "getPrice",
        "colors": [
          {
            "name": "black",
            "value": "#020000"
          },
          {
            "name": "white",
            "value": "#ffffffe3"
          },
          {
            "name": "yellow",
            "value": "#fffc30"
          },
          {
            "name": "red",
            "value": "#EC2A2A"
          },
          {
            "name": "brown",
            "value": "#382b2b"
          },
          {
            "name": "grey",
            "value": "#5B5B5B"
          }
        ],
        "imageUrl": "apparel/Promotion_Cushion.png",
        "artwork": {
          "mask": {
            "fullbody": "",
            "sleeve_right": "",
            "sleeve_left": "",
            "ribs_neck": "",
            "ribs_lefthand": "",
            "ribs_righthand": ""
          }
        },
      }
    ]
  }
];

export const BlogPageContent = [{
  builder: "article",
  options: {
    fieldTypes: {
      property: {
        // "uid": "text",
        "title": "text",
        "date": "date",
        "slug": "text",
        "summary": "textarea",
        "thumbnail": "file",
        "largeCover": "file",
        "author": "text",
        "body": "textarea"
      }
    },
    mode: "table"
  },
  content: {
    "status": "success",
    "meta": {
      "currentPage": 1,
      "perPage": 5,
      "totalItems": 25,
      "totalPages": 5,
      "links": {
        "first": "https://google.com",
        "prev": null,
        "self": "https://google.com",
        "next": "https://google.com",
        "last": "https://google.com"
      }
    },
    "data": [
      {
        "uid": "art-001",
        "slug": "tren-fashion-apparel-2026",
        "title": "Tren Fashion Apparel Terkini di Tahun 2026",
        "summary": "Menjelajahi revolusi gaya sandang minimalis-modern, perpaduan warna aksen neon, dan kebangkitan pakaian kustom pintar.",
        "thumbnail": "https://placehold.co/300x300/4f3274/ffffff?text=Tren Fashion",
        "largeCover": "https://placehold.co/600x600/4f3274/ffffff?text=Tren Fashion",
        "author": "Garda internal Team",
        "date": "24 Juli 2026",
        "body": "<p>Tahun 2026 membawa angin segar bagi industri apparel global. Desain kaku purba resmi ditinggalkan oleh para perancang busana muda, beralih murni memeluk estetika minimalis dengan potongan pola geometri yang presisi.</p><p>Kombinasi kain berteknologi tinggi yang ringan namun kokoh, dipadukan dengan sentuhan warna aksen cerah di level detail, menjadi pilihan utama para eksekutif muda saat menjelajahi aktivitas harian mereka di ibu kota.</p>"
      },
      {
        "uid": "art-002",
        "slug": "rahasia-desain-kaos-retina-performa",
        "title": "Rahasia Desain Kaos dengan Performa Visual 120fps",
        "summary": "Bagaimana memanfaatkan trik bayangan semi-transparan (multiply shadow blend) untuk menciptakan visual produk e-commerce yang ultra-fluid.",
        "thumbnail": "https://placehold.co/300x300/607d31/ffffff?text=Rahasia Desain Kaos",
        "largeCover": "https://placehold.co/600x600/607d31/ffffff?text=Rahasia Desain Kaos",
        "author": "Master Architect",
        "date": "22 Juli 2026",
        "body": "<p>Menampilkan visual produk pakaian di web sering kali terkendala ukuran bita gambar yang kembung. Melalui penerapan teknik mutakhir <i>multiply blend mode</i>, satu file bayangan hitam transparan kini legal dipakai bersama belasan varian warna latar belakang.</p><p>Hasilnya? Ukuran request HTTP terpangkas drastis, memori RAM browser tetap steril, dan transisi visual berjalan sehalus sutra di angka kecepatan penuh!</p>"
      },
      {
        "uid": "art-003",
        "slug": "arsitektur-headless-google-sheets-microservice",
        "title": "Membangun Headless Microservice Berbasis Google Sheets",
        "summary": "Panduan taktis menguras data spreadsheet menggunakan Google Apps Script REST API untuk platform mandiri satu pintu.",
        "thumbnail": "https://placehold.co/300x300/25b298/ffffff?text=Arsitektur Headless",
        "largeCover": "https://placehold.co/600x600/25b298/ffffff?text=Arsitektur Headless",
        "author": "Systems Engineer",
        "date": "18 Juli 2026",
        "body": "<p>Deploy infrastruktur server database sering kali mahal dan melelahkan bagi tim kecil. Memanfaatkan Google Sheets sebagai database inti dan Apps Script sebagai gerbang RESTful API adalah solusi kedaulatan platform yang sangat matang.</p><p>Dengan penataan skema HATEOAS yang teratur di level meta links, frontend Anda mampu mengendalikan pergeseran halaman data secara otonom tanpa dependensi kaku luar.</p>"
      },
      {
        "uid": "art-004",
        "slug": "manajemen-ram-browser-anti-leak",
        "title": "Manajemen Memori RAM Browser Bebas Kebocoran",
        "summary": "Taktik mengunci rahim memori private field Map dan melikuidasi elemen usang dari live DOM tree secara tertib.",
        "thumbnail": "https://placehold.co/300x300/d6ac23/ffffff?text=Manajemen Ram",
        "largeCover": "https://placehold.co/600x600/d6ac23/ffffff?text=Manajemen Ram",
        "author": "Master Architect",
        "date": "15 Juli 2026",
        "body": "<p>Aplikasi Single Page Application (SPA) sangat rawan mengalami kembung RAM jika sisa elemen hantu tidak dibersihkan saat pindah rute. Penerapan katup <code>this.remove(...keys)</code> satu pintu terbukti melumat habis detached DOM elements secara tuntas sebersih salju.</p>"
      },
      {
        "uid": "art-005",
        "slug": "panduan-trip-kepulauan-seribu-privat",
        "title": "Panduan Lengkap Menyusun Private Trip Keluarga",
        "summary": "Langkah menyusun itinerary pelesiran laut yang tenang, fasilitas nyaman, dan dukungan koordinasi tim lokal terpadu.",
        "thumbnail": "https://placehold.co/300x300/fe2626/ffffff?text=Panduan Trip",
        "largeCover": "https://placehold.co/600x600/fe2626/ffffff?text=Panduan Trip",
        "author": "Travel Consultant",
        "date": "10 Juli 2026",
        "body": "<p>Liburan keluarga membutuhkan kepastian kenyamanan. Melalui integrasi modul form kustom hierarki wilayah Indonesia yang reaktif, pengumpulan data domisili peserta trip dapat terdokumentasi secara sangat bersih, rapi, dan tervalidasi otomatis sejak awal.</p>"
      }
    ]
  }
}]


export const TablePageContent = [
  {
    builder: "table",
    content: {
      config: {
        size: "small",
        type: "celled",
        editable: true,
        autoNumbering: true,
        pageSize: 10,
        sortable: true,
        selectable: true,
        // disableSubRow: true,
        headerOptions: {
          textAlign: "center",
        },
        bodyOptions: [
          {},
          { textAlign: "center", format: "number" },
          { format: "currency", currency: "IDR", locale: "id-ID", textAlign: "right" },
          {
            format: "currency",
            currency: "IDR",
            locale: "id-ID",
            textAlign: "right",
            formula: "=price * quantity", // will search header with text defined
          },
        ],
        footerOptions: {
          color: "gray",
          textAlign: "center",
          renderTotal: ["quantity", "total"],
        },
      },
      // header: ["specifications", "quantity", "price", "total"],
      header: [
        { text: "specifications" },
        { text: "quantity", group: "details" },
        { text: "price", group: "details", options: { textAlign: "right" } },
        { text: "total", group: "details", options: { textAlign: "right" } },
      ],
      body: [
        ["art paper 125gsm", { text: 300, options: { textAlign: "left" } }, 1300, null],
        ["art carton 210gsm", 500, 2100, null],
        ["art paper 125gsm", 300, 1300, null],
        ["art carton 210gsm", 500, 2100, null],
        ["art paper 125gsm", 300, 1300, null],
        ["art carton 210gsm", 500, 2100, null],
        ["art paper 125gsm", 300, 1300, null],
        ["art paper 125gsm", 300, 1300, null],
        ["art carton 210gsm", 500, 2100, null],
        [{ text: "art carton 210gsm", options: { color: "red" } }, 500, 2100, null],
        ["art paper 125gsm", 300, 1300, null],
        ["art carton 210gsm", 500, 2100, null],
        ["art paper 125gsm", 300, { text: 1300, options: { textAlign: "left" } }, null],
        ["art carton 210gsm", 500, 2100, null],
        ["art paper 125gsm", 300, 1300, null],
        ["art carton 210gsm", 500, 2100, null],
      ],
      // footer: footerTemplate,
    }
  }
]
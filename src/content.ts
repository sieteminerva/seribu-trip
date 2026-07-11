import type { iBasicNode } from "./lib/LandingPageBuilder/interface";

export const createHomePageContent = (onOpenOrderModal: () => void): iBasicNode[] => ([
  {
    name: "Hero",
    tagName: "section",
    id: "hero-section",
    className: "section row align-mid stackable",
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
        content: [
          {
            image: "https://placehold.co/640x420/1e3a5f/ffffff?text=Kepulauan+Seribu",
            title: "Eksplorasi Keindahan",
            description: "Nikmati perjalanan privat yang nyaman dan tenang bersama keluarga."
          },
          {
            image: "https://placehold.co/640x420/8764b5/ffffff?text=Pantai+Pasir+Putih",
            title: "Pantai Pasir Putih",
            description: "Menghabiskan waktu dengan pemandangan sunset yang luar biasa."
          },
          {
            image: "https://placehold.co/640x420/3c2554/ffffff?text=Petualangan+Seru",
            title: "Aktivitas Menyenangkan",
            description: "Snorkeling dan aktivitas air lain yang disesuaikan untuk semua umur."
          }
        ],
      }
    ]
  },
  {
    name: "Stats",
    id: "stats-section",
    tagName: "section",
    content: [
      {
        className: "column full compact",
        content: {
          tagName: "p", className: "eyebrow", content: "Keunggulan perusahaan"
        }
      },
      {
        className: "section row card",
        content: [
          {
            className: "column stat",
            content: [
              { tagName: "strong", content: "4.9/5" },
              { tagName: "span", content: "rating keluarga yang telah berangkat" }
            ]
          },
          {
            className: "column stat",
            content: [
              { tagName: "strong", content: "24/7" },
              { tagName: "span", content: "support lapangan dan koordinasi darurat" }
            ]
          },
          {
            className: "column stat",
            content: [
              { tagName: "strong", content: "100%" },
              { tagName: "span", content: "tim lokal asal pulau dan kru yang terpercaya" }
            ]
          }
        ]
      }
    ],
  },
  {
    name: "Tentang Kami",
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
    name: "About",
    className: "row",
    tagName: "section",
    content: [
      {
        name: "Kenapa Memilih Kami",
        id: "benefits-section",
        className: "column card",
        content: [
          { tagName: "h3", className: "title", content: "Trip privat" },
          { tagName: "p", className: "description", content: "Trip privat dan tidak digabungkan dengan kelompok lain." },
          { tagName: "h3", className: "title", content: "Harga jelas" },
          { tagName: "p", className: "description", content: "Estimasi harga yang jelas sebelum pembayaran." },
          { tagName: "h3", className: "title", content: "Support penuh" },
          { tagName: "p", className: "description", content: "Tim lapangan yang siap membantu dari keberangkatan hingga kembali." },
        ],
      },
      {
        name: "Rencana Perjalanan",
        id: "itinerary-section",
        className: "column card",
        content: [
          { tagName: "h3", className: "title", content: "1. Persiapan & Keberangkatan" },
          { tagName: "p", className: "description", content: "Koordinasi yang jelas, jadwal kumpul yang rapi, dan transportasi yang sudah dipilih sesuai kebutuhan." },
          { tagName: "h3", className: "title", content: "2. Aktivitas di Pulau" },
          { tagName: "p", className: "description", content: "Snorkeling, santai di pantai, sunset, dan pilihan add-ons yang dapat disesuaikan dengan usia anggota keluarga." },
          { tagName: "h3", className: "title", content: "3. Kembali dengan Kenangan" },
          { tagName: "p", className: "description", content: "Semua dokumen, tiket, dan informasi trip akan dikirimkan dengan rapi untuk memudahkan perjalanan pulang." },
        ],
      },
    ]
  },
  {
    name: "CTA",
    'section#cta-section.section.banner': {
      content: {
        'h2.title': { content: "Siap merancang liburan keluarga yang nyaman?" },
        'div.actions': {
          onCreated: (el: HTMLElement) => {
            const btn = document.createElement("button");
            btn.className = "button primary";
            btn.textContent = "Pesan Sekarang";
            // Event listener aman di memori, tidak hilang!
            btn.addEventListener("click", onOpenOrderModal);
            el.appendChild(btn);
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
    content: [
      { tagName: "h2", className: "title txt-center", content: "Pertanyaan Populer (FAQ)" },
      {
        className: "column full compact",
        builder: "accordion",
        isRoot: true,
        content: [
          { title: "Apakah ada batas minimal peserta untuk booking?", description: "Tidak. Kami siap membantu rombongan kecil maupun besar, dan kami akan menyesuaikan paket sesuai kebutuhan Kakak." },
          { title: "Apakah bisa reschedule jika cuaca buruk?", description: "Ya. Jika operasional dibatalkan karena faktor cuaca atau otoritas pelabuhan, kami akan membantu penjadwalan ulang dengan transparan." },
          { title: "Apakah pembayaran bisa melalui QRIS?", description: "Ya. Kami mendukung pembayaran QRIS dan akan langsung mengonfirmasi status transaksi setelah pembayaran berhasil." },
        ],
      }
    ]
  }
]);

export const createPackagePageContent = [
  {
    name: "package",
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
        content: [
          {
            header: "Standard",
            body: [
              { name: "Kapal Kayu Tradisional", className: "" },
              { name: "Standard Shared Homestay", className: "" },
              { name: "Snorkeling Session", className: "" },
              { name: "Island Adventure Tour", className: "" },
              { name: "Banana Boat & Jet Ski", className: "disabled" },
              { name: "Dokumentasi Drone", className: "disabled" },
              { name: "Mulai dari Rp 450.000 / pax", className: "price-tag" },
            ],
            action: {
              label: "Pilih",
              onClick: () => window.location.hash = "#home",
            },
          },
          {
            header: "Medium",
            className: "is-featured",
            body: [
              { name: "Speedboat Kilat (Ancol)", className: "" },
              { name: "Standard Shared Homestay", className: "" },
              { name: "Snorkeling & Island Tour", className: "" },
              { name: "Banana Boat Ride", className: "" },
              { name: "Underwater Photo", className: "" },
              { name: "Jet Ski & Drone", className: "disabled" },
              { name: "Mulai dari Rp 850.000 / pax", className: "price-tag" },
            ],
            action: {
              label: "Pilih",
              onClick: () => window.location.hash = "#home",
            },
          },
          {
            header: "Premium",
            body: [
              { name: "Speedboat Kilat (Ancol)", className: "" },
              { name: "Exclusive Private House", className: "" },
              { name: "All Basic Add-ons", className: "" },
              { name: "Jet Ski Session", className: "" },
              { name: "Paddle Surfing", className: "" },
              { name: "Drone Aerial Photo", className: "" },
              { name: "Mulai dari Rp 1.500.000 / pax", className: "price-tag" },
            ],
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

export const createGalleryPageContent = [
  {
    name: "Gallery",

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
        content: [
          {
            image: "https://placehold.co/600x800/8764b5/ffffff?text=Pantai",
            category: "A"
          },
          {
            image: "https://placehold.co/800x600/1e3a5f/ffffff?text=Snorkeling",
            category: "A"
          },
          {
            image: "https://placehold.co/600x400/8764b5/ffffff?text=Sunset",
            category: "A"
          },
          {
            image: "https://placehold.co/400x600/1e3a5f/ffffff?text=Keluarga",
            category: "B"
          },
          {
            image: "https://placehold.co/800x800/8764b5/ffffff?text=Pemandangan",
            category: "B"
          },
          {
            image: "https://placehold.co/600x600/1e3a5f/ffffff?text=Kapal",
            category: "B"
          },
          {
            image: "https://placehold.co/400x600/1e3a5f/ffffff?text=Penginapan",
            category: "C"
          },
          {
            image: "https://placehold.co/800x800/8764b5/ffffff?text=Permainan",
            category: "C"
          },
          {
            image: "https://placehold.co/600x600/1e3a5f/ffffff?text=Suasana Malam",
            category: "C"
          },
        ]
      }
    ] as iBasicNode
  }
];


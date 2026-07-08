import { AccordionBuilder } from "./lib/LandingPageBuilder/Builders/Accordion";
import { PricingTableBuilder } from "./lib/LandingPageBuilder/Builders/PricingTable";
import { StatsBuilder } from "./lib/LandingPageBuilder/Builders/Stats";
import { MasonryBuilder } from "./lib/LandingPageBuilder/Builders/Masonry";
import { CarouselBuilder } from "./lib/LandingPageBuilder/Builders/Carousel";

export const createHomePageContent = (onOpenOrderModal: () => void) => ([
  {
    name: "Hero",
    className: "section row align-mid stackable",
    header: {
      className: "column half",
      eyebrow: "Private Trip Keluarga • Kepulauan Seribu",
      title: "Liburan laut yang tenang, privat, dan dipersiapkan dengan penuh perhatian.",
      description: "Kami menyusun perjalanan keluarga ke pulau impian dengan itinerary yang jelas, fasilitas yang nyaman, dan dukungan tim lokal yang siap membantu setiap langkahnya.",
    },
    content: new CarouselBuilder({
      showControl: true,
      showNavigation: true,
      autoPlay: 4000
    }).create({
      id: "hero-section",
      className: "column half",
      items: [
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
    }),
  },
  {
    name: "Stats",
    id: "stats-section",
    header: { className: "column full compact", eyebrow: "Keunggulan perusahaan" },
    content: StatsBuilder.create({
      items: [
        { title: "4.9/5", description: "rating keluarga yang telah berangkat" },
        { title: "24/7", description: "support lapangan dan koordinasi darurat" },
        { title: "100%", description: "tim lokal asal pulau dan kru yang terpercaya" },
      ],
    }),
  },
  {
    name: "Tentang Kami",
    header: {
      eyebrow: "Tentang Kami",
      title: "Operator lokal resmi yang menggabungkan kenyamanan, ketepatan, dan sentuhan personal.",
      description: "Kami merancang setiap trip dengan memperhatikan kebutuhan keluarga: jadwal yang tidak terburu-buru, fasilitas yang aman, dan pengalaman yang terasa hangat serta berkesan.",
    },
    content: {
      id: "about-section",
      className: "row card",
      items: [
        {
          image: "https://placehold.co/720x420/8764b5/ffffff?text=Tim+Lokal",
        },
      ],
    },
  },
  {
    name: "About",
    group: [
      {
        name: "Kenapa Memilih Kami",
        content: {
          id: "benefits-section",
          className: "column card",
          items: [
            { title: "Trip privat", description: "Trip privat dan tidak digabungkan dengan kelompok lain." },
            { title: "Harga jelas", description: "Estimasi harga yang jelas sebelum pembayaran." },
            { title: "Support penuh", description: "Tim lapangan yang siap membantu dari keberangkatan hingga kembali." },
          ],
        },
      },
      {
        name: "Rencana Perjalanan",
        content: {
          id: "itinerary-section",
          className: "column card",
          items: [
            { title: "1. Persiapan & Keberangkatan", description: "Koordinasi yang jelas, jadwal kumpul yang rapi, dan transportasi yang sudah dipilih sesuai kebutuhan." },
            { title: "2. Aktivitas di Pulau", description: "Snorkeling, santai di pantai, sunset, dan pilihan add-ons yang dapat disesuaikan dengan usia anggota keluarga." },
            { title: "3. Kembali dengan Kenangan", description: "Semua dokumen, tiket, dan informasi trip akan dikirimkan dengan rapi untuk memudahkan perjalanan pulang." },
          ],
        },
      },
    ],
  },
  {
    name: "CTA",
    content: {
      id: "cta-section",
      className: "banner",
      items: [
        {
          title: "Siap merancang liburan keluarga yang nyaman dan tak terlupakan?",
          description: "",
          actions: [
            {
              label: "Pesan Sekarang",
              id: "open-order-modal-cta",
              className: "button primary",
              onClick: onOpenOrderModal,
            },
          ],
        },
      ],
    },
  },
  {
    name: "Trust",
    header: {
      eyebrow: "Keamanan & Kepercayaan",
      title: "Semua titik perjalanan kami dikelola dengan perhatian pada keamanan dan kenyamanan.",
      description: "Nomor kontak darurat, manifest data penumpang, dan dokumentasi trip kami siapkan dengan detail sehingga Kakak bisa berangkat dengan tenang.",
    },
    className: "row card",
    content: {
      id: "trust-section",
      items: [{}],
    },
  },
  {
    name: "Pertanyaan yang sering ditanyakan sebelum memesan.",
    content: AccordionBuilder.create({
      id: "faq-section",
      items: [
        { title: "Apakah ada batas minimal peserta untuk booking?", description: "Tidak. Kami siap membantu rombongan kecil maupun besar, dan kami akan menyesuaikan paket sesuai kebutuhan Kakak." },
        { title: "Apakah bisa reschedule jika cuaca buruk?", description: "Ya. Jika operasional dibatalkan karena faktor cuaca atau otoritas pelabuhan, kami akan membantu penjadwalan ulang dengan transparan." },
        { title: "Apakah pembayaran bisa melalui QRIS?", description: "Ya. Kami mendukung pembayaran QRIS dan akan langsung mengonfirmasi status transaksi setelah pembayaran berhasil." },
      ],
    }),
  },
]);

export const createPackagePageContent = () => ([
  {
    name: "package",
    header: {
      eyebrow: "Paket Liburan",
      title: "Pilih Paket Sesuai Kebutuhan Keluarga Anda",
      description: "Temukan opsi perjalanan yang paling pas untuk keluarga Anda dengan berbagai pilihan fasilitas dan aktivitas seru.",
      className: "column full txt-center"
    },
    content: PricingTableBuilder.create({
      id: "pricing-plans",
      className: "row card transparent",
      items: [
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
    }),
  },
]);

export const createGalleryPageContent = () => ([
  {
    name: "Gallery",
    header: {
      eyebrow: "Galeri",
      title: "Momen Tak Terlupakan Bersama Kami",
      description: "Lihat pengalaman liburan keluarga yang telah mempercayakan perjalanannya bersama SeribuTrip.",
      className: "column full txt-center"
    },
    content: new MasonryBuilder({ category: "category" }).create({
      id: "gallery-grid",
      items: [
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
    })
  }
]);

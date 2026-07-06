import { AccordionBuilder } from "./lib/LandingPageBuilder/Builders/Accordion";
import { PricingTableBuilder } from "./lib/LandingPageBuilder/Builders/PricingTable";
import { StatsBuilder } from "./lib/LandingPageBuilder/Builders/Stats";

export const createHomePageContent = (onOpenOrderModal: () => void) => ([
  {
    name: "Hero",
    header: {
      className: "column half",
      eyebrow: "Private Trip Keluarga • Kepulauan Seribu",
      title: "Liburan laut yang tenang, privat, dan dipersiapkan dengan penuh perhatian.",
      description: "Kami menyusun perjalanan keluarga ke pulau impian dengan itinerary yang jelas, fasilitas yang nyaman, dan dukungan tim lokal yang siap membantu setiap langkahnya.",
    },
    content: {
      id: "hero-section",
      items: [
        {
          image: "https://placehold.co/640x420/1e3a5f/ffffff?text=Kepulauan+Seribu",
        },
      ],
    },
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
    content: PricingTableBuilder.create({
      id: "pricing-plans",
      items: [
        {
          header: "Backpacker",
          body: [
            { name: "✦ Transportasi lokal standard", className: "" },
            { name: "✦ Penginapan homestay lokal", className: "" },
            { name: "✕ Konsumsi harian disediakan", className: "disabled" },
          ],
          action: {
            label: "Pilih Paket",
            onClick: () => console.log("Backpacker selected"),
          },
        },
        {
          header: "Explorer",
          className: "is-featured",
          body: [
            { name: "✦ Transportasi AC Premium PP", className: "" },
            { name: "✦ Hotel bintang 3 terkurasi", className: "" },
            { name: "✦ Konsumsi full-board (3x sehari)", className: "" },
          ],
          action: {
            label: "Pilih Paket",
            onClick: () => console.log("Explorer selected"),
          },
        },
      ],
    }),
  },
]);

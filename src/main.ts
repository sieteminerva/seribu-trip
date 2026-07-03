import './style.css';
import './form.css';
import { createOrderModal } from './order-form';
import { LandingPageBuilder } from './lib/LandingPageBuilder/LandingPage';
import { MenuBuilder } from './lib/LandingPageBuilder/Builders/Menu';
import { StatsBuilder } from './lib/LandingPageBuilder/Builders/Stats';
import { AccordionBuilder } from './lib/LandingPageBuilder/Builders/Accordion';
import { ContactBuilder } from './lib/LandingPageBuilder/Builders/Contact';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const landingPageSections = [
    {
      isSection: false,
      name: "Menu",
      content: MenuBuilder.create({
        id: "main-navigation",
        items: [
          { title: "PulauSeribu Trip", link: "/" }, // Index 0 is the brand item
          { title: "Rencana Perjalanan", link: "#trip-cards" },
          { title: "FAQ", link: "#faq-section" },
          // { title: "Hubungi", link: "#contact" }
        ]
      }),
    },
    {
      name: 'Hero',
      header: {
        className: "column half",
        eyebrow: 'Private Trip Keluarga • Kepulauan Seribu',
        title: 'Liburan laut yang tenang, privat, dan dipersiapkan dengan penuh perhatian.',
        description: 'Kami menyusun perjalanan keluarga ke pulau impian dengan itinerary yang jelas, fasilitas yang nyaman, dan dukungan tim lokal yang siap membantu setiap langkahnya.',
      },
      content: {
        id: 'hero-section',
        items: [
          {
            image: 'https://placehold.co/640x420/1e3a5f/ffffff?text=Kepulauan+Seribu',
          }
        ]
      },
    },
    {
      name: "Stats",
      id: 'stats-section',
      header: { className: "column full compact", eyebrow: 'Keunggulan perusahaan' },
      content: StatsBuilder.create({
        items: [
          { title: '4.9/5', description: 'rating keluarga yang telah berangkat' },
          { title: '24/7', description: 'support lapangan dan koordinasi darurat' },
          { title: '100%', description: 'tim lokal asal pulau dan kru yang terpercaya' },
        ]
      })
    },
    {
      name: 'Tentang Kami',
      header: {
        eyebrow: 'Tentang Kami',
        title: 'Operator lokal resmi yang menggabungkan kenyamanan, ketepatan, dan sentuhan personal.',
        description: 'Kami merancang setiap trip dengan memperhatikan kebutuhan keluarga: jadwal yang tidak terburu-buru, fasilitas yang aman, dan pengalaman yang terasa hangat serta berkesan.',
      },
      content: {
        id: 'about-section',
        className: "row card",
        items: [
          {
            image: 'https://placehold.co/720x420/8764b5/ffffff?text=Tim+Lokal',
          }
        ],
      },
    },
    {
      name: "About",
      group: [
        {
          name: 'Kenapa Memilih Kami',
          content: {
            id: 'benefits-section',
            className: "column card",
            items: [
              { title: 'Trip privat', description: 'Trip privat dan tidak digabungkan dengan kelompok lain.' },
              { title: 'Harga jelas', description: 'Estimasi harga yang jelas sebelum pembayaran.' },
              { title: 'Support penuh', description: 'Tim lapangan yang siap membantu dari keberangkatan hingga kembali.' },
            ],
          },
        },
        {
          name: 'Rencana Perjalanan',
          content: {
            id: 'itinerary-section',
            className: "column card",
            items: [
              { title: '1. Persiapan & Keberangkatan', description: 'Koordinasi yang jelas, jadwal kumpul yang rapi, dan transportasi yang sudah dipilih sesuai kebutuhan.' },
              { title: '2. Aktivitas di Pulau', description: 'Snorkeling, santai di pantai, sunset, dan pilihan add-ons yang dapat disesuaikan dengan usia anggota keluarga.' },
              { title: '3. Kembali dengan Kenangan', description: 'Semua dokumen, tiket, dan informasi trip akan dikirimkan dengan rapi untuk memudahkan perjalanan pulang.' },
            ],
          },
        },
      ]
    },
    {
      name: 'CTA',
      content: {
        id: 'cta-section',
        className: "banner",
        items: [{
          title: 'Siap merancang liburan keluarga yang nyaman dan tak terlupakan?',
          description: '',
          actions: [{ label: 'Pesan Sekarang', id: 'open-order-modal-cta', className: 'button primary' }],
        }],
      },
    },
    {
      name: "Trust",
      header: {
        eyebrow: 'Keamanan & Kepercayaan',
        title: 'Semua titik perjalanan kami dikelola dengan perhatian pada keamanan dan kenyamanan.',
        description: 'Nomor kontak darurat, manifest data penumpang, dan dokumentasi trip kami siapkan dengan detail sehingga Kakak bisa berangkat dengan tenang.',
      },
      className: "row card",
      content: {
        id: 'trust-section',
        items: [{}],
      },
    },
    {
      name: 'Pertanyaan yang sering ditanyakan sebelum memesan.',
      content: AccordionBuilder.create({
        id: 'faq-section',
        items: [
          { title: 'Apakah ada batas minimal peserta untuk booking?', description: 'Tidak. Kami siap membantu rombongan kecil maupun besar, dan kami akan menyesuaikan paket sesuai kebutuhan Kakak.' },
          { title: 'Apakah bisa reschedule jika cuaca buruk?', description: 'Ya. Jika operasional dibatalkan karena faktor cuaca atau otoritas pelabuhan, kami akan membantu penjadwalan ulang dengan transparan.' },
          { title: 'Apakah pembayaran bisa melalui QRIS?', description: 'Ya. Kami mendukung pembayaran QRIS dan akan langsung mengonfirmasi status transaksi setelah pembayaran berhasil.' },
        ]
      })
    },

    {
      name: "Footer",
      content: ContactBuilder.create({
        id: "contact",
        title: "Agen Wisata SeribuTrip",
        description: "Operator lokal resmi yang mengedepankan kenyamanan dan ketepatan.",
        items: [
          { label: "email", data: "halo@pulauseributrip.id", },
          { label: "phone", data: "+628123456789", },
          { label: "address", data: "Dermaga 16 Marina Ancol, Jakarta", }
        ]
      })
    }
  ];

  const builder = new LandingPageBuilder(landingPageSections, { container: app, theme: 'light' });

  builder.render();


  const orderModal = createOrderModal();
  app.appendChild(orderModal.dialog);

  const launchers = [
    app.querySelector<HTMLButtonElement>('#open-order-modal'),
    app.querySelector<HTMLButtonElement>('#open-order-modal-cta'),
  ];

  launchers.forEach((launcher) => {
    if (launcher) {
      launcher.addEventListener('click', () => orderModal.open());
    }
  });
}

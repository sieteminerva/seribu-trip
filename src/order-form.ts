import { generateFormElement } from "./lib/form-builder";

const orderFormSchema = [
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
];

export function createOrderForm() {
  return generateFormElement(orderFormSchema, {
    id: "booking-calculator-form",
    class: "native form",
    submitButton: true,
    createEventListener: true,
    minHeight: "auto",
  });
}


export function createOrderModal() {
  // Create outer backdrop wrap
  const overlay = document.createElement("div");
  overlay.className = "dialog hidden"; // Default to hidden layout state

  // Create inner fixed dialog container block
  const container = document.createElement("div");
  container.className = "modal";

  const header = document.createElement("div");
  header.className = "header";

  const title = document.createElement("h2");
  title.className = "title";
  title.textContent = "Buat Pesanan Trip";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "close";
  closeButton.textContent = "×";

  const form = createOrderForm();
  form.className = "order form";

  header.append(title, closeButton);
  container.append(header, form);
  overlay.appendChild(container);

  const close = () => {
    overlay.classList.add("hidden");
    document.body.style.overflow = ""; // Re-enable background scrolling
  };

  closeButton.addEventListener("click", close);

  // Close safely if the user clicks directly on background backdrop overlay space
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  return {
    dialog: overlay, // Returns the outer root element to mount into the DOM
    open: () => {
      overlay.classList.toggle("hidden");
      document.body.style.overflow = "hidden"; // Prevent double scrolling bugs
    },
    close,
  };
}
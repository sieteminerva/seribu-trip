# 🏛️ Core Platform UI Component Specification Contract (v2.0.0)

## 📌 Philosophy & Core Manifesto

Setiap komponen Builder adalah sebuah **Headless Sovereign Logical Shell** (Komponen tanpa kepala yang berdaulat secara logika murni). Builder bertindak murni sebagai penggerak roda gigi, perakit layout, dan penyiar status daur hidup melalui pipa data (_Event Stream_). Builder **DILARANG KERAS** mendikte tag HTML, nama kelas CSS secara kaku, atau memegang ketergantungan (_tight-coupling_) terhadap modul internal inti platform lainnya.

---

## 🚫 Forbidden (Pantangan Mutlak)

1. **NO APPBUILDER IMPORT:** Dilarang keras mengimpor `AppBuilder` atau `LandingPageBuilder`. Komponen harus sepenuhnya _portable_ dan _stand-alone_.
2. **NO ROUTER IMPORT:** Dilarang keras mengimpor modul `HashRouter` atau `Router`. Tugas penunjuk arah wajib dialirkan keluar secara pasif.
3. **NO WINDOW ACCESS EXCEPT FALLBACK:** Dilarang keras memanipulasi objek global `window` atau `document.location` secara langsung, kecuali jika parameter _callback_ luar kosong murni (_fallback rescue_).
4. **NO DOM CREATION IN MAIN METHOD:** Dilarang keras menulis `document.createElement()` secara berserakan di dalam metode `create()`.
5. **NO HARDCODED TAGS & CLASSES:** Dilarang keras menulis tag HTML (`nav`, `div`, `button`) atau kelas CSS secara kaku di dalam fungsi jika elemen tersebut bersifat _configurable_ untuk desainer visual.

---

## 🛡️ Required Specifications & Contracts (Aturan Wajib)

### 1. Wajib Memiliki Identitas Unik & Terisolasi

Setiap kelas komponen wajib mendeklarasikan properti identitas yang bersifat _read-only_ sejak milidetik pertama lahir:

```ts
readonly builderId: keyof iBuilderRegistry; // Mengunci kaku sesuai token registrasi core database
readonly stylesheet: string;               // Path lokal menuju file CSS komponen pendamping
```

### 2. Standarisasi Constructor Tunggal

Semua constructor komponen di seluruh jagat raya platform Anda WAJIB menerima satu parameter seragam berbasis `BuilderConfig`:

```ts
constructor(config?: Partial<iBuilderConfig>) {
  // Wajib melakukan deep-merge selectors preset default dengan data config hantaran luar
}
```

### 3. Pipa Event Generik Satu Pintu (iBuilderConfig)

Satu-satunya saluran komunikasi ksatria menuju pusat kontrol inti hanya boleh melewati pipa generik `emit`:

```ts
this.config.emit?.("event-name", payload);
```

### 4. Ekstraksi Element Melalui Sub-Routines (Orchestration Create)

Metode `create()` murni hanya bertindak sebagai konduktor orkestrasi yang mengalirkan pemicu panggilan sub-rutin fungsi pembangun di bawahnya secara linear:

```text
create() → createContainer() → createBrand() → createItems() → createActions() → initialize()
```

### 5. Wajib Menyemburkan Stream Emitter (onElementAdded)

Setiap elemen sub-organ tubuh yang selesai diproduksi oleh metode sub-rutin wajib dilaporkan ke pusat kontrol:

```ts
this.config.emit?.("onElementAdded", {
  builder: this.builderId,
  type: "sub-organ-name", // e.g., "brand", "hamburger", "slide-item"
  element: generatedElement,
  data: this.rawDataNode, // Blueprint JSON asli hantaran dari Google Sheets luar
});
```

### 6. Isolasi Pengikatan Event (initialize Method)

Semua fungsi pendengar event klik (`addEventListener`, `click`) DILARANG KERAS dipasang saat elemen sedang dirakit di sub-rutin. Semua ikatan interaksi wajib dikumpulkan secara steril di dalam metode `initialize()`.

### 7. Pengamanan Evakuasi Memori (destroy Method)

Jika komponen memasang global listeners (seperti resize event atau window animation timers), kelas wajib memiliki metode `destroy()` untuk mencopot total seluruh listener agar kebal dari kebocoran memori (_memory leaks_).

---

## 🧙‍♂️ Interaction & Routing Logic Contracts

### 1. Kedaulatan Router Satu Pintu (Pure Pass-Through)

- Komponen Builder DILARANG KERAS melakukan pemotongan string URL kotor (seperti `.split("#")`, `.split(":")`, atau `.split("?")`).
- Jika elemen menangkap klik tautan lokal, panggil `e.preventDefault()` di baris PERTAMA murni tanpa syarat!
- Peras rute string-nya secara lurus, lalu suapkan langsung string mentah tersebut apa adanya menuju event `"builder:navigate"` atau callback `onNavigate` luar. Biarkan `HashRouter` internal yang mengunyah isinya!

### 2. Evaluasi Intersepsi dengan Asas Short-Circuit

- Jika komponen memiliki event interaksi (seperti hamburger toggle atau slide-changed), tembakkan event-nya terlebih dahulu dengan menyuapkan fungsi callback penahan `preventDefault: () => void`.
- Jika hasil evaluasi luar memicu penahanan tersebut, jalankan teknik _short-circuit_: hentikan total (`return`) seluruh manipulasi kelas atau animasi default internal komponen!

---

## 🎨 Layout Token Schema Example (The Final Shape Blueprint)

```ts
export interface iBuilderConfig {
  selectors?: Record<string, { tagName: string; className: string; src?: string; attrs?: Record<string, string> }>;
  defaultRoute?: string;
  routes?: string[];
  emit?: (event: string, data: any) => void;
  onNavigate?(href?: string): boolean | void;
}
```

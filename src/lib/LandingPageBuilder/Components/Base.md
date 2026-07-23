```text
 ┌──────────────────────────────────┐
 │      1. METODE prepare()          │ ──► Murni hanya Conductor Rantai Silsilah DOM.
 │ (Hanya Jahit Struktur Kosong)    │     0% cetak elemen manual, 0% start pagination di sini.
 └─────────────────┬────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────┐
 │      2. METODE template()         │ ──► Pos tunggal pengisian Atribut & Gaya (Inline Styles).
 │  (Penyiram Kosmetik & Atribut)   │     Menyiram data- kustom, --init-columns, & state active.
 └─────────────────┬────────────────┘
                   │
                   ▼
 ┌──────────────────────────────────┐
 │    3. METODE initialize()        │ ──► Sakelar Otak Interaksi Hidup Browser (Detonator).
 │  (Start Logic & Event Bindings)  │     Di sinilah DOM events diikat, DAN tempat start
 └──────────────────────────────────┘     pagination batch pertama diledakkan!

```

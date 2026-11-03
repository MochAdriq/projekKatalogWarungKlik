# WarungKlik - Food & Beverage Catalog Platform

Aplikasi katalog kuliner F&B (Food & Beverage) modern dengan backend REST API (Node.js & Express) dan frontend (React 19 & Vite).

---

## Gambaran Menu & Konten F&B

Data bawaan (*seeded data*) mencakup kategori dan menu kuliner nusantara pilihan:

### 1. Kategori Menu
- **Makanan Utama** (`makanan-utama`)
- **Camilan & Kudapan** (`camilan-kudapan`)
- **Minuman & Kopi** (`minuman-kopi`)
- **Paket Hemat Kombo** (`paket-hemat-kombo`)

### 2. Contoh Produk / Menu
- **Nasi Goreng Spesial Rempah** - Rp 28.000 *(Tersedia)*
- **Ayam Bakar Madu Pedas Gurih** - Rp 35.000 *(Tersedia)*
- **Mie Nyemek Khas Jawa Telur Bebek** - Rp 26.000 *(Tersedia)*
- **Es Kopi Susu Gula Aren Barista** - Rp 18.000 *(Tersedia)*
- **Matcha Latte Creamy Ice** - Rp 22.000 *(Tersedia)*
- **Es Lemon Tea Sereh Segar** - Rp 14.000 *(Tersedia)*
- **Dimsum Mentai Panggang (Isi 4)** - Rp 24.000 *(Tersedia)*
- **Pisang Goreng Crispy Keju Cokelat** - Rp 16.000 *(Tersedia)*
- **Paket Kenyang: Nasi Goreng + Es Kopi Susu** - Rp 40.000 *(Tersedia)*

---

## Struktur Direktori Bersih

```text
WarungKlik/
├── package.json               # Skrip orkestrasi monorepo
├── README.md                  # Dokumentasi panduan
├── client/                    # Frontend Web (React 19 + Vite)
│   ├── package.json
│   ├── vite.config.js         # Proxy http://localhost:5000
│   └── src/                   # Komponen React & styling
└── server/                    # Backend REST API (Express)
    ├── package.json
    ├── uploads/               # Direktori gambar menu
    └── src/
        ├── index.js           # Server utama Express ES Module (Port 5000)
        ├── db/
        │   ├── data.json      # Database / seed data JSON
        │   └── db.js          # Database engine
        ├── middleware/
        │   └── auth.js        # JWT middleware auth
        └── routes/
            ├── auth.js        # Login admin (/api/auth)
            ├── categories.js  # CRUD kategori (/api/categories)
            ├── products.js    # CRUD menu kuliner (/api/products)
            └── store.js       # Pengaturan toko & WhatsApp (/api/stores)
```

---

## Cara Menjalankan

### Menjalankan Backend (Server)
```bash
cd "c:\Users\HYPE R Series\Documents\Me\sukarobot\WarungKlik\server"
npm run dev
```
Server berjalan di `http://localhost:5000`.

### Menjalankan Frontend (Client)
```bash
cd "c:\Users\HYPE R Series\Documents\Me\sukarobot\WarungKlik\client"
npm run dev
```
Client Vite berjalan di `http://localhost:3000` (atau port default Vite).

---

## Akun Admin Default

- **Email**: `admin@warungklik.com`
- **Password**: `warungklik123`
- **Endpoint Login**: `POST /api/auth/login`

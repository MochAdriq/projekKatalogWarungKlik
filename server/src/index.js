import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import storeRoutes from "./routes/store.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
// Default hanya menerima koneksi dari dalam server (Nginx). Ubah HOST di .env hanya jika memang perlu.
const host = process.env.HOST || "127.0.0.1";

// Di belakang Nginx: pakai IP asli klien dari X-Forwarded-For (untuk pembatas laju).
app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Migrate any files accidentally uploaded to server/src/uploads into server/uploads
const legacyUploadPath = path.join(__dirname, "uploads");
if (fs.existsSync(legacyUploadPath)) {
  try {
    for (const file of fs.readdirSync(legacyUploadPath)) {
      const srcFile = path.join(legacyUploadPath, file);
      const destFile = path.join(uploadPath, file);
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  } catch (err) {
    console.error("Failed migrating legacy uploads:", err.message);
  }
}

const staticUploadOptions = {
  setHeaders: (res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
  },
};

app.use("/uploads", express.static(uploadPath, staticUploadOptions));
if (fs.existsSync(legacyUploadPath)) {
  app.use("/uploads", express.static(legacyUploadPath, staticUploadOptions));
}

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "WarungKlik API",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to WarungKlik API",
    endpoints: {
      auth: "/api/auth",
      categories: "/api/categories",
      products: "/api/products",
      stores: "/api/stores",
      health: "/api/health",
    },
  });
});

import { db } from "./db/db.js";

const startServer = async () => {
  try {
    await db.ensureReady();
  } catch (err) {
    console.error("Gagal inisialisasi DB saat start:", err.message);
  }

  app.listen(port, host, () => {
    console.log(`Server WarungKlik is running on http://${host}:${port}`);
  });
};

startServer();

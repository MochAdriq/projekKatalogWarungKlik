import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db/db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Hanya raster image. SVG sengaja TIDAK diizinkan karena bisa memuat <script> (stored XSS).
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
};

// Deteksi tipe asli dari isi file (magic bytes), bukan dari nama/mimetype kiriman klien.
const detectImageExt = (buf) => {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  const head6 = buf.slice(0, 6).toString("latin1");
  if (head6 === "GIF87a" || head6 === "GIF89a") return ".gif";
  if (buf.slice(0, 4).toString("latin1") === "RIFF" && buf.slice(8, 12).toString("latin1") === "WEBP") return ".webp";
  if (buf[0] === 0x42 && buf[1] === 0x4d) return ".bmp";
  if (buf.slice(4, 8).toString("latin1") === "ftyp") {
    const brand = buf.slice(8, 12).toString("latin1");
    if (brand === "avif" || brand === "avis") return ".avif";
  }
  return null;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Ekstensi ditentukan server dari mimetype yang diizinkan, bukan dari nama file klien.
    const ext = MIME_TO_EXT[(file.mimetype || "").toLowerCase()] || ".bin";
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (MIME_TO_EXT[(file.mimetype || "").toLowerCase()]) {
      return cb(null, true);
    }
    cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, WEBP, AVIF, GIF, atau BMP."));
  },
});

const removeUploadedFile = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

const uploadImageMiddleware = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Ukuran foto terlalu besar (Maksimal 10 MB)"
            : err.message || "Gagal mengunggah foto menu",
      });
    }

    if (req.file) {
      try {
        const fd = fs.openSync(req.file.path, "r");
        const head = Buffer.alloc(16);
        fs.readSync(fd, head, 0, 16, 0);
        fs.closeSync(fd);

        const realExt = detectImageExt(head);
        if (!realExt) {
          removeUploadedFile(req.file);
          return res.status(400).json({
            success: false,
            message: "Isi file bukan gambar yang valid. Gunakan JPG, PNG, WEBP, AVIF, GIF, atau BMP.",
          });
        }

        // Samakan ekstensi dengan isi file yang sebenarnya.
        const currentExt = path.extname(req.file.filename);
        if (currentExt !== realExt) {
          const newName = req.file.filename.slice(0, -currentExt.length) + realExt;
          const newPath = path.join(uploadDir, newName);
          fs.renameSync(req.file.path, newPath);
          req.file.filename = newName;
          req.file.path = newPath;
        }
      } catch {
        removeUploadedFile(req.file);
        return res.status(400).json({ success: false, message: "Gagal memproses file foto." });
      }
    }
    next();
  });
};

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categoryId = req.query.categoryId || req.query.categryId;
    const { search, stockStatus } = req.query;
    const products = await db.getProducts({ categoryId, search, stockStatus });
    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", authenticateToken, requireAdmin, uploadImageMiddleware, async (req, res) => {
  try {
    const { name, price, stockStatus, categoryId, description, imageurl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category product is required",
      });
    }
    if (price === undefined || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    let finalImage = imageurl;
    if (req.file) {
      finalImage = `/uploads/${req.file.filename}`;
    }

    const newProduct = await db.addProduct({
      name: name.trim(),
      categoryId,
      price: parseFloat(price),
      stockStatus: stockStatus || "Tersedia",
      description: description ? description.trim() : "",
      image: finalImage || "",
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: "Product added successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", authenticateToken, requireAdmin, uploadImageMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stockStatus, categoryId, description, imageurl } = req.body;

    const existing = await db.getProductById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (categoryId !== undefined) updatePayload.categoryId = categoryId;
    if (price !== undefined) updatePayload.price = parseFloat(price);
    if (stockStatus !== undefined) updatePayload.stockStatus = stockStatus;
    if (description !== undefined) updatePayload.description = description.trim();

    if (req.file) {
      updatePayload.image = `/uploads/${req.file.filename}`;
    } else if (imageurl !== undefined && imageurl.trim()) {
      updatePayload.image = imageurl.trim();
    }

    const updated = await db.updateProduct(id, updatePayload);

    res.json({
      success: true,
      data: updated,
      message: "Product updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.toggleStock(id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: updated,
      message: `Product stock status updated to ${updated.stockStatus}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

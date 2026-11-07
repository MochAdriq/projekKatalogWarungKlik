import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db/db.js";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    let ext = (path.extname(file.originalname || "") || "").toLowerCase();
    if (!ext || ext === ".jfif" || ext === ".jpe") {
      ext = MIME_TO_EXT[(file.mimetype || "").toLowerCase()] || ".jpg";
    }
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|avif|jfif|svg|bmp/;
    const ext = path.extname(file.originalname || "").toLowerCase().replace(".", "");
    const mime = (file.mimetype || "").toLowerCase();
    if (mime.startsWith("image/") && (allowed.test(ext) || allowed.test(mime))) {
      return cb(null, true);
    }
    cb(new Error("Format file tidak didukung. Gunakan JPG, JPEG, PNG, WEBP, AVIF, atau GIF."));
  },
});

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

router.post("/", authenticateToken, uploadImageMiddleware, async (req, res) => {
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

router.put("/:id", authenticateToken, uploadImageMiddleware, async (req, res) => {
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

router.patch("/:id", authenticateToken, async (req, res) => {
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

router.delete("/:id", authenticateToken, async (req, res) => {
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

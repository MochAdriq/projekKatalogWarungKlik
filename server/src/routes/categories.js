import express from "express";
import { db } from "../db/db.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  try {
    const categories = await db.getCategories();
    const existing = categories.find((cat) => cat.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const newCat = await db.addCategory(name.trim());
    res.status(201).json({
      success: true,
      data: newCat,
      message: "Category added successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const products = await db.getProducts({ categoryId: id });
    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${products.length} menu aktif. Pindahkan atau hapus menu tersebut terlebih dahulu.`,
      });
    }

    const deleted = await db.deleteCategory(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { authenticateToken, requireAdmin, JWT_SECRET } from "../middleware/auth.js";
import { authLimiter, orderLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

const ORDER_STATUSES = ["Menunggu Konfirmasi", "Diproses", "Selesai", "Dibatalkan"];

// Register new customer account
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone = "", address = "" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email ini sudah terdaftar. Silakan langsung masuk.",
      });
    }

    const newUser = await db.createUser({
      name,
      email,
      password,
      phone,
      address,
      role: "customer",
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Pendaftaran akun berhasil!",
      token,
      user: newUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login (supports both Admin and Customer)
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const account = await db.getUserByEmail(email);
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Email atau password tidak sesuai",
      });
    }

    const isMatch = bcrypt.compareSync(password, account.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password tidak sesuai",
      });
    }

    const token = jwt.sign(
      {
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role || "customer",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Berhasil masuk",
      token,
      user: {
        id: account.id,
        email: account.email,
        name: account.name,
        phone: account.phone || "",
        address: account.address || "",
        role: account.role || "customer",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get current logged-in user (Admin or Customer)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const account = await db.getUserById(req.user.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Akun tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update customer profile (including optional password change)
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, newPassword } = req.body;
    if (newPassword && String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 6 karakter",
      });
    }
    const updated = await db.updateUserProfile(req.user.id, {
      name,
      phone,
      address,
      newPassword,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update Admin profile (Name, Email, Password)
router.put("/admin-profile", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, newPassword } = req.body;
    if (newPassword && String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password admin baru minimal 6 karakter",
      });
    }
    const updated = await db.updateAdminProfile(req.user.id, {
      name,
      email,
      newPassword,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Akun admin tidak ditemukan" });
    }
    res.json({
      success: true,
      message: "Profil & keamanan Admin berhasil diperbarui",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all registered users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update / Reset password of a user
router.put("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, address, newPassword } = req.body;
    if (newPassword && String(newPassword).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 6 karakter",
      });
    }
    const updated = await db.updateUserByAdmin(req.params.id, {
      name,
      email,
      phone,
      address,
      newPassword,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({
      success: true,
      message: "Data & password user berhasil diperbarui",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete a user
router.delete("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteUser(req.params.id);
    res.json({ success: deleted, message: deleted ? "User berhasil dihapus" : "User tidak ditemukan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Favorites endpoints
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const items = await db.getUserFavorites(req.user.id);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/favorites/:productId", authenticateToken, async (req, res) => {
  try {
    const result = await db.toggleFavorite(req.user.id, req.params.productId);
    const items = await db.getUserFavorites(req.user.id);
    res.json({
      success: true,
      favorited: result.favorited,
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Orders endpoints
// Server menghitung sendiri harga & total dari tabel products; klien hanya mengirim productId + quantity.
router.post("/orders", orderLimiter, async (req, res) => {
  try {
    // Optional auth token if logged in
    let userId = null;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {
        userId = null;
      }
    }

    const { customerName, customerPhone, customerAddress, items, notes } = req.body;

    const cleanName = String(customerName || "").trim();
    const cleanPhone = String(customerPhone || "").trim();
    const cleanAddress = String(customerAddress || "").trim();
    const cleanNotes = String(notes || "").trim();

    if (!cleanName) {
      return res.status(400).json({ success: false, message: "Nama pemesan wajib diisi" });
    }
    if (cleanName.length > 100 || cleanPhone.length > 30 || cleanAddress.length > 500 || cleanNotes.length > 500) {
      return res.status(400).json({ success: false, message: "Data pesanan terlalu panjang" });
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Daftar menu pesanan tidak valid (maksimal 30 jenis menu)",
      });
    }

    // Gabungkan productId yang sama, validasi jumlah
    const wanted = new Map();
    for (const it of items) {
      const productId = String(it?.productId || "");
      const quantity = Number(it?.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({
          success: false,
          message: "Jumlah porsi harus berupa angka bulat antara 1 sampai 99",
        });
      }
      wanted.set(productId, (wanted.get(productId) || 0) + quantity);
    }

    const verifiedItems = [];
    let totalPrice = 0;
    for (const [productId, quantity] of wanted) {
      const product = await db.getProductById(productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Ada menu di pesanan yang sudah tidak tersedia di katalog. Muat ulang halaman lalu coba lagi.",
        });
      }
      if (product.stockStatus !== "Tersedia") {
        return res.status(400).json({
          success: false,
          message: `Menu "${product.name}" sedang habis. Hapus dari pesanan lalu coba lagi.`,
        });
      }
      const price = Number(product.price) || 0;
      totalPrice += price * quantity;
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        price,
        quantity,
        imageUrl: product.imageUrl || "",
      });
    }

    const order = await db.createOrder({
      userId,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerAddress: cleanAddress,
      items: verifiedItems,
      totalPrice,
      notes: cleanNotes,
    });

    res.status(201).json({
      success: true,
      message: "Pesanan berhasil tercatat",
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/orders/my", authenticateToken, async (req, res) => {
  try {
    const orders = await db.getUserOrders(req.user.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/orders/all", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/orders/bulk-status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pilih minimal 1 pesanan untuk diubah statusnya",
      });
    }
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status pesanan tidak valid. Pilihan: ${ORDER_STATUSES.join(", ")}`,
      });
    }
    const cleanIds = orderIds.map((id) => String(id).trim()).filter(Boolean);
    const updatedCount = await db.bulkUpdateOrderStatus(cleanIds, status);
    res.json({
      success: true,
      updatedCount,
      message: `${updatedCount} pesanan berhasil diubah ke status '${status}'`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status pesanan tidak valid. Pilihan: ${ORDER_STATUSES.join(", ")}`,
      });
    }
    const updated = await db.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

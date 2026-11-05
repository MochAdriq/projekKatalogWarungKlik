import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { authenticateToken, JWT_SECRET } from "../middleware/auth.js";

const router = express.Router();

// Register new customer account
router.post("/register", async (req, res) => {
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
router.post("/login", async (req, res) => {
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

// Update customer profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updated = await db.updateUserProfile(req.user.id, { name, phone, address });
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

// Admin: Get all registered users
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete a user
router.delete("/users/:id", authenticateToken, async (req, res) => {
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
router.post("/orders", async (req, res) => {
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

    const { customerName, customerPhone, customerAddress, items, totalPrice, notes } = req.body;
    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nama pemesan dan daftar menu wajib diisi",
      });
    }

    const order = await db.createOrder({
      userId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      totalPrice,
      notes,
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

router.get("/orders/all", authenticateToken, async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/orders/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await db.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data.json");

// Figma default initial data
const INITIAL_CATEGORIES = [
  { id: "cat_bowls", name: "Bowls", slug: "bowls" },
  { id: "cat_salads", name: "Salads", slug: "salads" },
  { id: "cat_warm", name: "Warm plates", slug: "warm-plates" },
  { id: "cat_breakfast", name: "Breakfast", slug: "breakfast" },
  { id: "cat_drinks", name: "Cold pressed", slug: "cold-pressed" },
];

const INITIAL_PRODUCTS = [
  {
    id: "prod_harvest",
    name: "Harvest bowl",
    categoryId: "cat_bowls",
    price: 25000,
    stockStatus: "Tersedia",
    description: "Fluffy quinoa, creamy avocado & roasted sweet potato, finished with our lemon-tahini dressing.",
    image: "/uploads/food-1.jpg",
  },
  {
    id: "prod_daily_salad",
    name: "Daily greens salad",
    categoryId: "cat_salads",
    price: 22000,
    stockStatus: "Tersedia",
    description: "Farm-fresh mixed greens, toasted pumpkin seeds, crisp cucumber, and cold-pressed olive vinaigrette.",
    image: "/uploads/food-2.jpg",
  },
  {
    id: "prod_green_goddess",
    name: "Green goddess grain bowl",
    categoryId: "cat_bowls",
    price: 28000,
    stockStatus: "Tersedia",
    description: "Steamed edamame, broccoli florets, ribboned zucchini, wild rice, and green herb drizzle.",
    image: "/uploads/food-3.jpg",
  },
  {
    id: "prod_roasted_root",
    name: "Roasted root plate",
    categoryId: "cat_warm",
    price: 30000,
    stockStatus: "Tersedia",
    description: "Spiced chickpeas, roasted baby carrots, charred greens, and warm sourdough slice.",
    image: "/uploads/food-4.jpg",
  },
  {
    id: "prod_acai_bowl",
    name: "Sunrise acai bowl",
    categoryId: "cat_breakfast",
    price: 24000,
    stockStatus: "Tersedia",
    description: "Organic acai blend, fresh wild berries, crunchy artisan granola, and toasted coconut flakes.",
    image: "/uploads/food-5.jpg",
  },
  {
    id: "prod_detox_juice",
    name: "Pure green detox juice",
    categoryId: "cat_drinks",
    price: 18000,
    stockStatus: "Tersedia",
    description: "Green apple, kale, celery, fresh ginger root, and Persian lime.",
    image: "/uploads/food-6.jpg",
  },
  {
    id: "prod_avo_toast",
    name: "Avocado sourdough toast",
    categoryId: "cat_breakfast",
    price: 20000,
    stockStatus: "Tersedia",
    description: "Smashed avocado, heirloom cherry tomatoes, sea salt flakes on toasted country loaf.",
    image: "/uploads/food-7.jpg",
  },
  {
    id: "prod_mushroom_grain",
    name: "Wild mushroom grain skillet",
    categoryId: "cat_warm",
    price: 29000,
    stockStatus: "Tersedia",
    description: "Pan-roasted oyster mushrooms, garlic herbed farro, and crispy shallots.",
    image: "/uploads/food-8.jpg",
  },
];

class MysqlDatabase {
  constructor() {
    this.pool = null;
    this.initialized = false;
    this.initPromise = this.init();
  }

  async init() {
    try {
      const host = process.env.DB_HOST || "localhost";
      const port = Number(process.env.DB_PORT) || 3306;
      const user = process.env.DB_USER || "root";
      const password = process.env.DB_PASSWORD || "";
      const dbName = process.env.DB_NAME || "warungklik_db";

      // 1. Create database if it doesn't exist
      const initialConn = await mysql.createConnection({ host, port, user, password });
      await initialConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      await initialConn.end();

      // 2. Create connection pool to the database
      this.pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // 3. Create tables
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          category_id VARCHAR(50) NOT NULL,
          price INT NOT NULL,
          stock_status VARCHAR(50) NOT NULL DEFAULT 'Tersedia',
          description TEXT,
          image VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          setting_key VARCHAR(50) PRIMARY KEY,
          setting_value TEXT NOT NULL
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(30) DEFAULT '',
          address TEXT,
          role VARCHAR(20) NOT NULL DEFAULT 'customer',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          user_id VARCHAR(50) NOT NULL,
          product_id VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, product_id),
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) DEFAULT NULL,
          customer_name VARCHAR(100) NOT NULL,
          customer_phone VARCHAR(30) DEFAULT '',
          customer_address TEXT,
          items_json LONGTEXT NOT NULL,
          total_price INT NOT NULL DEFAULT 0,
          notes TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'Menunggu Konfirmasi',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Seed initial data
      await this.seedInitialData();
      this.initialized = true;
      console.log(`[MySQL] Terhubung sukses ke database '${dbName}' di XAMPP!`);
    } catch (err) {
      console.error("[MySQL Error] Gagal inisialisasi database MySQL:", err.message);
    }
  }

  async seedInitialData() {
    // Seed Settings
    const [settingsRows] = await this.pool.query("SELECT COUNT(*) AS count FROM settings");
    if (settingsRows[0].count === 0) {
      const defaultSettings = {
        storeName: "Daily greens",
        tagline: "Freshly made. Thoughtfully sourced. To your door.",
        address: "Sudirman Central, Jakarta",
        phone: "0895338977816",
        currency: "Rp",
        activeWhatsApp: "true",
      };
      for (const [key, value] of Object.entries(defaultSettings)) {
        await this.pool.query(
          "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
          [key, String(value), String(value)]
        );
      }
    }

    // Seed Admin
    const [adminRows] = await this.pool.query("SELECT COUNT(*) AS count FROM admins");
    if (adminRows[0].count === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await this.pool.query(
        "INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)",
        ["admin_1", "Admin Daily Greens", "admin@warungklik.com", hashedPassword]
      );
    }

    // Seed Categories
    const [catRows] = await this.pool.query("SELECT COUNT(*) AS count FROM categories");
    if (catRows[0].count === 0) {
      for (const cat of INITIAL_CATEGORIES) {
        await this.pool.query(
          "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
          [cat.id, cat.name, cat.slug]
        );
      }
    }

    // Seed Products
    const [prodRows] = await this.pool.query("SELECT COUNT(*) AS count FROM products");
    if (prodRows[0].count === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await this.pool.query(
          "INSERT INTO products (id, name, category_id, price, stock_status, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [p.id, p.name, p.categoryId, p.price, p.stockStatus, p.description, p.image]
        );
      }
    }
  }

  async ensureReady() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  // --- Products ---
  async getProducts({ categoryId, search, stockStatus } = {}) {
    await this.ensureReady();
    let sql = `
      SELECT p.id, p.id AS _id, p.name, p.category_id AS categoryId, c.name AS categoryName,
             p.price, p.stock_status AS stockStatus, p.description, p.image AS imageUrl, p.image AS imageurl,
             p.created_at AS createdAt, p.updated_at AS updatedAt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      sql += " AND p.category_id = ?";
      params.push(categoryId);
    }
    if (search) {
      sql += " AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }
    if (stockStatus) {
      sql += " AND p.stock_status = ?";
      params.push(stockStatus);
    }

    sql += " ORDER BY p.created_at DESC";
    const [rows] = await this.pool.query(sql, params);
    return rows;
  }

  async getProductById(id) {
    await this.ensureReady();
    const sql = `
      SELECT p.id, p.id AS _id, p.name, p.category_id AS categoryId, c.name AS categoryName,
             p.price, p.stock_status AS stockStatus, p.description, p.image AS imageUrl, p.image AS imageurl,
             p.created_at AS createdAt, p.updated_at AS updatedAt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const [rows] = await this.pool.query(sql, [id]);
    return rows[0] || null;
  }

  async addProduct(data) {
    await this.ensureReady();
    const id = `prod_${Date.now()}`;
    const name = data.name;
    const categoryId = data.categoryId;
    const price = Number(data.price) || 0;
    const stockStatus = data.stockStatus || "Tersedia";
    const description = data.description || "";
    const image = data.image || data.imageurl || "/uploads/food-1.jpg";

    await this.pool.query(
      "INSERT INTO products (id, name, category_id, price, stock_status, description, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name, categoryId, price, stockStatus, description, image]
    );
    return await this.getProductById(id);
  }

  async updateProduct(id, data) {
    await this.ensureReady();
    const existing = await this.getProductById(id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const categoryId = data.categoryId !== undefined ? data.categoryId : existing.categoryId;
    const price = data.price !== undefined ? Number(data.price) : existing.price;
    const stockStatus = data.stockStatus !== undefined ? data.stockStatus : existing.stockStatus;
    const description = data.description !== undefined ? data.description : existing.description;
    const image = data.image !== undefined ? data.image : (data.imageurl !== undefined ? data.imageurl : existing.imageUrl);

    await this.pool.query(
      "UPDATE products SET name = ?, category_id = ?, price = ?, stock_status = ?, description = ?, image = ? WHERE id = ?",
      [name, categoryId, price, stockStatus, description, image, id]
    );
    return await this.getProductById(id);
  }

  async toggleStock(id) {
    await this.ensureReady();
    const product = await this.getProductById(id);
    if (!product) return null;

    const newStatus = product.stockStatus === "Tersedia" ? "Habis" : "Tersedia";
    await this.pool.query("UPDATE products SET stock_status = ? WHERE id = ?", [newStatus, id]);
    return await this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.ensureReady();
    const [result] = await this.pool.query("DELETE FROM products WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  // --- Categories ---
  async getCategories() {
    await this.ensureReady();
    const [rows] = await this.pool.query("SELECT id, id AS _id, name, slug FROM categories ORDER BY name ASC");
    return rows;
  }

  async addCategory(name) {
    await this.ensureReady();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const id = `cat_${Date.now()}`;
    await this.pool.query("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)", [id, name, slug]);
    return { id, _id: id, name, slug };
  }

  async deleteCategory(id) {
    await this.ensureReady();
    const [result] = await this.pool.query("DELETE FROM categories WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  // --- Store Settings ---
  async getStoreSettings() {
    await this.ensureReady();
    const [rows] = await this.pool.query("SELECT setting_key, setting_value FROM settings");
    const settings = {
      storeName: "Daily greens",
      tagline: "Freshly made. Thoughtfully sourced. To your door.",
      address: "Sudirman Central, Jakarta",
      phone: "0895338977816",
      currency: "Rp",
      activeWhatsApp: true,
    };
    rows.forEach((r) => {
      if (r.setting_key === "activeWhatsApp") {
        settings[r.setting_key] = r.setting_value === "true";
      } else {
        settings[r.setting_key] = r.setting_value;
      }
    });
    return settings;
  }

  async updateStoreSettings(newSettings) {
    await this.ensureReady();
    for (const [key, value] of Object.entries(newSettings)) {
      if (value !== undefined) {
        await this.pool.query(
          "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
          [key, String(value), String(value)]
        );
      }
    }
    return await this.getStoreSettings();
  }

  // --- Admin & User Auth ---
  async getAdmin() {
    await this.ensureReady();
    const [rows] = await this.pool.query("SELECT id, name, email, password FROM admins LIMIT 1");
    return rows[0] ? { ...rows[0], role: "admin" } : null;
  }

  async createAdmin({ name, email, password }) {
    await this.ensureReady();
    const id = `admin_${Date.now()}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    await this.pool.query("INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)", [
      id,
      name,
      email,
      hashedPassword,
    ]);
    return { id, name, email, role: "admin" };
  }

  async getUserByEmail(email) {
    await this.ensureReady();
    const cleanEmail = email.trim().toLowerCase();
    // 1. Check admins table first
    const [adminRows] = await this.pool.query(
      "SELECT id, name, email, password, created_at AS createdAt FROM admins WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );
    if (adminRows[0]) {
      return {
        ...adminRows[0],
        phone: "",
        address: "",
        role: "admin",
      };
    }

    // 2. Check users table
    const [userRows] = await this.pool.query(
      "SELECT id, name, email, password, phone, address, role, created_at AS createdAt FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );
    return userRows[0] || null;
  }

  async getUserById(id) {
    await this.ensureReady();
    if (String(id).startsWith("admin_")) {
      const [adminRows] = await this.pool.query(
        "SELECT id, name, email, created_at AS createdAt FROM admins WHERE id = ? LIMIT 1",
        [id]
      );
      if (adminRows[0]) {
        return { ...adminRows[0], phone: "", address: "", role: "admin" };
      }
    }

    const [userRows] = await this.pool.query(
      "SELECT id, name, email, phone, address, role, created_at AS createdAt FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return userRows[0] || null;
  }

  async createUser({ name, email, password, phone = "", address = "", role = "customer" }) {
    await this.ensureReady();
    const id = `user_${Date.now()}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    await this.pool.query(
      "INSERT INTO users (id, name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, name.trim(), email.trim().toLowerCase(), hashedPassword, phone.trim(), address.trim(), role]
    );
    return await this.getUserById(id);
  }

  async updateUserProfile(id, { name, phone, address }) {
    await this.ensureReady();
    const existing = await this.getUserById(id);
    if (!existing) return null;
    const nextName = name !== undefined ? name.trim() : existing.name;
    const nextPhone = phone !== undefined ? phone.trim() : existing.phone || "";
    const nextAddress = address !== undefined ? address.trim() : existing.address || "";

    await this.pool.query(
      "UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?",
      [nextName, nextPhone, nextAddress, id]
    );
    return await this.getUserById(id);
  }

  async getAllUsers() {
    await this.ensureReady();
    const [rows] = await this.pool.query(
      "SELECT id, name, email, phone, address, role, created_at AS createdAt FROM users ORDER BY created_at DESC"
    );
    return rows;
  }

  async deleteUser(id) {
    await this.ensureReady();
    await this.pool.query("DELETE FROM favorites WHERE user_id = ?", [id]);
    const [res] = await this.pool.query("DELETE FROM users WHERE id = ?", [id]);
    return res.affectedRows > 0;
  }

  // --- Favorites ---
  async getUserFavorites(userId) {
    await this.ensureReady();
    const [rows] = await this.pool.query(
      `SELECT p.id, p.id AS _id, p.name, p.category_id AS categoryId, c.name AS categoryName,
              p.price, p.stock_status AS stockStatus, p.description, p.image AS imageUrl, p.image AS imageurl
       FROM favorites f
       INNER JOIN products p ON f.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async toggleFavorite(userId, productId) {
    await this.ensureReady();
    const [existing] = await this.pool.query(
      "SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?",
      [userId, productId]
    );
    if (existing.length > 0) {
      await this.pool.query("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", [
        userId,
        productId,
      ]);
      return { favorited: false };
    } else {
      await this.pool.query("INSERT INTO favorites (user_id, product_id) VALUES (?, ?)", [
        userId,
        productId,
      ]);
      return { favorited: true };
    }
  }

  // --- Orders ---
  async createOrder({
    userId = null,
    customerName,
    customerPhone = "",
    customerAddress = "",
    items = [],
    totalPrice = 0,
    notes = "",
  }) {
    await this.ensureReady();
    const id = `ORD-${Date.now().toString().slice(-6)}`;
    const itemsJson = JSON.stringify(items);
    await this.pool.query(
      `INSERT INTO orders (id, user_id, customer_name, customer_phone, customer_address, items_json, total_price, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Konfirmasi')`,
      [id, userId, customerName, customerPhone, customerAddress, itemsJson, Number(totalPrice) || 0, notes]
    );
    return await this.getOrderById(id);
  }

  async getOrderById(id) {
    await this.ensureReady();
    const [rows] = await this.pool.query(
      `SELECT id, user_id AS userId, customer_name AS customerName, customer_phone AS customerPhone,
              customer_address AS customerAddress, items_json AS itemsJson, total_price AS totalPrice,
              notes, status, created_at AS createdAt
       FROM orders WHERE id = ?`,
      [id]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      items: JSON.parse(rows[0].itemsJson || "[]"),
    };
  }

  async getUserOrders(userId) {
    await this.ensureReady();
    const [rows] = await this.pool.query(
      `SELECT id, user_id AS userId, customer_name AS customerName, customer_phone AS customerPhone,
              customer_address AS customerAddress, items_json AS itemsJson, total_price AS totalPrice,
              notes, status, created_at AS createdAt
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      items: JSON.parse(r.itemsJson || "[]"),
    }));
  }

  async getAllOrders() {
    await this.ensureReady();
    const [rows] = await this.pool.query(
      `SELECT id, user_id AS userId, customer_name AS customerName, customer_phone AS customerPhone,
              customer_address AS customerAddress, items_json AS itemsJson, total_price AS totalPrice,
              notes, status, created_at AS createdAt
       FROM orders ORDER BY created_at DESC`
    );
    return rows.map((r) => ({
      ...r,
      items: JSON.parse(r.itemsJson || "[]"),
    }));
  }

  async updateOrderStatus(id, status) {
    await this.ensureReady();
    await this.pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    return await this.getOrderById(id);
  }
}

export const db = new MysqlDatabase();

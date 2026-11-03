import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_FILE = path.join(__dirname, "warungklik.sqlite");
const DATA_FILE = path.join(__dirname, "data.json");

// Dynamic import for node:sqlite (available on Node v22.5.0+)
let DatabaseSync = null;
try {
  const sqlite = await import("node:sqlite");
  DatabaseSync = sqlite.DatabaseSync;
} catch {
  DatabaseSync = null;
}

// -------------------------------------------------------------
// SQLite Implementation (Used when node:sqlite is available)
// -------------------------------------------------------------
class SqliteDatabase {
  constructor() {
    this.db = new DatabaseSync(SQLITE_FILE);
    this.initTables();
    this.seedInitialData();
  }

  initTables() {
    this.db.exec("PRAGMA foreign_keys = ON;");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        price INTEGER NOT NULL,
        stock_status TEXT NOT NULL DEFAULT 'Tersedia',
        description TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
    `);
  }

  seedInitialData() {
    const seedData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    const existingSettings = this.db
      .prepare("SELECT COUNT(*) AS count FROM settings")
      .get();
    if (existingSettings.count === 0) {
      const insertSetting = this.db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
      );
      for (const [key, value] of Object.entries(seedData.settings)) {
        insertSetting.run(key, String(value));
      }
    }

    const existingAdmin = this.db
      .prepare("SELECT COUNT(*) AS count FROM admins")
      .get();
    if (existingAdmin.count === 0) {
      const hashedPassword = bcrypt.hashSync(seedData.admin.password, 10);
      this.db
        .prepare(
          "INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)",
        )
        .run(
          seedData.admin.id,
          seedData.admin.name,
          seedData.admin.email,
          hashedPassword,
        );
    }

    const existingCategories = this.db
      .prepare("SELECT COUNT(*) AS count FROM categories")
      .get();
    if (existingCategories.count === 0) {
      const insertCat = this.db.prepare(
        "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
      );
      for (const category of seedData.categories) {
        insertCat.run(category.id, category.name, category.slug);
      }
    }

    const existingProducts = this.db
      .prepare("SELECT COUNT(*) AS count FROM products")
      .get();
    if (existingProducts.count === 0) {
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, name, category_id, price, stock_status, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const product of seedData.products) {
        const stockStatus =
          typeof product.stockStatus === "number"
            ? product.stockStatus > 0
              ? "Tersedia"
              : "Habis"
            : product.stockStatus || "Tersedia";
        insertProduct.run(
          product.id,
          product.name,
          product.categoryId,
          product.price,
          stockStatus,
          product.description,
          product.image,
        );
      }
    }
  }

  getSettings() {
    const rows = this.db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  getStoreSettings() {
    return this.getSettings();
  }

  updateSettings(newSettings) {
    const upsert = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, val] of Object.entries(newSettings)) {
      upsert.run(key, String(val));
    }
    return this.getSettings();
  }

  updateStoreSettings(newSettings) {
    return this.updateSettings(newSettings);
  }

  getAdmin() {
    return this.db
      .prepare("SELECT id, name, email, password FROM admins LIMIT 1")
      .get();
  }

  getCategories() {
    return this.db
      .prepare(
        `
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.created_at AS createdAt,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `,
      )
      .all();
  }

  getCategoryById(id) {
    return this.db
      .prepare("SELECT id, name, slug FROM categories WHERE id = ?")
      .get(id);
  }

  addCategory(name) {
    const id = `cat-${Date.now()}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    this.db
      .prepare("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)")
      .run(id, name, slug);
    return { id, name, slug, productCount: 0 };
  }

  updateCategory(id, name) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const res = this.db
      .prepare("UPDATE categories SET name = ?, slug = ? WHERE id = ?")
      .run(name, slug, id);
    if (res.changes === 0) return null;
    return { id, name, slug };
  }

  deleteCategory(id) {
    const res = this.db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return res.changes > 0;
  }

  getProducts(filters = {}) {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.categoryId) {
      sql += " AND p.category_id = ?";
      params.push(filters.categoryId);
    }

    if (filters.stockStatus) {
      sql += " AND p.stock_status = ?";
      params.push(filters.stockStatus);
    }

    if (filters.search) {
      sql += " AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?)";
      const queryPattern = `%${filters.search.toLowerCase()}%`;
      params.push(queryPattern, queryPattern);
    }

    sql += " ORDER BY p.created_at DESC";

    return this.db.prepare(sql).all(...params);
  }

  getProductById(id) {
    return this.db
      .prepare(
        `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,
      )
      .get(id);
  }

  addProduct(productData) {
    const id = `prod-${Date.now()}`;
    const price = Number(productData.price) || 0;
    const stockStatus = productData.stockStatus || "Tersedia";
    const description = productData.description || "";
    const image =
      productData.image ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

    this.db
      .prepare(
        `
      INSERT INTO products (id, name, category_id, price, stock_status, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        id,
        productData.name,
        productData.categoryId,
        price,
        stockStatus,
        description,
        image,
      );

    return this.getProductById(id);
  }

  updateProduct(id, productData) {
    const current = this.getProductById(id);
    if (!current) return null;

    const name =
      productData.name !== undefined ? productData.name : current.name;
    const categoryId =
      productData.categoryId !== undefined
        ? productData.categoryId
        : current.categoryId;
    const price =
      productData.price !== undefined
        ? Number(productData.price)
        : current.price;
    const stockStatus =
      productData.stockStatus !== undefined
        ? productData.stockStatus
        : current.stockStatus;
    const description =
      productData.description !== undefined
        ? productData.description
        : current.description;
    const image =
      productData.image !== undefined ? productData.image : current.image;

    this.db
      .prepare(
        `
      UPDATE products 
      SET name = ?, category_id = ?, price = ?, stock_status = ?, description = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(name, categoryId, price, stockStatus, description, image, id);

    return this.getProductById(id);
  }

  toggleStock(id) {
    const product = this.getProductById(id);
    if (!product) return null;

    const newStock = product.stockStatus === "Tersedia" ? "Habis" : "Tersedia";
    this.db
      .prepare(
        `
      UPDATE products 
      SET stock_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      )
      .run(newStock, id);

    return this.getProductById(id);
  }

  deleteProduct(id) {
    const res = this.db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return res.changes > 0;
  }
}

// -------------------------------------------------------------
// JSON Database Engine (Fallback for Node < 22 without node:sqlite)
// -------------------------------------------------------------
class JsonDatabase {
  constructor() {
    this.filePath = DATA_FILE;
    this.data = this.loadData();
  }

  loadData() {
    try {
      const content = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(content);
      if (parsed.admin && !parsed.admin.passwordHashed) {
        parsed.admin.password = bcrypt.hashSync(parsed.admin.password, 10);
        parsed.admin.passwordHashed = true;
        this.saveData(parsed);
      }
      return parsed;
    } catch {
      return { settings: {}, admin: {}, categories: [], products: [] };
    }
  }

  saveData(customData = null) {
    const payload = customData || this.data;
    fs.writeFileSync(this.filePath, JSON.stringify(payload, null, 2), "utf8");
  }

  getSettings() {
    return this.data.settings || {};
  }

  getStoreSettings() {
    return this.getSettings();
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    return this.getSettings();
  }

  updateStoreSettings(newSettings) {
    return this.updateSettings(newSettings);
  }

  getAdmin() {
    return this.data.admin || null;
  }

  getCategories() {
    const counts = {};
    for (const p of this.data.products || []) {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    }
    return (this.data.categories || []).map((c) => ({
      ...c,
      productCount: counts[c.id] || 0,
      createdAt: c.createdAt || new Date().toISOString(),
    }));
  }

  getCategoryById(id) {
    return (this.data.categories || []).find((c) => c.id === id) || null;
  }

  addCategory(name) {
    const id = `cat-${Date.now()}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const newCat = { id, name, slug, createdAt: new Date().toISOString() };
    this.data.categories.push(newCat);
    this.saveData();
    return { ...newCat, productCount: 0 };
  }

  updateCategory(id, name) {
    const cat = this.getCategoryById(id);
    if (!cat) return null;
    cat.name = name;
    cat.slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    this.saveData();
    return cat;
  }

  deleteCategory(id) {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    if (this.data.categories.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  getProducts(filters = {}) {
    const catMap = {};
    for (const c of this.data.categories || []) {
      catMap[c.id] = c.name;
    }

    let list = (this.data.products || []).map((p) => {
      const stockStatus =
        typeof p.stockStatus === "number"
          ? p.stockStatus > 0
            ? "Tersedia"
            : "Habis"
          : p.stockStatus || "Tersedia";
      return {
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        categoryName: catMap[p.categoryId] || p.categoryName || "Umum",
        price: Number(p.price) || 0,
        stockStatus,
        description: p.description || "",
        image:
          p.image ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
      };
    });

    if (filters.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId);
    }

    if (filters.stockStatus) {
      list = list.filter((p) => p.stockStatus === filters.stockStatus);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  getProductById(id) {
    const list = this.getProducts();
    return list.find((p) => p.id === id) || null;
  }

  addProduct(productData) {
    const id = `prod-${Date.now()}`;
    const newProd = {
      id,
      name: productData.name,
      categoryId: productData.categoryId,
      price: Number(productData.price) || 0,
      stockStatus: productData.stockStatus || "Tersedia",
      description: productData.description || "",
      image:
        productData.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.products.push(newProd);
    this.saveData();
    return this.getProductById(id);
  }

  updateProduct(id, productData) {
    const prod = (this.data.products || []).find((p) => p.id === id);
    if (!prod) return null;

    if (productData.name !== undefined) prod.name = productData.name;
    if (productData.categoryId !== undefined) prod.categoryId = productData.categoryId;
    if (productData.price !== undefined) prod.price = Number(productData.price);
    if (productData.stockStatus !== undefined) prod.stockStatus = productData.stockStatus;
    if (productData.description !== undefined) prod.description = productData.description;
    if (productData.image !== undefined) prod.image = productData.image;
    prod.updatedAt = new Date().toISOString();

    this.saveData();
    return this.getProductById(id);
  }

  toggleStock(id) {
    const prod = (this.data.products || []).find((p) => p.id === id);
    if (!prod) return null;

    const currentStatus =
      typeof prod.stockStatus === "number"
        ? prod.stockStatus > 0
          ? "Tersedia"
          : "Habis"
        : prod.stockStatus || "Tersedia";

    prod.stockStatus = currentStatus === "Tersedia" ? "Habis" : "Tersedia";
    prod.updatedAt = new Date().toISOString();
    this.saveData();
    return this.getProductById(id);
  }

  deleteProduct(id) {
    const initialLen = (this.data.products || []).length;
    this.data.products = (this.data.products || []).filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }
}

// Export database instance
export const db = DatabaseSync ? new SqliteDatabase() : new JsonDatabase();

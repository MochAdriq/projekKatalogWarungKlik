const API_BASE = "/api";

export const getAuthToken = () => {
  return localStorage.getItem("warungklik_token") || "";
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("warungklik_token", token);
  } else {
    localStorage.removeItem("warungklik_token");
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem("warungklik_token");
};

// Initial/fallback data strictly extracted from Boss's Figma design
const FIGMA_DEFAULT_CATEGORIES = [
  { _id: "cat-1", id: "cat-1", name: "Bowls" },
  { _id: "cat-2", id: "cat-2", name: "Salads" },
  { _id: "cat-3", id: "cat-3", name: "Warm plates" },
  { _id: "cat-4", id: "cat-4", name: "Breakfast" },
  { _id: "cat-5", id: "cat-5", name: "Cold pressed" },
];

const FIGMA_DEFAULT_PRODUCTS = [
  {
    _id: "prod-1",
    id: "prod-1",
    name: "Harvest bowl",
    categoryId: "cat-1",
    categoryName: "Bowls",
    price: 25000,
    description: "Fluffy quinoa, creamy avocado & roasted sweet potato, finished with our lemon-tahini dressing.",
    imageUrl: "/images/food/food-1.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-2",
    id: "prod-2",
    name: "Daily greens salad",
    categoryId: "cat-2",
    categoryName: "Salads",
    price: 22000,
    description: "Farm-fresh mixed greens, toasted pumpkin seeds, crisp cucumber, and cold-pressed olive vinaigrette.",
    imageUrl: "/images/food/food-2.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-3",
    id: "prod-3",
    name: "Green goddess grain bowl",
    categoryId: "cat-1",
    categoryName: "Bowls",
    price: 28000,
    description: "Steamed edamame, broccoli florets, ribboned zucchini, wild rice, and green herb drizzle.",
    imageUrl: "/images/food/food-3.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-4",
    id: "prod-4",
    name: "Roasted root plate",
    categoryId: "cat-3",
    categoryName: "Warm plates",
    price: 30000,
    description: "Spiced chickpeas, roasted baby carrots, charred greens, and warm sourdough slice.",
    imageUrl: "/images/food/food-4.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-5",
    id: "prod-5",
    name: "Sunrise acai bowl",
    categoryId: "cat-4",
    categoryName: "Breakfast",
    price: 24000,
    description: "Organic acai blend, fresh wild berries, crunchy artisan granola, and toasted coconut flakes.",
    imageUrl: "/images/food/food-5.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-6",
    id: "prod-6",
    name: "Pure green detox juice",
    categoryId: "cat-5",
    categoryName: "Cold pressed",
    price: 18000,
    description: "Green apple, kale, celery, fresh ginger root, and Persian lime.",
    imageUrl: "/images/food/food-6.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-7",
    id: "prod-7",
    name: "Avocado sourdough toast",
    categoryId: "cat-4",
    categoryName: "Breakfast",
    price: 20000,
    description: "Smashed avocado, heirloom cherry tomatoes, sea salt flakes on toasted country loaf.",
    imageUrl: "/images/food/food-7.jpg",
    stockStatus: "available",
  },
  {
    _id: "prod-8",
    id: "prod-8",
    name: "Wild mushroom grain skillet",
    categoryId: "cat-3",
    categoryName: "Warm plates",
    price: 29000,
    description: "Pan-roasted oyster mushrooms, garlic herbed farro, and crispy shallots.",
    imageUrl: "/images/food/food-8.jpg",
    stockStatus: "available",
  },
];

// Fetch all products
export const fetchProducts = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE}/products${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengambil data produk");
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json;
    }
    return { success: true, data: FIGMA_DEFAULT_PRODUCTS };
  } catch (error) {
    return { success: true, data: FIGMA_DEFAULT_PRODUCTS };
  }
};

// Fetch categories
export const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Gagal mengambil data kategori");
    const json = await res.json();
    if (json.data && json.data.length > 0) {
      return json;
    }
    return { success: true, data: FIGMA_DEFAULT_CATEGORIES };
  } catch (error) {
    return { success: true, data: FIGMA_DEFAULT_CATEGORIES };
  }
};

// Fetch store settings
export const fetchStoreSetting = async () => {
  try {
    const res = await fetch(`${API_BASE}/stores`);
    if (!res.ok) throw new Error("Gagal mengambil pengaturan toko");
    const json = await res.json();
    if (json.data && json.data.storeName) {
      return json;
    }
    return {
      success: true,
      data: {
        storeName: "Daily greens",
        tagline: "Freshly made. Thoughtfully sourced. To your door.",
        address: "Sudirman Central, Jakarta",
        phone: "6281234567890",
      },
    };
  } catch (error) {
    return {
      success: true,
      data: {
        storeName: "Daily greens",
        tagline: "Freshly made. Thoughtfully sourced. To your door.",
        address: "Sudirman Central, Jakarta",
        phone: "0895338977816",
      },
    };
  }
};

// Auth (Supports both Customer and Admin)
export const loginAdmin = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Koneksi ke sistem belum aktif. Pastikan server sudah berjalan." };
  }
};

export const registerUser = async (payload) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: "Gagal mendaftarkan akun. Pastikan server berjalan." };
  }
};

export const updateUserProfile = async (payload) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const fetchAdminProfile = async () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Unauthorized");
    return await res.json();
  } catch {
    return null;
  }
};

// Favorites API
export const fetchFavorites = async () => {
  const token = getAuthToken();
  if (!token) return { success: true, data: [] };
  try {
    const res = await fetch(`${API_BASE}/auth/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { success: true, data: [] };
    return await res.json();
  } catch {
    return { success: true, data: [] };
  }
};

export const toggleFavoriteProduct = async (productId) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/favorites/${productId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

// Orders API
export const createOrder = async (orderPayload) => {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/auth/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(orderPayload),
  });
  return await res.json();
};

export const fetchMyOrders = async () => {
  const token = getAuthToken();
  if (!token) return { success: true, data: [] };
  try {
    const res = await fetch(`${API_BASE}/auth/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { success: true, data: [] };
    return await res.json();
  } catch {
    return { success: true, data: [] };
  }
};

export const fetchAllOrders = async () => {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/auth/orders/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return await res.json();
};

// Admin Users Management API
export const fetchAllUsers = async () => {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const deleteUserAccount = async (userId) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

// CRUD Products with File Upload (FormData) Support
export const createProduct = async (productData) => {
  const token = getAuthToken();
  const isFormData = productData instanceof FormData;
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers,
    body: isFormData ? productData : JSON.stringify(productData),
  });
  return await res.json();
};

export const updateProduct = async (id, productData) => {
  const token = getAuthToken();
  const isFormData = productData instanceof FormData;
  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers,
    body: isFormData ? productData : JSON.stringify(productData),
  });
  return await res.json();
};

export const deleteProduct = async (id) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
};

export const toggleProductStock = async (id) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
};

// Delete Category
export const deleteCategory = async (id) => {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
};

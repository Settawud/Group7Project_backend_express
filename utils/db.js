// Simple in-memory store for demo/evaluation
import { randomId, skuId } from "./id.js";

const store = {
  products: [], // { skuId, name, description, price, category, stock, images }
  users: [], // { id, email, passwordHash, name }
  carts: new Map(), // userId -> { items: [{ skuId, quantity }] }
  orders: [], // { id, userId, items, total, createdAt }
};


const fallbackProducts = [
  {
    skuId: "EGC-001",
    name: "Ergo Chair",
    description: "Ergonomic office chair with lumbar support",
    price: 4990,
    category: "เก้าอี้",
    stock: 10,
    images: ["/images/ergo-chair.jpg"],
  },
  {
    skuId: "DSK-100",
    name: "Standing Desk",
    description: "Adjustable height standing desk",
    price: 13900,
    category: "โต๊ะ",
    stock: 5,
    images: ["/images/standing-desk.jpg"],
  },
];

export const initDB = () => {
  if (store.products.length) return store;
  store.products = fallbackProducts;
  return store;
};

// Product repository helpers
export const listProducts = ({ q, category } = {}) => {
  const term = (q || "").trim().toLowerCase();
  const cat = (category || "").trim().toLowerCase();
  return store.products.filter((p) => {
    const matchesQ = term
      ? [p.name, p.description, p.skuId].some((v) =>
          String(v || "").toLowerCase().includes(term)
        )
      : true;
    const matchesCat = cat ? String(p.category || "").toLowerCase() === cat : true;
    return matchesQ && matchesCat;
  });
};

export const getProduct = (sku) => store.products.find((p) => p.skuId === sku);

export const createProduct = (data) => {
  const prod = {
    skuId: data.skuId || skuId(data.name || "SKU"),
    name: data.name,
    description: data.description || "",
    price: Number(data.price) || 0,
    category: data.category || "",
    stock: Number(data.stock ?? 0),
    images: data.images || [],
  };
  store.products.push(prod);
  return prod;
};

export const updateProduct = (sku, patch) => {
  const idx = store.products.findIndex((p) => p.skuId === sku);
  if (idx === -1) return null;
  const prev = store.products[idx];
  store.products[idx] = { ...prev, ...patch, skuId: prev.skuId };
  return store.products[idx];
};

export const deleteProduct = (sku) => {
  const idx = store.products.findIndex((p) => p.skuId === sku);
  if (idx === -1) return false;
  store.products.splice(idx, 1);
  return true;
};

// Users
export const createUser = ({ email, passwordHash, name }) => {
  const user = { id: randomId("usr"), email, passwordHash, name };
  store.users.push(user);
  return user;
};

export const getUserByEmail = (email) =>
  store.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

// Cart
export const getCart = (userId) => {
  if (!store.carts.has(userId)) store.carts.set(userId, { items: [] });
  return store.carts.get(userId);
};

export const addCartItem = (userId, { skuId, quantity }) => {
  const cart = getCart(userId);
  const idx = cart.items.findIndex((i) => i.skuId === skuId);
  if (idx === -1) cart.items.push({ skuId, quantity });
  else cart.items[idx].quantity += quantity;
  return cart;
};

export const updateCartItem = (userId, skuId, quantity) => {
  const cart = getCart(userId);
  const idx = cart.items.findIndex((i) => i.skuId === skuId);
  if (idx === -1) return null;
  cart.items[idx].quantity = quantity;
  return cart;
};

export const removeCartItem = (userId, skuId) => {
  const cart = getCart(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.skuId !== skuId);
  return before !== cart.items.length;
};

// Orders
export const listOrders = (userId) => store.orders.filter((o) => o.userId === userId);

export const createOrderFromCart = (userId) => {
  const cart = getCart(userId);
  if (!cart.items.length) return null;
  const detailed = cart.items
    .map((ci) => {
      const p = getProduct(ci.skuId);
      if (!p) return null;
      return { skuId: p.skuId, name: p.name, price: p.price, quantity: ci.quantity };
    })
    .filter(Boolean);
  if (!detailed.length) return null;
  const total = detailed.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const order = {
    id: randomId("ord"),
    userId,
    items: detailed,
    total,
    createdAt: new Date().toISOString(),
  };
  store.orders.push(order);
  // Clear cart after order
  store.carts.set(userId, { items: [] });
  return order;
};

export const getOrder = (userId, orderId) =>
  store.orders.find((o) => o.userId === userId && o.id === orderId);

export default store;

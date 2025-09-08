// In-memory store (demo)
import { randomId } from "./id.js";

const store = {
  colors: [], // { id, name_th, name_en, hex }
  products: [], // { id, name, description, category, trial, tags, material, images, dimension, variants[] }
  users: [], // { id, email, passwordHash, name }
  carts: new Map(), // userId -> { items: [{ productId, variantId, quantity, trial }] }
  orders: [], // { id, userId, items, total, createdAt }
};

const seedOnce = () => {
  if (store.products.length || store.colors.length) return;
  // Seed colors
  const black = { id: randomId("col"), name_th: "สีดำ", name_en: "Black", hex: "#000000" };
  const white = { id: randomId("col"), name_th: "สีขาว", name_en: "White", hex: "#FFFFFF" };
  store.colors.push(black, white);
  // Seed a sample product with variants
  const prodId = randomId("prd");
  store.products.push({
    id: prodId,
    name: "Ergonomic Chair",
    description: "Ergonomic office chair with lumbar support",
    category: "chair",
    trial: false,
    tags: ["office", "ergonomic"],
    material: "Mesh",
    images: ["/images/ergo-chair.jpg"],
    dimension: { width: 60, height: 120, depth: 60, weight: 15 },
    variants: [
      {
        id: randomId("var"),
        trial: false,
        colorId: black.id,
        price: 4990,
        quantityInStock: 20,
        images: ["/images/chair-black.jpg"],
      },
      {
        id: randomId("var"),
        trial: true,
        colorId: white.id,
        price: 5090,
        quantityInStock: 10,
        images: ["/images/chair-white.jpg"],
      },
    ],
  });
};

export const initDB = () => {
  seedOnce();
  return store;
};

// Colors
export const listColors = () => store.colors;
export const getColor = (id) => store.colors.find((c) => c.id === id);
export const createColor = (data) => {
  const color = {
    id: randomId("col"),
    name_th: data.name_th,
    name_en: data.name_en,
    hex: data.hex?.startsWith("#") ? data.hex : `#${data.hex}`,
  };
  store.colors.push(color);
  return color;
};
export const updateColor = (id, patch) => {
  const idx = store.colors.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  store.colors[idx] = { ...store.colors[idx], ...patch };
  return store.colors[idx];
};
export const deleteColor = (id) => {
  const before = store.colors.length;
  store.colors = store.colors.filter((c) => c.id !== id);
  return before !== store.colors.length;
};

// Products
export const listProducts = ({ q, category } = {}) => {
  const term = (q || "").trim().toLowerCase();
  const cat = (category || "").trim().toLowerCase();
  return store.products.filter((p) => {
    const matchesQ = term
      ? [p.name, p.description, ...(p.tags || [])].some((v) =>
          String(v || "").toLowerCase().includes(term)
        )
      : true;
    const matchesCat = cat ? String(p.category || "").toLowerCase() === cat : true;
    return matchesQ && matchesCat;
  });
};

export const getProduct = (productId) => store.products.find((p) => p.id === productId);
export const getVariant = (productId, variantId) => {
  const p = getProduct(productId);
  if (!p) return null;
  return p.variants.find((v) => v.id === variantId) || null;
};

export const createProduct = (data) => {
  const prod = {
    id: randomId("prd"),
    name: data.name,
    description: data.description || "",
    category: data.category || "",
    trial: !!data.trial,
    tags: data.tags || [],
    material: data.material || "",
    images: data.images || [],
    dimension: {
      width: Number(data.dimension?.width || 0),
      height: Number(data.dimension?.height || 0),
      depth: Number(data.dimension?.depth || 0),
      weight: Number(data.dimension?.weight || 0),
    },
    variants: (data.variants || []).map((v) => ({
      id: randomId("var"),
      trial: !!v.trial,
      colorId: v.colorId,
      price: Number(v.price) || 0,
      quantityInStock: Number(v.quantityInStock || 0),
      images: v.images || [],
    })),
  };
  store.products.push(prod);
  return prod;
};

export const updateProduct = (productId, patch) => {
  const idx = store.products.findIndex((p) => p.id === productId);
  if (idx === -1) return null;
  const prev = store.products[idx];
  store.products[idx] = { ...prev, ...patch, id: prev.id };
  return store.products[idx];
};

export const deleteProduct = (productId) => {
  const before = store.products.length;
  store.products = store.products.filter((p) => p.id !== productId);
  return before !== store.products.length;
};

// Users (in-memory demo)
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

export const addCartItem = (userId, { productId, variantId, quantity, trial = false }) => {
  const cart = getCart(userId);
  const p = getProduct(productId);
  const v = getVariant(productId, variantId);
  if (!p || !v) return null;
  const idx = cart.items.findIndex((i) => i.productId === productId && i.variantId === variantId);
  if (idx === -1) cart.items.push({ productId, variantId, quantity, trial: !!trial });
  else cart.items[idx].quantity += quantity;
  return cart;
};

export const updateCartItem = (userId, productId, variantId, quantity) => {
  const cart = getCart(userId);
  const idx = cart.items.findIndex((i) => i.productId === productId && i.variantId === variantId);
  if (idx === -1) return null;
  cart.items[idx].quantity = quantity;
  return cart;
};

export const removeCartItem = (userId, productId, variantId) => {
  const cart = getCart(userId);
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => !(i.productId === productId && i.variantId === variantId));
  return before !== cart.items.length;
};

// Orders
export const listOrders = (userId) => store.orders.filter((o) => o.userId === userId);

export const createOrderFromCart = (userId) => {
  const cart = getCart(userId);
  if (!cart.items.length) return null;
  const detailed = cart.items
    .map((ci) => {
      const p = getProduct(ci.productId);
      const v = getVariant(ci.productId, ci.variantId);
      if (!p || !v) return null;
      const color = getColor(v.colorId);
      return {
        productId: p.id,
        productName: p.name,
        discountIsCreated: false,
        variant: {
          variantId: v.id,
          quantity: ci.quantity,
          price: v.price,
          trial: !!v.trial,
          variantOption: color ? color.name_en : String(v.colorId),
          image: (v.images && v.images[0]) || (p.images && p.images[0]) || "",
        },
      };
    })
    .filter(Boolean);
  if (!detailed.length) return null;
  const subtotal = detailed.reduce((sum, i) => sum + i.variant.price * i.variant.quantity, 0);
  const discount = 0;
  const installationFee = 0;
  const total = subtotal - discount + installationFee;
  const order = {
    id: randomId("ord"),
    userId,
    items: detailed,
    subtotalAmount: subtotal,
    discountAmount: discount,
    installationFee,
    totalAmount: total,
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

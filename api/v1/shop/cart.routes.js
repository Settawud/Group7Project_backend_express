import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { getCart, addCartItem, updateCartItem, removeCartItem, initDB, getProduct, getVariant } from "../../../utils/db.js";

const router = express.Router();

initDB();

// All routes require auth
router.use(jwtBearer);

// GET /api/v1/cart
router.get("/", (req, res) => {
  const cart = getCart(req.user.id);
  res.json({ success: true, cart });
});

// POST /api/v1/cart/items { productId, variantId, quantity }
router.post("/items", (req, res) => {
  const { productId, variantId, quantity } = req.body || {};
  if (!productId || !variantId || !Number(quantity)) {
    return res.status(400).json({ error: true, message: "productId, variantId and quantity required" });
  }
  const prod = getProduct(productId);
  const variant = getVariant(productId, variantId);
  if (!prod || !variant) return res.status(404).json({ error: true, message: "Product/Variant not found" });
  const cart = addCartItem(req.user.id, { productId, variantId, quantity: Number(quantity) });
  res.status(201).json({ success: true, cart });
});

// PATCH /api/v1/cart/items/:productId/:variantId { quantity }
router.patch("/items/:productId/:variantId", (req, res) => {
  const qty = Number(req.body?.quantity);
  if (!qty) return res.status(400).json({ error: true, message: "quantity required" });
  const updated = updateCartItem(req.user.id, req.params.productId, req.params.variantId, qty);
  if (!updated) return res.status(404).json({ error: true, message: "Item not found" });
  res.json({ success: true, cart: updated });
});

// DELETE /api/v1/cart/items/:productId/:variantId
router.delete("/items/:productId/:variantId", (req, res) => {
  const ok = removeCartItem(req.user.id, req.params.productId, req.params.variantId);
  if (!ok) return res.status(404).json({ error: true, message: "Item not found" });
  const cart = getCart(req.user.id);
  res.json({ success: true, cart });
});

export default router;

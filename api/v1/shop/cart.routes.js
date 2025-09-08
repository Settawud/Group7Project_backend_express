import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { getCart, addCartItem, updateCartItem, removeCartItem, initDB, getProduct } from "../../../utils/db.js";

const router = express.Router();

initDB();

// All routes require auth
router.use(jwtBearer);

// GET /api/v1/cart
router.get("/", (req, res) => {
  const cart = getCart(req.user.id);
  res.json({ success: true, cart });
});

// POST /api/v1/cart/items { skuId, quantity }
router.post("/items", (req, res) => {
  const { skuId, quantity } = req.body || {};
  if (!skuId || !Number(quantity)) {
    return res.status(400).json({ error: true, message: "skuId and quantity required" });
  }
  const prod = getProduct(skuId);
  if (!prod) return res.status(404).json({ error: true, message: "Product not found" });
  const cart = addCartItem(req.user.id, { skuId, quantity: Number(quantity) });
  res.status(201).json({ success: true, cart });
});

// PATCH /api/v1/cart/items/:skuId { quantity }
router.patch("/items/:skuId", (req, res) => {
  const qty = Number(req.body?.quantity);
  if (!qty) return res.status(400).json({ error: true, message: "quantity required" });
  const updated = updateCartItem(req.user.id, req.params.skuId, qty);
  if (!updated) return res.status(404).json({ error: true, message: "Item not found" });
  res.json({ success: true, cart: updated });
});

// DELETE /api/v1/cart/items/:skuId
router.delete("/items/:skuId", (req, res) => {
  const ok = removeCartItem(req.user.id, req.params.skuId);
  if (!ok) return res.status(404).json({ error: true, message: "Item not found" });
  const cart = getCart(req.user.id);
  res.json({ success: true, cart });
});

export default router;


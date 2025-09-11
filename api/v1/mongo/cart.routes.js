import express from "express";
import mongoose from "mongoose";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { Cart } from "../../../models/Cart.js";
import { Product } from "../../../models/Product.js";

const router = express.Router();

// All routes require auth
router.use(jwtBearer);

// GET /api/v1/mongo/cart

router.get("/", async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    res.status(200).json({ success: true, cart });
  } catch (err) { next(err); }
});

// POST /api/v1/mongo/cart/items { productId, variantId, quantity }
router.post("/items", async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = req.body
    const qty = Number(quantity);
    if (!productId || !variantId || !qty) {
      return res.status(400).json({ error: true, message: "productId, variantId, quantity required" });
    }
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });

    const cart = await getOrCreateCart(uid);
    const idx = cart.items.findIndex((i) => String(i.productId) === String(productId) && String(i.variantId) === String(variantId));
    if (idx === -1) cart.items.push({ productId, variantId, quantity: qty, trial: !!variant.trial });
    else cart.items[idx].quantity += qty;
    await cart.save();
    res.status(201).json({ success: true, cart });
  } catch (err) { next(err); }
});

// PATCH /api/v1/mongo/cart/items/:productId/:variantId { quantity }
router.patch("/items/:productId/:variantId", async (req, res, next) => {
  try {
    const qty = Number(req.body?.quantity);
    if (!qty) return res.status(400).json({ error: true, message: "quantity required" });
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const cart = await getOrCreateCart(uid);
    const idx = cart.items.findIndex((i) => String(i.productId) === String(req.params.productId) && String(i.variantId) === String(req.params.variantId));
    if (idx === -1) return res.status(404).json({ error: true, message: "Item not found" });
    cart.items[idx].quantity = qty;
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
});

// DELETE /api/v1/mongo/cart/items/:productId/:variantId
router.delete("/items/:productId/:variantId", async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const cart = await getOrCreateCart(uid);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => !(String(i.productId) === String(req.params.productId) && String(i.variantId) === String(req.params.variantId)));
    if (before === cart.items.length) return res.status(404).json({ error: true, message: "Item not found" });
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
});

export default router;


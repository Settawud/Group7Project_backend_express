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
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });

    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [],
      });
    }

    const idx = cart.items.findIndex((i) =>
      String(i.productId) === String(productId) && String(i.variantId) === String(variantId)
    );

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
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      return res.status(404).json({ error: true, message: "Cart not found" });
    }

    const idx = cart.items.findIndex((i) =>
      String(i.productId) === String(req.params.productId) &&
      String(i.variantId) === String(req.params.variantId)
    );

    if (idx === -1) return res.status(404).json({ error: true, message: "Item not found" });
    cart.items[idx].quantity = qty;
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
});

// DELETE /api/v1/mongo/cart/items/:productId/:variantId
router.delete("/items/:productId/:variantId", async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
      if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found for this user." });
    }
    const initialLength = cart.items.length;
    const { productId, variantId } = req.params;

    // Filter out the item that matches both productId and variantId
    cart.items = cart.items.filter(
      (item) => !(String(item.productId) === String(productId) && String(item.variantId) === String(variantId))
    );

    // Check if an item was actually removed
    if (cart.items.length === initialLength) {
      return res.status(404).json({ success: false, message: "Item not found in cart." });
    }
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) { next(err); }
});

export default router;


import express from "express";
import mongoose from "mongoose";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { Order } from "../../../models/Order.js";
import { Cart } from "../../../models/Cart.js";
import { Product } from "../../../models/Product.js";
import { Color } from "../../../models/Color.js";

const router = express.Router();

router.use(jwtBearer);

const buildOrderFromCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.items.length) return null;

  const items = [];
  for (const ci of cart.items) {
    const p = await Product.findById(ci.productId);
    if (!p) continue;
    const v = p.variants.id(ci.variantId);
    if (!v) continue;
    let colorName = String(v.colorId);
    try {
      const col = await Color.findById(v.colorId);
      if (col) colorName = col.name_en;
    } catch {}
    items.push({
      productId: p._id,
      productName: p.name,
      discountIsCreated: false,
      variant: {
        variantId: v._id,
        quantity: ci.quantity,
        price: v.price,
        trial: !!v.trial,
        variantOption: colorName,
        image: v.images?.[0] || p.images?.[0] || "",
      },
    });
  }
  if (!items.length) return null;

  const subtotal = items.reduce((sum, it) => sum + it.variant.price * it.variant.quantity, 0);
  const discount = 0;
  const installationFee = 0;
  const total = subtotal - discount + installationFee;
  const orderNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

  return {
    userId,
    orderNumber,
    orderStatus: "Pending",
    subtotalAmount: subtotal,
    discountAmount: discount,
    installationFee,
    items,
    shipping: {
      address: "",
      trackingNumber: "",
      deliveryStatus: "Pending",
      shippedAt: null,
      deliveredAt: null,
    },
  };
};

// GET /api/v1/mongo/orders
router.get("/", async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const list = await Order.find({ userId: uid }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, items: list });
  } catch (err) { next(err); }
});

// POST /api/v1/mongo/orders -> create from cart
router.post("/", async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const payload = await buildOrderFromCart(uid);
    if (!payload) return res.status(400).json({ error: true, message: "Cart empty or invalid" });
    const created = await Order.create(payload);
    // Clear cart
    await Cart.updateOne({ userId: uid }, { $set: { items: [] } }, { upsert: true });
    res.status(201).json({ success: true, item: created });
  } catch (err) { next(err); }
});

// GET /api/v1/mongo/orders/:orderId
router.get("/:orderId", async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const order = await Order.findOne({ _id: req.params.orderId, userId: uid }).lean();
    if (!order) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true, item: order });
  } catch (err) { next(err); }
});

export default router;


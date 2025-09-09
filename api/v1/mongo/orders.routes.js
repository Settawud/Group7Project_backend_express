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
    shipping: {},
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
    // Optional shipping override from body
    const ship = req.body?.shipping || {};
    if (ship && typeof ship === 'object') {
      payload.shipping = {
        ...payload.shipping,
        address: ship.address ?? payload.shipping.address,
        trackingNumber: ship.trackingNumber ?? payload.shipping.trackingNumber,
        deliveryStatus: ship.deliveryStatus ?? payload.shipping.deliveryStatus,
      };
    }
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

// PATCH /api/v1/mongo/orders/:orderId/shipping
router.patch("/:orderId/shipping", async (req, res, next) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const { address, trackingNumber, deliveryStatus } = req.body || {};

    const order = await Order.findOne({ _id: req.params.orderId, userId: uid });
    if (!order) return res.status(404).json({ error: true, message: "Not found" });

    const allowed = ["Pending", "Shipped", "Delivered"];
    if (deliveryStatus && !allowed.includes(deliveryStatus)) {
      return res.status(400).json({ error: true, message: "Invalid deliveryStatus" });
    }

    if (typeof address === "string") order.shipping.address = address;
    if (typeof trackingNumber === "string") order.shipping.trackingNumber = trackingNumber;

    if (deliveryStatus) {
      const prev = order.shipping.deliveryStatus;
      order.shipping.deliveryStatus = deliveryStatus;
      // keep orderStatus in sync
      order.orderStatus = deliveryStatus;
      const now = new Date();
      if (deliveryStatus === "Shipped" && !order.shipping.shippedAt) {
        order.shipping.shippedAt = now;
      }
      if (deliveryStatus === "Delivered") {
        if (!order.shipping.shippedAt) order.shipping.shippedAt = now;
        order.shipping.deliveredAt = now;
      }
    }

    await order.save();
    res.json({ success: true, item: order });
  } catch (err) { next(err); }
});

export default router;

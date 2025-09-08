import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { createOrderFromCart, listOrders, getOrder, initDB } from "../../../utils/db.js";

const router = express.Router();

initDB();

router.use(jwtBearer);

// GET /api/v1/orders
router.get("/", (req, res) => {
  const orders = listOrders(req.user.id);
  res.json({ success: true, items: orders });
});

// POST /api/v1/orders -> create from cart
router.post("/", (req, res) => {
  const order = createOrderFromCart(req.user.id);
  if (!order) return res.status(400).json({ error: true, message: "Cart empty or invalid" });
  res.status(201).json({ success: true, item: order });
});

// GET /api/v1/orders/:orderId
router.get("/:orderId", (req, res) => {
  const order = getOrder(req.user.id, req.params.orderId);
  if (!order) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true, item: order });
});

export default router;


import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import {
  initDB,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../../utils/db.js";

const router = express.Router();

initDB();

// GET /api/v1/products?q=...&category=...
router.get("/", (req, res) => {
  const { q, category } = req.query || {};
  const items = listProducts({ q, category });
  res.json({ success: true, count: items.length, items });
});

// GET /api/v1/products/:skuId
router.get("/:skuId", (req, res) => {
  const prod = getProduct(req.params.skuId);
  if (!prod) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true, item: prod });
});

// POST /api/v1/products (auth required)
router.post("/", jwtBearer, (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: true, message: "name required" });
  const created = createProduct(body);
  res.status(201).json({ success: true, item: created });
});

// PATCH /api/v1/products/:skuId
router.patch("/:skuId", jwtBearer, (req, res) => {
  const updated = updateProduct(req.params.skuId, req.body || {});
  if (!updated) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true, item: updated });
});

// DELETE /api/v1/products/:skuId
router.delete("/:skuId", jwtBearer, (req, res) => {
  const ok = deleteProduct(req.params.skuId);
  if (!ok) return res.status(404).json({ error: true, message: "Not found" });
  res.json({ success: true });
});

export default router;


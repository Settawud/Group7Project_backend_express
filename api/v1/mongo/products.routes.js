import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { Product } from "../../../models/Product.js";

const router = express.Router();

// GET /api/v1/mongo/products?q=...&category=...
router.get("/", async (req, res, next) => {
  try {
    const { q, category } = req.query || {};
    const filter = {};
    if (category) filter.category = category;
    const term = (q || "").trim();
    const query = term
      ? {
          $and: [
            filter,
            {
              $or: [
                { name: { $regex: term, $options: "i" } },
                { description: { $regex: term, $options: "i" } },
                { tags: { $in: [new RegExp(term, "i")] } },
              ],
            },
          ],
        }
      : filter;
    const items = await Product.find(query).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) { next(err); }
});

// GET /api/v1/mongo/products/:productId
router.get("/:productId", async (req, res, next) => {
  try {
    const item = await Product.findById(req.params.productId).lean();
    if (!item) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true, item });
  } catch (err) { next(err); }
});

// POST /api/v1/mongo/products (auth required)
router.post("/", jwtBearer, async (req, res, next) => {
  try {
    const created = await Product.create(req.body || {});
    res.status(201).json({ success: true, item: created });
  } catch (err) { next(err); }
});

// PATCH /api/v1/mongo/products/:productId
router.patch("/:productId", jwtBearer, async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.productId,
      { $set: req.body || {} },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true, item: updated });
  } catch (err) { next(err); }
});

// DELETE /api/v1/mongo/products/:productId
router.delete("/:productId", jwtBearer, async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.productId);
    if (!deleted) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;


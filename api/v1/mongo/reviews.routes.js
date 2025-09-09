import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import { Product } from "../../../models/Product.js";
import { reviews as Review } from "../../../models/Reviews.js";

const router = express.Router();

// GET /api/v1/mongo/reviews/product/:productId
router.get("/product/:productId", async (req, res, next) => {
  try {
    const items = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) { next(err); }
});

// GET /api/v1/mongo/reviews/me (requires auth)
router.get("/me", jwtBearer, async (req, res, next) => {
  try {
    const items = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) { next(err); }
});

// POST /api/v1/mongo/reviews (requires auth)
router.post("/", jwtBearer, async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body || {};
    if (!productId || !Number(rating)) {
      return res.status(400).json({ error: true, message: "productId and rating required" });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    try {
      const created = await Review.create({
        productId,
        userId: req.user.id,
        rating: Number(rating),
        comment: comment || "",
      });
      res.status(201).json({ success: true, item: created });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ error: true, message: "You already reviewed this product" });
      }
      throw e;
    }
  } catch (err) { next(err); }
});

export default router;

// DELETE /api/v1/mongo/reviews/:reviewId (owner or admin)
router.delete("/:reviewId", jwtBearer, async (req, res, next) => {
  try {
    const me = req.user;
    const rev = await Review.findById(req.params.reviewId);
    if (!rev) return res.status(404).json({ error: true, message: "Not found" });
    const isOwner = String(rev.userId) === String(me.id);
    const isAdmin = me?.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: true, message: "Forbidden" });
    await Review.deleteOne({ _id: rev._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

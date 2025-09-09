import express from "express";
import jwtBearer from "../../../middleware/jwtBearer.js";
import requireRole from "../../../middleware/requireRole.js";
import { Product } from "../../../models/Product.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../../config/cloudinary.js";

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
router.post("/", jwtBearer, requireRole("admin"), async (req, res, next) => {
  try {
    const created = await Product.create(req.body || {});
    res.status(201).json({ success: true, item: created });
  } catch (err) { next(err); }
});

// PATCH /api/v1/mongo/products/:productId
router.patch("/:productId", jwtBearer, requireRole("admin"), async (req, res, next) => {
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
router.delete("/:productId", jwtBearer, requireRole("admin"), async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.productId);
    if (!deleted) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;

// === Upload product images (admin only) ===
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "products",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      // public_id: `product_${Date.now()}` // let Cloudinary assign by default
    };
  },
});
const upload = multer({ storage });

// POST /api/v1/mongo/products/:productId/images
router.post(
  "/:productId/images",
  jwtBearer,
  requireRole("admin"),
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ error: true, message: "Product not found" });

      const variantId = req.body?.variantId;
      const urls = (req.files || []).map((f) => ({
        url: f?.path || f?.secure_url || "",
        publicId: f?.filename || f?.public_id || "",
        mimetype: f?.mimetype || "",
        size: f?.size || null,
      })).filter((x) => x.url);

      if (!urls.length) {
        return res.status(400).json({ error: true, message: "No images uploaded" });
      }

      if (variantId) {
        const v = product.variants.id(variantId);
        if (!v) return res.status(404).json({ error: true, message: "Variant not found" });
        v.images = [...(v.images || []), ...urls.map((u) => u.url)];
      } else {
        product.images = [...(product.images || []), ...urls.map((u) => u.url)];
      }

      await product.save();
      return res.status(201).json({ success: true, urls: urls.map((u) => u.url), product });
    } catch (err) {
      next(err);
    }
  }
);

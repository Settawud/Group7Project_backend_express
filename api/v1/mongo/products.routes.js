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

// === Upload product images (admin only) ===
function requireCloudinaryConfigured(req, res, next) {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env || {};
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(503).json({
      error: true,
      message: "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and restart the server.",
    });
  }
  next();
}

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "products",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  }),
});
// ก่อนประกาศ upload = multer(...)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = /image\/(jpe?g|png|webp)/i.test(file.mimetype || "");
    const extOk  = /\.(jpe?g|png|webp)$/i.test(file.originalname || "");
    const ok = mimeOk || extOk;
    if (!ok) {
      console.warn('Reject upload:', { mimetype: file.mimetype, name: file.originalname });
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
});

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024, files: 10 },
//   fileFilter: (_req, file, cb) => {
//     const ok = /image\/(jpe?g|png|webp)/.test(file.mimetype || "");
//     cb(ok ? null : new Error("Invalid file type"), ok);
//   },
// });

// POST /api/v1/mongo/products/:productId/images
router.post(
  "/:productId/images",
  jwtBearer,
  requireRole("admin"),
  requireCloudinaryConfigured,
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ error: true, message: "Product not found" });

      const variantId = String(req.body?.variantId || "");
      const files = Array.isArray(req.files) ? req.files : [];
      const uploaded = files
        .map((f) => ({
          url: f?.path || f?.secure_url || "",
          publicId: f?.filename || f?.public_id || "",
          mimetype: f?.mimetype || "",
          size: typeof f?.size === "number" ? f.size : undefined,
        }))
        .filter((x) => x.url && x.publicId);

      if (!uploaded.length) {
        return res.status(400).json({ error: true, message: "No images uploaded" });
      }

      const uniqByPublicId = (arr) =>
        Array.from(new Map(arr.map((it) => [it.publicId, it])).values());

      if (variantId) {
        const v = product.variants.id(variantId);
        if (!v) return res.status(404).json({ error: true, message: "Variant not found" });
        const existing = Array.isArray(v.images) ? v.images : [];
        const asObjects = existing.map((it) =>
          typeof it === "string" ? { url: it, publicId: it } : it
        );
        v.images = uniqByPublicId([...asObjects, ...uploaded]);
      } else {
        const existing = Array.isArray(product.images) ? product.images : [];
        const asObjects = existing.map((it) =>
          typeof it === "string" ? { url: it, publicId: it } : it
        );
        product.images = uniqByPublicId([...asObjects, ...uploaded]);
      }

      await product.save();
      return res.status(201).json({
        success: true,
        images: uploaded.map((u) => ({ url: u.url, publicId: u.publicId })),
        product,
      });
    } catch (err) {
      if (err?.message === "Invalid file type") {
        return res.status(400).json({ error: true, message: "Only JPG/PNG/WebP images are allowed" });
      }
      next(err);
    }
  }
);

export default router;

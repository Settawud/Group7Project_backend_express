import { Product } from "../../../../models/Product.js";
import cloudinary from "../../../../config/cloudinary.js";

// Helpers
const normalizeImages = (arr) => (Array.isArray(arr) ? arr : []);
const toImageObject = (it) => (typeof it === "string" ? { url: it, publicId: it } : { url: it?.url, publicId: it?.publicId });
const uniqByPublicId = (arr) => Array.from(new Map(arr.map((it) => [it.publicId, { url: it.url, publicId: it.publicId }])).values());
const pickOneUploaded = (fileOrFiles) => {
  const f = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
  if (!f) return null;
  const url = f?.path || f?.secure_url || "";
  const publicId = f?.filename || f?.public_id || "";
  if (!url || !publicId) return null;
  return { url, publicId };
};

// Products
export async function listProducts(req, res, next) {
   try {
    const {
      search = "",
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);

    if (!isNaN(min) || !isNaN(max)) {
      filter.variants = {
        $elemMatch: {}
      };
      if (!isNaN(min)) filter.variants.$elemMatch.price = { $gte: min };
      if (!isNaN(max)) {
        if (!filter.variants.$elemMatch.price) filter.variants.$elemMatch.price = {};
        filter.variants.$elemMatch.price.$lte = max;
      }
    }

    const term = search.trim();
    let query = {};
    if (term) {
      query = {
        $or: [
          { name: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
          { tags: { $in: [new RegExp(term, "i")] } },
        ],
      };
    }

    const finalQuery = term ? { $and: [filter, query] } : filter;

    let sortOption = {};
    if (sort) {
      const [field, direction] = sort.split(":");
      if (field) {
        sortOption[field] = direction === "desc" ? -1 : 1;
      }
    }

    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(finalQuery).sort(sortOption).skip(skip).limit(limit).lean(),
      Product.countDocuments(finalQuery),
    ]);

    res.json({
      success: true,
      count: items.length,
      total,
      page: parseInt(page),
      items,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const item = await Product.findById(req.params.productId).lean();
    if (!item) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const created = await Product.create(req.body || {});
    res.status(201).json({ success: true, item: created });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.productId,
      { $set: req.body || {} },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true, item: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.productId);
    if (!deleted) return res.status(404).json({ error: true, message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Upload images (product or variant)
export async function uploadProductImages(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });

    const uploaded = pickOneUploaded(req.file || (Array.isArray(req.files) ? req.files[0] : null));

    if (!uploaded) {
      return res.status(400).json({ error: true, message: "No images uploaded" });
    }

    // Explicitly disallow using this endpoint for variant upload
    if (req.body && req.body.variantId) {
      return res.status(400).json({ error: true, message: "Use /products/:productId/variants/:variantId/images for variant uploads" });
    }

    const existing = normalizeImages(product.thumbnails).map(toImageObject).filter((x) => x.url && x.publicId);
    product.thumbnails = uniqByPublicId([...existing, uploaded]);

    await product.save();
    return res.status(201).json({
      success: true,
      images: [uploaded],
      product,
    });
  } catch (err) {
    if (err?.message === "Invalid file type") {
      return res.status(400).json({ error: true, message: "Only JPG/PNG/WebP images are allowed" });
    }
    next(err);
  }
}

// Variants
export async function listVariants(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    res.json({ success: true, count: (product.variants || []).length, items: product.variants || [] });
  } catch (err) { next(err); }
}

export async function getVariant(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId).lean();
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = (product.variants || []).find((v) => String(v._id) === String(req.params.variantId));
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });
    res.json({ success: true, item: variant });
  } catch (err) { next(err); }
}

export async function createVariant(req, res, next) {
  try {
    const { colorId, price, quantityInStock, trial = false, image = null } = req.body || {};
    if (!colorId || !Number.isFinite(Number(price)) || !Number.isFinite(Number(quantityInStock))) {
      return res.status(400).json({ error: true, message: "colorId, price, quantityInStock required" });
    }
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const img = image ? toImageObject(image) : null;
    const one = img && img.url && img.publicId ? img : undefined;
    product.variants.push({ colorId, price: Number(price), quantityInStock: Number(quantityInStock), trial: !!trial, ...(one ? { image: one } : {}) });
    await product.save();
    const created = product.variants[product.variants.length - 1];
    res.status(201).json({ success: true, item: created, productId: product._id });
  } catch (err) { next(err); }
}

export async function updateVariant(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });
    const payload = req.body || {};
    if (payload.colorId !== undefined) variant.colorId = payload.colorId;
    if (payload.price !== undefined) variant.price = Number(payload.price);
    if (payload.quantityInStock !== undefined) variant.quantityInStock = Number(payload.quantityInStock);
    if (payload.trial !== undefined) variant.trial = !!payload.trial;
    if (payload.image !== undefined) {
      if (payload.image === null) {
        variant.image = undefined;
      } else {
        const obj = toImageObject(payload.image);
        variant.image = obj && obj.url && obj.publicId ? obj : undefined;
      }
    }
    await product.save();
    res.json({ success: true, item: variant });
  } catch (err) { next(err); }
}

export async function deleteVariant(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });
    variant.deleteOne();
    await product.save();
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function uploadVariantImages(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });

    const uploaded = pickOneUploaded(req.file || (Array.isArray(req.files) ? req.files[0] : null));
    if (!uploaded) {
      return res.status(400).json({ error: true, message: "No images uploaded" });
    }

    // POST should not overwrite: conflict if image already exists
    if (variant.image && variant.image.url && variant.image.publicId) {
      return res.status(409).json({ error: true, message: "Variant already has an image. Use PUT to replace it." });
    }
    variant.image = uploaded;
    await product.save();
    return res.status(201).json({
      success: true,
      images: [uploaded],
      productId: product._id,
      variantId: variant._id,
    });
  } catch (err) {
    if (err?.message === "Invalid file type") {
      return res.status(400).json({ error: true, message: "Only JPG/PNG/WebP images are allowed" });
    }
    next(err);
  }
}

// PUT replace variant image (always set to uploaded image)
export async function replaceVariantImage(req, res, next) {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(req.params.variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });

    const uploaded = pickOneUploaded(req.file || (Array.isArray(req.files) ? req.files[0] : null));
    if (!uploaded) {
      return res.status(400).json({ error: true, message: "No images uploaded" });
    }

    variant.image = uploaded;
    await product.save();
    return res.status(200).json({
      success: true,
      images: [uploaded],
      productId: product._id,
      variantId: variant._id,
    });
  } catch (err) {
    if (err?.message === "Invalid file type") {
      return res.status(400).json({ error: true, message: "Only JPG/PNG/WebP images are allowed" });
    }
    next(err);
  }
}

// Delete a single product-level image by publicId
export async function deleteProductImage(req, res, next) {
  try {
    const { productId } = req.params;
    const rawParam = req.params?.publicId;
    const fromQuery = req.query?.publicId;
    const publicId = (Array.isArray(rawParam) ? rawParam.join("/") : rawParam) || String(fromQuery || "");
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });

    const existing = normalizeImages(product.thumbnails).map(toImageObject);
    const before = existing.length;
    const keep = existing.filter((img) => img.publicId !== publicId);
    if (keep.length === before) {
      return res.status(404).json({ error: true, message: "Image not found" });
    }

    // Try to delete from Cloudinary; ignore errors to allow metadata cleanup
    try { await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); } catch {}

    product.thumbnails = keep;
    await product.save();
    return res.json({ success: true });
  } catch (err) { next(err); }
}

// Delete a single variant image by publicId
export async function deleteVariantImage(req, res, next) {
  try {
    const { productId, variantId } = req.params;
    const rawParam = req.params?.publicId;
    const fromQuery = req.query?.publicId;
    const publicId = (Array.isArray(rawParam) ? rawParam.join("/") : rawParam) || String(fromQuery || "");
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: true, message: "Product not found" });
    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ error: true, message: "Variant not found" });

    const existing = variant.image && variant.image.publicId ? [variant.image] : [];
    if (!existing.length || existing[0].publicId !== publicId) {
      return res.status(404).json({ error: true, message: "Image not found" });
    }

    try { await cloudinary.uploader.destroy(publicId, { resource_type: "image" }); } catch {}

    variant.image = undefined;
    await product.save();
    return res.json({ success: true });
  } catch (err) { next(err); }
}

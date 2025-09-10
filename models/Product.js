import mongoose, { Schema, model } from "mongoose";

const { ObjectId } = Schema.Types;

/** อนุญาต legacy ได้ทั้งสตริง URL หรืออ็อบเจ็กต์รูปแบบใหม่ */
const imageEntrySchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: null },
    mimetype: { type: String, default: null },
    size: { type: Number, default: null }, // bytes
    width: { type: Number, default: null },
    height: { type: Number, default: null },
  },
  { _id: false }
);

/** ตัวตรวจสอบสำหรับอาเรย์รูปภาพ: element เป็น string หรือเป็นอ็อบเจ็กต์ตาม schema */
const imageArray = {
  type: [Schema.Types.Mixed],
  default: [],
  validate: {
    validator: (arr) =>
      Array.isArray(arr) &&
      arr.every(
        (it) =>
          typeof it === "string" ||
          (it &&
            typeof it === "object" &&
            typeof it.url === "string" &&
            it.url.trim().length > 0)
      ),
    message: "Each image must be a string URL or an object with at least { url }",
  },
};

// ---------- Variant ----------
export const variantSchema = new Schema(
  {
    // _id: auto ให้โดยปริยาย ไม่ต้องระบุ
    trial: { type: Boolean, default: false },
    colorId: { type: ObjectId, ref: "Color", required: true },
    price: { type: Number, required: true, min: 0 },
    quantityInStock: { type: Number, required: true, min: 0 },
    images: imageArray, // ยืดหยุ่นและรองรับหลายรูป
  },
  { timestamps: true }
);

// ---------- Product ----------
export const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true }, // ถ้ามีหมวดจำกัด ให้ใช้ enum
    tags: { type: [String], default: [] },

    // rating อยู่ระดับ product (1–5) ถ้าไม่มีให้เป็น null
    rating: {
      type: Number,
      default: null,
      min: [1, "rating must be >= 1"],
      max: [5, "rating must be <= 5"],
    },

    material: { type: String, required: true, trim: true },

    // main images (สม่ำเสมอ: ใช้ชื่อ images ไม่ใช้ Thumbnails)
    images: imageArray,

    // เก็บภาพขนาดย่อ/เลือกโชว์ = optional (ถ้าอยากแยก)
    thumbnails: imageArray,

    dimension: {
      width: { type: Number, required: true, min: 0 },
      height: { type: Number, required: true, min: 0 },
      depth: { type: Number, required: true, min: 0 },
      weight: { type: Number, required: true, min: 0 },
    },

    variants: { type: [variantSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  },
  { timestamps: true }
);

// --------- Indexes แนะนำ ---------
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1 });
productSchema.index({ "variants.colorId": 1 });
productSchema.index({ "variants._id": 1 }); // ช่วยหา variant รายตัว

export const Product = model("Product", productSchema);

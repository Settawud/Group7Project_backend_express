import { Schema, model } from "mongoose";

// Variant references Color by id (separate collection)
export const variantSchema = new Schema({
  trial: { type: Boolean, default: false },
  colorId: { type: Schema.Types.ObjectId, ref: "Color", required: true },
  price: { type: Number, required: true },
  quantityInStock: { type: Number, required: true },
  // Allow both legacy string URLs and new object entries { url, publicId, mimetype, size }
  images: { type: Schema.Types.Mixed, required: true  },
});

// Main Product schema
export const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  rating: { type: Number, default: null, min: 1, max: 5 },
  material: { type: String, required: true },
  // Allow both legacy string URLs and new object entries { url, publicId, mimetype, size }
  images: { type: [Schema.Types.Mixed], default: [] },
  dimension: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number, required: true },
    weight: { type: Number, required: true },
  },
  variants: { type: [variantSchema], required: true },
},
  { timestamps: true });

export const Product = model("Product", productSchema);

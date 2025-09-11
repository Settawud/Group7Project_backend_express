import { Schema, model } from "mongoose";

// Variant references Color by id (separate collection)
export const variantSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    trial: { type: Boolean, default: false },
    colorId: { type: Schema.Types.ObjectId, ref: "Color", required: true },
    price: { type: Number, required: true },
    quantityInStock: { type: Number, required: true },
    // Allow legacy entries but we will only store { url, publicId }
    images: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

// Main Product schema
export const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    trial: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    material: { type: String, required: true },
    // Store only objects with url/publicId
    thumbnails: {
      type: [
        new Schema(
          {
            url: { type: String, required: true, trim: true },
            publicId: { type: String, required: true, trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    dimension: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      depth: { type: Number, required: true },
      weight: { type: Number, required: true },
    },
    variants: { type: [variantSchema], required: true },
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);

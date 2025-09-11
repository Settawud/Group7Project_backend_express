import { Schema, model } from "mongoose";

// Variant references Color by id (separate collection)
export const variantSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    trial: { type: Boolean, default: false },
    colorId: { type: Schema.Types.ObjectId, ref: "Color", required: true },
    price: { type: Number, required: true },
    quantityInStock: { type: Number, required: true },
    // Single image per variant: { url, publicId }
    image: new Schema(
      {
        url: { type: String, trim: true },
        publicId: { type: String, trim: true },
      },
      { _id: false }
    ),
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

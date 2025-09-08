import { Schema, model } from "mongoose";

// First, define the ColorSchema
const colorSchema = new Schema({
    color: { type: String, required: true },
    colorCode: { type: String, required: true }
});

// Next, define the Variant schema
export const variantSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    trial: { type: Boolean, default: false },
    variantOption: { type: colorSchema, required: true },
    price: { type: Number, required: true },
    quantityInStock: { type: Number, required: true },
    image: { type: [String], default: [] }
});

// Now, define the Dimension schema
const dimensionSchema = new Schema({
    width: { type: String, required: true },
    height: { type: String, required: true },
    depth: { type: String, required: true },
    weight: { type: String, required: true }
});

// Finally, define the main Product schema
export const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    trial: { type: Boolean, default: false },
    tag: { type: [String], default: [] },
    material: { type: String, required: true },
    image: { type: [String], default: [] },
    dimension: { type: dimensionSchema, required: true },
    variants: {
        type: [variantSchema],
        required: true
    }
});


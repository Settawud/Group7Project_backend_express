import { Schema, model } from "mongoose";

const userDiscountSchema = new Schema(
  {
    user_id: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, required: false },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    maxDiscount: { type: Number, required: false },
    minOrderAmount: { type: Number, required: false },
    usageLimit: { type: Number, required: true, default: 1 },
    usedCount: { type: Number, required: true, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { timestamps: true }
);

export const userDiscounts = model("userDiscounts", userDiscountSchema);
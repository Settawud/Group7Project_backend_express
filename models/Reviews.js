import { Schema, model } from "mongoose";

const reviewsSchema = new Schema({
  productId: { type: String, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: false },
},
   { timestamps: true }
);

export const reviews = model("reviews", reviewsSchema);
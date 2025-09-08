import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new Schema({
  fullName: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  createdOn: { type: Date, default: new Date().getTime() },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export const User = model("User", UserSchema);

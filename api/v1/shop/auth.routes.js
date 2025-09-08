import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, getUserByEmail, initDB } from "../../../utils/db.js";
import { env } from "../../../config/env.js";

const router = express.Router();

initDB();

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: true, message: "email and password required" });
  }
  const exists = getUserByEmail(email);
  if (exists) return res.status(409).json({ error: true, message: "Email already registered" });
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = createUser({ email, passwordHash, name: name || email.split("@")[0] });
  return res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = getUserByEmail(email || "");
  if (!user) return res.status(401).json({ error: true, message: "Invalid credentials" });
  const ok = await bcrypt.compare(String(password || ""), user.passwordHash);
  if (!ok) return res.status(401).json({ error: true, message: "Invalid credentials" });
  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  const user = getUserByEmail(email || "");
  // Mock: always respond success without revealing user existence
  return res.json({ success: true, message: "If account exists, email was sent." });
});

export default router;


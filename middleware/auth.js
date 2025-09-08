import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: true, message: "No token" });

    //const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = {}; // <-- แทนด้วย verify จริง
    const { uid, sv } = decoded;
    const user = await User.findById(uid);
    if (!user) return res.status(401).json({ error: true, message: "Invalid token " });

    if (typeof sv === "number" && sv !== user.sessionsVersion){
      return res.status(401).json({ error: true, message: "Session revoked" });
    }

    req.userId = uid;
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: "Unauthorized" });
  }
};
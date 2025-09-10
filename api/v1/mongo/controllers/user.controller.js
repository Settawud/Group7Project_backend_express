import { User } from "../../../../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

//POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, password, image } = req.body || {};
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: true, message: "Email already used "});

        // Admin signup via secret (optional, controlled by env)
        const requestedRole = String(req.body?.role || "user").toLowerCase();
        let finalRole = "user";
        if (requestedRole === "admin") {
            const provided = String(req.body?.adminSecret || "");
            const configured = process.env.ADMIN_SIGNUP_SECRET || "";
            if (!configured) {
                return res.status(403).json({ error: true, code: "ADMIN_SIGNUP_DISABLED", message: "Admin signup is disabled" });
            }
            if (provided !== configured) {
                return res.status(403).json({ error: true, code: "ADMIN_SIGNUP_SECRET_INVALID", message: "Invalid admin signup secret" });
            }
            finalRole = "admin";
        }

        const user = await User.create({ firstName, lastName, email, phone, password, image, role: finalRole });
        return res.status(201).json({ error: false, user }); //password ถูกตัดออกด้วย toJSON แล้ว
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
    // ต้อง .select('+password') เพราะใน schema ตั้ง select:false  (401 Unauthenticated ยังไม่ได้ login หรือ login ไม่ผ่าน)
        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(401).json({ error: true, message: "Invalid credentials" });

        const ok =  await user.comparePassword(password);
        if (!ok) return res.status(401).json({ error: true, message: "Invalid credentials" });

        // ออก JWT ให้ตรงกับ jwtBearer (ใช้ key userId)
        const token = jwt.sign(
          {
            userId: user._id.toString(),
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            role: user.role || "user",
            sv: user.sessionsVersion,
          },
          process.env.JWT_SECRET || "dev_secret",
          { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );
        // Issue refresh token (longer TTL)
        const refreshToken = jwt.sign(
          { userId: user._id.toString(), sv: user.sessionsVersion },
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_secret",
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
        );

        // ส่งกลับทั้งใน cookie (httpOnly) และใน response body
        try {
          res.cookie?.("accessToken", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // set true บน HTTPS ใน prod
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
          res.cookie?.("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
        } catch { /* noop if cookie not available in test env */ }

        const safe = user.toObject();
        delete safe.password;

        return res.json({ error: false, token, refreshToken, user: safe });
    } catch (err) {
        next(err);
    }
};

// GET /api/users/me
export const me = async (req, res, next) => {
    try {
        // ใช้ req.user.id ที่เติมโดย jwtBearer
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ error: true, message: "Not found" });
        return res.json({ error: false, user });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/users/me (แก้ไขโปรไฟล์ทั่วไป)
export const updateMe = async (req, res, next) => {
    try {
        const { firstName, lastName, phone, image, addresses } = req.body || {};
        const user = await User.findByIdAndUpdate(
            req.user?.id,
            { $set: { firstName, lastName, phone, image, addresses } },
            { new: true, runValidators: true }
            );
        return res.json({ error: false, user });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/users/me/password (เปลี่ยนรหัสผ่าน)
export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user?.id).select("+password");
        if (!user) return res.status(404).json({ error: true, message: "Not found"});
        const ok = await user.comparePassword(oldPassword);
        if (!ok) return res.status(400).json({ error: true, message: "Old password incorrect" });

        // ใช้ instance + save → pre("save") จะ hash ให้อัตโนมัติ
        user.password = newPassword;
        // bump sessionsVersion เพื่อให้ token เก่าหมดอายุ
        user.sessionsVersion += 1;
        await user.save();

        return res.json({ error: false, message: "Password updated" });
    } catch (err) {
        next(err);
    }

};

// POST /api/v1/mongo/auth/logout (clear cookie; client should discard token)
export const logout = async (req, res, _next) => {
  try {
    if (typeof res.clearCookie === "function") {
      res.clearCookie("accessToken", { httpOnly: true, sameSite: "lax", secure: false });
      res.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax", secure: false });
    }
  } catch {}
  return res.json({ error: false, message: "Logged out" });
};

// POST /api/v1/mongo/auth/logout-all (revoke all tokens via sessionsVersion)
export const logoutAll = async (req, res, next) => {
  try {
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ error: true, message: "Unauthorized" });
    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ error: true, message: "Not found" });
    user.sessionsVersion += 1;
    await user.save();
    try {
      res.clearCookie?.("accessToken", { httpOnly: true, sameSite: "lax", secure: false });
      res.clearCookie?.("refreshToken", { httpOnly: true, sameSite: "lax", secure: false });
    } catch {}
    return res.json({ error: false, message: "Logged out all sessions" });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/mongo/auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"]; // fallback for non-cookie clients
    if (!token) return res.status(401).json({ error: true, message: "Missing refresh token" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "dev_secret");
    } catch (e) {
      const isExpired = e?.name === "TokenExpiredError";
      return res.status(401).json({ error: true, code: isExpired ? "REFRESH_EXPIRED" : "REFRESH_INVALID", message: isExpired ? "Refresh token expired" : "Invalid refresh token" });
    }

    const user = await User.findById(payload.userId).select("email firstName lastName role sessionsVersion");
    if (!user) return res.status(401).json({ error: true, message: "Unauthorized" });
    if (typeof payload.sv === "number" && user.sessionsVersion !== payload.sv) {
      return res.status(401).json({ error: true, code: "SESSION_REVOKED", message: "Session revoked" });
    }

    const newAccess = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        role: user.role || "user",
        sv: user.sessionsVersion,
      },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
    try {
      res.cookie?.("accessToken", newAccess, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    } catch {}
    return res.json({ error: false, token: newAccess });
  } catch (err) { next(err); }
};

// === Forgot / Reset password ===
function makeToken(len = 32) {
  return crypto.randomBytes(len).toString("hex");
}
function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

// POST /api/v1/mongo/auth/password/forgot { email }
export const passwordForgot = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").toLowerCase();
    const user = await User.findOne({ email });
    // To avoid user enumeration, always respond success, but only set token if user exists
    if (user) {
      const raw = makeToken(16);
      user.resetTokenHash = sha256(raw);
      user.resetTokenExpires = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour
      await user.save();
      // In production: send email with reset link containing `raw` token
      return res.json({ error: false, message: "If that email exists, a reset link was sent.", token: process.env.NODE_ENV === "production" ? undefined : raw });
    }
    return res.json({ error: false, message: "If that email exists, a reset link was sent." });
  } catch (err) { next(err); }
};

// POST /api/v1/mongo/auth/password/reset { email, token, newPassword }
export const passwordReset = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").toLowerCase();
    const raw = String(req.body?.token || "");
    const nextPass = String(req.body?.newPassword || "");
    const user = await User.findOne({ email }).select("+password resetTokenHash resetTokenExpires sessionsVersion");
    if (!user || !user.resetTokenHash || !user.resetTokenExpires) {
      return res.status(400).json({ error: true, message: "Invalid reset request" });
    }
    if (user.resetTokenExpires < new Date()) {
      return res.status(400).json({ error: true, message: "Reset token expired" });
    }
    if (user.resetTokenHash !== sha256(raw)) {
      return res.status(400).json({ error: true, message: "Invalid reset token" });
    }
    // set new password via instance save to trigger pre-save hashing
    user.password = nextPass;
    user.sessionsVersion += 1; // revoke existing tokens
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();
    return res.json({ error: false, message: "Password reset successful" });
  } catch (err) { next(err); }
};

// === Email verification ===
// POST /api/v1/mongo/auth/verify-email/request { email }
export const verifyEmailRequest = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.json({ error: false, message: "If that email exists, a verification email was sent." });
    if (user.emailVerified) {
      return res.json({ error: false, message: "Email already verified" });
    }
    const raw = makeToken(16);
    user.emailVerifyTokenHash = sha256(raw);
    user.emailVerifyTokenExpires = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24h
    await user.save();
    // In production send email; in dev, return token
    return res.json({ error: false, message: "Verification email sent", token: process.env.NODE_ENV === "production" ? undefined : raw });
  } catch (err) { next(err); }
};

// POST /api/v1/mongo/auth/verify-email/confirm { email, token }
export const verifyEmailConfirm = async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").toLowerCase();
    const raw = String(req.body?.token || "");
    const user = await User.findOne({ email });
    if (!user || !user.emailVerifyTokenHash || !user.emailVerifyTokenExpires) {
      return res.status(400).json({ error: true, message: "Invalid verification request" });
    }
    if (user.emailVerifyTokenExpires < new Date()) {
      return res.status(400).json({ error: true, message: "Verification token expired" });
    }
    if (user.emailVerifyTokenHash !== sha256(raw)) {
      return res.status(400).json({ error: true, message: "Invalid verification token" });
    }
    user.emailVerified = true;
    user.emailVerifyTokenHash = null;
    user.emailVerifyTokenExpires = null;
    await user.save();
    return res.json({ error: false, message: "Email verified" });
  } catch (err) { next(err); }
};

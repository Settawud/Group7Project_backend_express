import { User } from "../../../../models/User.js";
import jwt from "jsonwebtoken";

//POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { firstname, lastname, email, phone, password, image } = req.body || {};
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

        const user = await User.create({ firstname, lastname, email, phone, password, image, role: finalRole });
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
            name: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
            role: user.role || "user",
            sv: user.sessionsVersion,
          },
          process.env.JWT_SECRET || "dev_secret",
          { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        // ส่งกลับทั้งใน cookie (httpOnly) และใน response body
        try {
          res.cookie?.("accessToken", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // set true บน HTTPS ใน prod
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
        } catch { /* noop if cookie not available in test env */ }

        const safe = user.toObject();
        delete safe.password;

        return res.json({ error: false, token, user: safe });
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
        const { firstname, lastname, phone, image, addresses } = req.body || {};
        const user = await User.findByIdAndUpdate(
            req.user?.id,
            { $set: { firstname, lastname, phone, image, addresses } },
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
    try { res.clearCookie?.("accessToken", { httpOnly: true, sameSite: "lax", secure: false }); } catch {}
    return res.json({ error: false, message: "Logged out all sessions" });
  } catch (err) {
    next(err);
  }
};

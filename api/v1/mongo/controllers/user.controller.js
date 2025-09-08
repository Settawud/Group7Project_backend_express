import { User, user } from "../../../../models/User";

//POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const { firstname, lastname, email, phone, password, image } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: true, message: "Email already used "});

        const user = await User.create({ firstname, lastname, email, phone, password, image })
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
        if (!password) return res.status(401).json({ error: true, message: "Invalid credentials" });

        //ตัวอย่าง ทำ JWT ใส่ sessionVersion สำหรับ revoke ทีหลัง
        //เก็บลงใน cookie httpOnly หรือส่งใน body ?
        const payload = { uid: user._id.toString(), sv: user.sessionsVersion };
        // const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

        const safe = user.toObject();
        delete safe.password;

        return res.json({ error: false, user: safe, /*, token */ });
    } catch (err) {
        next(err);
    }
};

// GET /api/users/me
export const me = async (req, res, next) => {
    try {
        // สมมติ middleware auth ใส่ req.userId
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: true, message: "Not found" });
        return res.json({ error: false, user });
    } catch (err) {
        next(err);
    }
}

// PATCH /api/users/me (แก้ไขโปรไฟล์ทั่วไป)
export const UpdateMe = async (req, res, next) => {
    try {
        const { fistname, lastname, phone, image, addresses } = req.body;
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: { firstname, lastname, phone, image, addresses} },
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
        const user = await User.findById(req.UserId).select("+password");
        if (!user) return res.status(404).json({ error: true, message: "Not found"});
        const ok = await user.comparePassword(oldPassword);
        if (!ok) return res.status(400).json({ error: true, message: "Old password incorrect" });

        // ใช้ instance + save → pre("save") จะ hash ให้อัตโนมัติ
        user.password = newPassword;
        await user.save();

         // bump sessionsVersion เพื่อให้ token เก่าหมดอายุ
        user.sessionsVersion += 1;
        await user.save();

        return res.json({ error: false, message: "Password updated" });
    } catch (err) {
        next(err);
    }

}

import { User } from "../../../../models/User.js";

export const getAllUsers = async (req, res) => {
  try {
    // exclude passwords in the result
    const users = await User.find().select("-password").sort("-createdAt");
    res.json({ error: false, users });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: "Failed to fetch users",
      details: err.message,
    });
  }
};

export const createUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name) {
    return res.status(400).json({ error: true, message: "Name is required" });
  }

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  try {
    // prevent duplicates
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ error: true, message: "Email already in use" });
    }

    // create & save
    const user = new User({ name, email });
    await user.save();

    return res
      .status(201)
      .json({ error: false, user, message: "User created successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ error: true, message: "Server error", details: err.message });
  }
};

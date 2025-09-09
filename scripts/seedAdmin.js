#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();
import { connectMongo, closeMongo } from "../config/mongo.js";
import { User } from "../models/User.js";

function getArg(flag, def = undefined) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return process.env[flag.replace(/^--/, "").toUpperCase()] || def;
}

async function main() {
  const email = getArg("--email");
  const password = getArg("--password");
  const firstname = getArg("--firstname", "Admin");
  const lastname = getArg("--lastname", "User");
  const phone = getArg("--phone", "");

  if (!email || !password) {
    console.error("Usage: node scripts/seedAdmin.js --email admin@example.com --password <password> [--firstname Admin] [--lastname User]");
    process.exit(1);
  }

  await connectMongo();
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ firstname, lastname, email, phone, password, role: "admin" });
      console.log("✅ Created admin:", email);
    } else {
      user.role = "admin";
      if (password) user.password = password; // pre-save hook will hash if modified
      await user.save();
      console.log("✅ Updated existing user to admin:", email);
    }
  } catch (err) {
    console.error("❌ Seed admin failed:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}

main();


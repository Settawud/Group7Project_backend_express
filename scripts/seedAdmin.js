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
  const providedSecret = getArg("--secret");
  const adminSeedSecret = process.env.ADMIN_SEED_SECRET || null;
  const adminSeedEnabled = String(process.env.ADMIN_SEED_ENABLED || "").toLowerCase() === "true";
  const force = process.argv.includes("--force");
  const reset = process.argv.includes("--reset");

  if (!email || !password) {
    console.error("Usage: node scripts/seedAdmin.js --email <email> --password <pwd> [--firstname Admin] [--lastname User] [--secret <SECRET>] [--force] [--reset]");
    console.error("  Env: ADMIN_SEED_SECRET (optional), ADMIN_SEED_ENABLED=true to allow in production");
    process.exit(1);
  }

  // Safety guards
  if (process.env.NODE_ENV === "production" && !adminSeedEnabled) {
    console.error("❌ Refusing to run in production. Set ADMIN_SEED_ENABLED=true to allow.");
    process.exit(1);
  }
  if (adminSeedSecret && providedSecret !== adminSeedSecret) {
    console.error("❌ Invalid or missing --secret. Set ADMIN_SEED_SECRET env and pass --secret to proceed.");
    process.exit(1);
  }

  await connectMongo();
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0 && !force) {
      console.error("❌ Admin(s) already exist. Use --force to add/update explicitly.");
      process.exit(1);
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ firstname, lastname, email, phone, password, role: "admin" });
      console.log("✅ Created admin:", email);
    } else {
      if (!force) {
        console.error("❌ User exists and --force not provided. Aborting.");
        process.exit(1);
      }
      user.role = "admin";
      if (reset) user.password = password; // only reset password when --reset
      await user.save();
      console.log("✅ Updated existing user to admin:", email, reset ? "(password reset)" : "");
    }
  } catch (err) {
    console.error("❌ Seed admin failed:", err?.message || err);
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}

main();

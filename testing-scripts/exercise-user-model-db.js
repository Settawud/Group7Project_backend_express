// DB-backed checks for models/User.js: unique email, hashing, toJSON, and subdoc validation
// Run: node testing-scripts/exercise-user-model-db.js

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

const log = (ok, title, extra) => {
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] ${title}`);
  if (!ok && extra) console.log(' -', extra);
};

const TEST_DB = process.env.MONGO_DBNAME || 'schema_validation';
const RUN_ID = Math.random().toString(36).slice(2, 8);
const tag = (name) => `schema-test-${name}-${RUN_ID}@example.com`;

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: TEST_DB });
  await User.syncIndexes(); // ensure unique index on email exists

  try {
    // Clean any leftovers for this run id (should be none)
    await User.deleteMany({ email: { $regex: RUN_ID } });

    // 1) Unique email
    const email = tag('unique');
    await User.create({
      firstname: 'Uniq', lastname: 'One', email, password: 'secret123',
    });
    let duplicateErrCode = null;
    try {
      await User.create({
        firstname: 'Uniq', lastname: 'Two', email, password: 'secret123',
      });
    } catch (e) {
      duplicateErrCode = e?.code;
    }
    log(duplicateErrCode === 11000, 'unique email enforced', duplicateErrCode && `mongo code=${duplicateErrCode}`);

    // 2) Hashing on save
    const email2 = tag('hashsave');
    const plain1 = 'plain-password-1';
    const u1 = await User.create({
      firstname: 'Hash', lastname: 'Save', email: email2, password: plain1,
    });
    const got1 = await User.findById(u1._id).select('+password');
    const okSaveHash = !!got1?.password && got1.password !== plain1 && await bcrypt.compare(plain1, got1.password);
    log(okSaveHash, 'password hashed on save');

    // 3) Hashing on findOneAndUpdate
    const email3 = tag('hashfou');
    const u2 = await User.create({
      firstname: 'Hash', lastname: 'Fou', email: email3, password: 'init-pass',
    });
    const newPlain = 'new-secret-xyz';
    await User.findOneAndUpdate({ _id: u2._id }, { password: newPlain }, { new: true, runValidators: true });
    const got2 = await User.findById(u2._id).select('+password');
    const okFouHash = !!got2?.password && got2.password !== newPlain && await bcrypt.compare(newPlain, got2.password);
    log(okFouHash, 'password hashed on findOneAndUpdate');

    // 4) toJSON hides sensitive fields
    const json = got2.toJSON();
    const okHide = !('password' in json) && !('resetTokenHash' in json);
    log(okHide, 'toJSON hides password and resetTokenHash');

    // 5) Subdocument validation on save (should fail)
    let subdocFailed = false;
    try {
      await User.create({
        firstname: 'Addr', lastname: 'Invalid', email: tag('addrbad'), password: 'abcdef',
        addresses: [{ district: '650000000000000000000003' }],
      });
    } catch (e) {
      // Mongoose validation error name === 'ValidationError'
      subdocFailed = e?.name === 'ValidationError';
    }
    log(subdocFailed, 'address subdocument required fields enforced');

  } finally {
    // Cleanup test docs for this run id
    await User.deleteMany({ email: { $regex: RUN_ID } });
    await mongoose.connection.close();
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});


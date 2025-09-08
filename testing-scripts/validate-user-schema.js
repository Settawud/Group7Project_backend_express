// Quick schema validation checks for models/User.js without DB writes
// Run: node testing-scripts/validate-user-schema.js

import util from 'node:util';
import { User } from '../models/User.js';

const inspect = (v) => util.inspect(v, { depth: 4, colors: false });

function runCase(title, buildDoc, expectValid = true) {
  const doc = buildDoc();
  const err = doc.validateSync();
  const errorPaths = err ? Object.keys(err.errors) : [];
  const isValid = !err;
  const pass = expectValid ? isValid : !isValid;
  console.log(`\n[${pass ? 'PASS' : 'FAIL'}] ${title}`);
  if (!pass) {
    console.log(' - Error paths:', errorPaths);
    console.log(' - Message    :', err.message);
  }
}

// 1) Valid user should pass
runCase('valid user passes', () => new User({
  firstname: 'Ada',
  lastname: 'Lovelace',
  email: 'ada@example.com',
  phone: '+66 80-123-4567',
  password: 'secret123',
  addresses: [
    {
      address_id: '650000000000000000000001',
      building_no: '99/1',
      detail: 'Near park',
      subdistrict: '650000000000000000000002',
      district: '650000000000000000000003',
      province: '650000000000000000000004',
      is_default: true,
    },
  ],
}));

// 2) Missing required fields
runCase('missing firstname and lastname fails (as expected)', () => new User({
  email: 'user@example.com',
  password: 'abcdef',
}), false);

// 3) Invalid email format
runCase('invalid email format fails (as expected)', () => new User({
  firstname: 'Test',
  lastname: 'User',
  email: 'not-an-email',
  password: 'abcdef',
}), false);

// 4) Invalid phone format (too short / wrong chars)
runCase('invalid phone format fails (as expected)', () => new User({
  firstname: 'Test',
  lastname: 'User',
  email: 'user2@example.com',
  phone: 'abc',
  password: 'abcdef',
}), false);

// 5) Password too short
runCase('password too short fails (as expected)', () => new User({
  firstname: 'Short',
  lastname: 'Pass',
  email: 'short@example.com',
  password: '123',
}), false);

// 6) Address missing required subfields
runCase('address missing required subfields fails (as expected)', () => new User({
  firstname: 'Addr',
  lastname: 'Check',
  email: 'addr@example.com',
  password: 'abcdef',
  addresses: [
    {
      // address_id missing
      // subdistrict missing
      district: '650000000000000000000003',
      province: '650000000000000000000004',
    },
  ],
}), false);

// 7) toJSON transform should hide sensitive fields
(() => {
  const doc = new User({
    firstname: 'Json',
    lastname: 'Hide',
    email: 'json@example.com',
    password: 'abcdef',
    resetTokenHash: 'should-hide',
  });
  const json = doc.toJSON();
  const hidden = ['password' in json, 'resetTokenHash' in json];
  const ok = hidden[0] === false && hidden[1] === false;
  console.log(`\n[${ok ? 'PASS' : 'FAIL'}] toJSON hides password + resetTokenHash`);
  if (!ok) {
    console.log(' - Output JSON:', inspect(json));
  }
})();

console.log('\nNote: Unique email cannot be verified without a database.');

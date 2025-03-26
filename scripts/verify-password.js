const { createHash } = require('crypto');

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Test password hashing
const password = "password7";
const hash = hashPassword(password);

console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log(`Expected hash for paul.klinteby: 5860836e8f13fc9837539a597d4086bfc0299e54ad92148d54538b5c3feefb7c`);
console.log(`Hash matches expected: ${hash === '5860836e8f13fc9837539a597d4086bfc0299e54ad92148d54538b5c3feefb7c'}`);
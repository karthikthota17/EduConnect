const crypto = require('crypto');

const generateCode = (length = 6) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
};

module.exports = generateCode;

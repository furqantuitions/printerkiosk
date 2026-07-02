function generateRandom6Digit() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = generateRandom6Digit;

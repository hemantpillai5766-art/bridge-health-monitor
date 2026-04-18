const { ethers } = require('ethers');

function shortenAddress(addr) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatEther(wei) {
  try {
    return ethers.formatEther(wei);
  } catch {
    return '0';
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(delay * (i + 1));
    }
  }
}

function isValidAddress(addr) {
  try {
    ethers.getAddress(addr);
    return true;
  } catch {
    return false;
  }
}

function normalizeAddress(addr) {
  try {
    return ethers.getAddress(addr).toLowerCase();
  } catch {
    return addr.toLowerCase();
  }
}

module.exports = {
  shortenAddress,
  formatEther,
  sleep,
  retry,
  isValidAddress,
  normalizeAddress,
};

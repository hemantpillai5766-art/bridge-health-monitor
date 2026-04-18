const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', 'config', 'default.json');

function loadConfig(customPath) {
  const base = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf-8'));

  if (customPath && fs.existsSync(customPath)) {
    const custom = JSON.parse(fs.readFileSync(customPath, 'utf-8'));
    return deepMerge(base, custom);
  }

  // Override with env vars
  if (process.env.RPC_URL) base.rpc.ethereum = process.env.RPC_URL;
  if (process.env.WEBHOOK_URL) base.alerts.webhook = process.env.WEBHOOK_URL;
  if (process.env.POLL_INTERVAL) base.monitor.pollInterval = parseInt(process.env.POLL_INTERVAL);

  return base;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function getRpcUrl(chain, config) {
  const url = config.rpc[chain] || config.rpc.ethereum;
  if (!url) throw new Error(`No RPC configured for chain: ${chain}`);
  return url;
}

module.exports = { loadConfig, getRpcUrl };

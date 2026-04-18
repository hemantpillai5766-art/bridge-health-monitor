/**
 * Example: Monitor a bridge contract for changes
 *
 * Usage:
 *   RPC_URL=https://eth.llamarpc.com node examples/monitor-bridge.js 0xBridgeAddr
 */

const { MonitorService } = require('../src/monitor');

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error('Usage: node examples/monitor-bridge.js <bridge-address>');
    process.exit(1);
  }

  const rpc = process.env.RPC_URL || 'https://eth.llamarpc.com';
  const monitor = new MonitorService(rpc, {
    interval: 30000, // 30 seconds
    webhook: process.env.WEBHOOK_URL || null,
  });

  await monitor.start(address);
}

main().catch(console.error);

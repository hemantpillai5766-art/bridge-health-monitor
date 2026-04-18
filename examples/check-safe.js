/**
 * Example: Check a Gnosis Safe multisig
 *
 * Usage:
 *   RPC_URL=https://eth.llamarpc.com node examples/check-safe.js 0xYourSafe
 */

const { MultisigChecker } = require('../src/multisig');

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error('Usage: node examples/check-safe.js <safe-address>');
    process.exit(1);
  }

  const rpc = process.env.RPC_URL || 'https://eth.llamarpc.com';
  const checker = new MultisigChecker(rpc);

  console.log(`Checking ${address}...\n`);
  const result = await checker.check(address, { lookbackDays: 90 });

  // Formatted output
  console.log(result.format());

  // JSON output
  // console.log(JSON.stringify(result.toJSON(), null, 2));
}

main().catch(console.error);

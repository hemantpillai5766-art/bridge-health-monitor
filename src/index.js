#!/usr/bin/env node

const { Command } = require('commander');
const { MonitorService } = require('./monitor');
const { MultisigChecker } = require('./multisig');
const { TVLTracker } = require('./tvl');
const chalk = require('chalk');

const program = new Command();

program
  .name('bhm')
  .description('Bridge Health Monitor — track validator activity, multisig signers, and TVL')
  .version('0.2.1');

program
  .command('check <address>')
  .description('Check multisig signer status and activity')
  .option('-r, --rpc <url>', 'RPC endpoint', process.env.RPC_URL)
  .option('-t, --threshold', 'Show signing threshold')
  .option('--days <n>', 'Activity lookback in days', '30')
  .action(async (address, opts) => {
    try {
      const checker = new MultisigChecker(opts.rpc);
      const result = await checker.check(address, {
        showThreshold: opts.threshold,
        lookbackDays: parseInt(opts.days)
      });
      console.log(chalk.green('\n✓ Multisig Check Complete\n'));
      console.log(result.format());
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('monitor <address>')
  .description('Continuously monitor bridge contract for changes')
  .option('-r, --rpc <url>', 'RPC endpoint', process.env.RPC_URL)
  .option('-i, --interval <seconds>', 'Poll interval', '60')
  .option('--webhook <url>', 'Alert webhook URL')
  .action(async (address, opts) => {
    const monitor = new MonitorService(opts.rpc, {
      interval: parseInt(opts.interval) * 1000,
      webhook: opts.webhook
    });
    console.log(chalk.blue(`\n🔍 Monitoring ${address} every ${opts.interval}s\n`));
    await monitor.start(address);
  });

program
  .command('tvl <address>')
  .description('Track TVL and token balances')
  .option('-r, --rpc <url>', 'RPC endpoint', process.env.RPC_URL)
  .option('--tokens <addresses>', 'Comma-separated token addresses')
  .action(async (address, opts) => {
    try {
      const tracker = new TVLTracker(opts.rpc);
      const tokens = opts.tokens ? opts.tokens.split(',') : [];
      const result = await tracker.snapshot(address, tokens);
      console.log(chalk.green('\n✓ TVL Snapshot\n'));
      console.log(result.format());
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();

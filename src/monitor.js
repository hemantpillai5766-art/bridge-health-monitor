const { ethers } = require('ethers');
const chalk = require('chalk');

class MonitorService {
  constructor(rpcUrl, opts = {}) {
    if (!rpcUrl) throw new Error('RPC URL required.');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.interval = opts.interval || 60000;
    this.webhook = opts.webhook || null;
    this.previousState = null;
  }

  async start(address) {
    console.log(chalk.blue(`Monitoring ${address}...`));
    console.log(chalk.gray(`Interval: ${this.interval / 1000}s`));
    console.log(chalk.gray(`Webhook: ${this.webhook || 'none'}\n`));

    // Initial snapshot
    this.previousState = await this._snapshot(address);
    this._printState(this.previousState);

    // Poll loop
    setInterval(async () => {
      try {
        const current = await this._snapshot(address);
        const changes = this._diff(this.previousState, current);

        if (changes.length > 0) {
          console.log(chalk.yellow(`\n⚠️  Changes detected at ${new Date().toISOString()}`));
          for (const change of changes) {
            console.log(chalk.yellow(`  → ${change}`));
          }
          if (this.webhook) {
            await this._alert(changes);
          }
        } else {
          process.stdout.write(chalk.gray('.'));
        }

        this.previousState = current;
      } catch (err) {
        console.error(chalk.red(`\nPoll error: ${err.message}`));
      }
    }, this.interval);
  }

  async _snapshot(address) {
    const code = await this.provider.getCode(address);
    const balance = await this.provider.getBalance(address);
    const block = await this.provider.getBlockNumber();

    let owners = [];
    let threshold = 0;
    let nonce = 0;

    try {
      const safe = new ethers.Contract(address, [
        'function getOwners() view returns (address[])',
        'function getThreshold() view returns (uint256)',
        'function nonce() view returns (uint256)',
      ], this.provider);

      [owners, threshold, nonce] = await Promise.all([
        safe.getOwners(),
        safe.getThreshold(),
        safe.nonce(),
      ]);
    } catch {
      // Not a Gnosis Safe, skip
    }

    return {
      block,
      balance: ethers.formatEther(balance),
      codeHash: ethers.keccak256(code),
      owners: owners.map(o => o.toLowerCase()),
      threshold: Number(threshold),
      nonce: Number(nonce),
      timestamp: new Date().toISOString(),
    };
  }

  _diff(prev, curr) {
    const changes = [];

    if (prev.balance !== curr.balance) {
      changes.push(`Balance: ${prev.balance} → ${curr.balance} ETH`);
    }
    if (prev.codeHash !== curr.codeHash) {
      changes.push(`Contract code changed! Possible upgrade.`);
    }
    if (prev.threshold !== curr.threshold) {
      changes.push(`Threshold: ${prev.threshold} → ${curr.threshold}`);
    }
    if (prev.nonce !== curr.nonce) {
      changes.push(`New TX executed (nonce: ${prev.nonce} → ${curr.nonce})`);
    }
    if (JSON.stringify(prev.owners) !== JSON.stringify(curr.owners)) {
      const added = curr.owners.filter(o => !prev.owners.includes(o));
      const removed = prev.owners.filter(o => !curr.owners.includes(o));
      if (added.length) changes.push(`Signer added: ${added.join(', ')}`);
      if (removed.length) changes.push(`Signer removed: ${removed.join(', ')}`);
    }

    return changes;
  }

  _printState(state) {
    console.log(chalk.bold('Initial State:'));
    console.log(`  Block: ${state.block}`);
    console.log(`  Balance: ${state.balance} ETH`);
    console.log(`  Threshold: ${state.threshold}/${state.owners.length}`);
    console.log(`  Nonce: ${state.nonce}`);
    console.log(`  Signers: ${state.owners.length}`);
    console.log('');
  }

  async _alert(changes) {
    if (!this.webhook) return;
    try {
      await fetch(this.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Bridge Alert\n${changes.join('\n')}`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error(chalk.red(`Webhook failed: ${err.message}`));
    }
  }
}

module.exports = { MonitorService };

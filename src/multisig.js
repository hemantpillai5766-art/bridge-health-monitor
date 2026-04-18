const { ethers } = require('ethers');
const chalk = require('chalk');

const GNOSIS_SAFE_ABI = [
  'function getOwners() view returns (address[])',
  'function getThreshold() view returns (uint256)',
  'function nonce() view returns (uint256)',
];

class MultisigChecker {
  constructor(rpcUrl) {
    if (!rpcUrl) throw new Error('RPC URL required. Use --rpc or set RPC_URL env.');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async check(address, opts = {}) {
    const safe = new ethers.Contract(address, GNOSIS_SAFE_ABI, this.provider);

    const [owners, threshold, nonce] = await Promise.all([
      safe.getOwners(),
      safe.getThreshold(),
      safe.nonce(),
    ]);

    const signerDetails = await Promise.all(
      owners.map(async (owner) => {
        const txCount = await this.provider.getTransactionCount(owner);
        const balance = await this.provider.getBalance(owner);
        const lastBlock = await this._findLastActivity(owner, opts.lookbackDays || 30);
        return {
          address: owner,
          txCount,
          balance: ethers.formatEther(balance),
          lastActivity: lastBlock,
          ens: await this._resolveENS(owner),
        };
      })
    );

    return new CheckResult({
      address,
      threshold: Number(threshold),
      nonce: Number(nonce),
      signers: signerDetails,
      totalSigners: owners.length,
    });
  }

  async _resolveENS(address) {
    try {
      const name = await this.provider.lookupAddress(address);
      return name || null;
    } catch {
      return null;
    }
  }

  async _findLastActivity(address, lookbackDays) {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const blocksPerDay = 7200; // ~12s per block
      const fromBlock = currentBlock - (blocksPerDay * lookbackDays);

      const txCount = await this.provider.getTransactionCount(address);
      if (txCount === 0) return { status: 'never', block: null, daysAgo: null };

      // Rough estimate based on nonce
      const latestNonce = await this.provider.getTransactionCount(address, 'latest');
      const pendingNonce = await this.provider.getTransactionCount(address, 'pending');

      return {
        status: latestNonce > 0 ? 'active' : 'inactive',
        totalTx: latestNonce,
        pendingTx: pendingNonce - latestNonce,
      };
    } catch {
      return { status: 'unknown', block: null };
    }
  }
}

class CheckResult {
  constructor(data) {
    this.data = data;
  }

  format() {
    const { address, threshold, nonce, signers, totalSigners } = this.data;
    let out = '';

    out += chalk.bold(`Contract: ${address}\n`);
    out += `Threshold: ${chalk.yellow(threshold)}/${totalSigners}\n`;
    out += `Nonce: ${nonce}\n\n`;
    out += chalk.bold('Signers:\n');
    out += '─'.repeat(80) + '\n';

    for (const s of signers) {
      const ensTag = s.ens ? chalk.cyan(` (${s.ens})`) : '';
      const statusColor = s.lastActivity.status === 'active' ? chalk.green : chalk.red;

      out += `  ${s.address}${ensTag}\n`;
      out += `    Balance: ${s.balance} ETH | `;
      out += `TX Count: ${s.txCount} | `;
      out += `Status: ${statusColor(s.lastActivity.status)}\n`;
    }

    return out;
  }

  toJSON() {
    return this.data;
  }
}

module.exports = { MultisigChecker };

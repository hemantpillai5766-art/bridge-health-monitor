const { ethers } = require('ethers');
const chalk = require('chalk');

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

class TVLTracker {
  constructor(rpcUrl) {
    if (!rpcUrl) throw new Error('RPC URL required.');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async snapshot(address, tokenAddresses = []) {
    const ethBalance = await this.provider.getBalance(address);

    const tokenBalances = await Promise.all(
      tokenAddresses.map(async (tokenAddr) => {
        try {
          const token = new ethers.Contract(tokenAddr, ERC20_ABI, this.provider);
          const [balance, symbol, decimals] = await Promise.all([
            token.balanceOf(address),
            token.symbol(),
            token.decimals(),
          ]);
          return {
            address: tokenAddr,
            symbol,
            balance: ethers.formatUnits(balance, decimals),
            raw: balance.toString(),
          };
        } catch (err) {
          return {
            address: tokenAddr,
            symbol: 'UNKNOWN',
            balance: '0',
            error: err.message,
          };
        }
      })
    );

    return new TVLResult({
      address,
      ethBalance: ethers.formatEther(ethBalance),
      tokens: tokenBalances,
      timestamp: new Date().toISOString(),
      block: await this.provider.getBlockNumber(),
    });
  }
}

class TVLResult {
  constructor(data) {
    this.data = data;
  }

  format() {
    const { address, ethBalance, tokens, timestamp, block } = this.data;
    let out = '';

    out += chalk.bold(`Contract: ${address}\n`);
    out += `Block: ${block} | ${timestamp}\n\n`;
    out += `  ETH: ${chalk.green(ethBalance)}\n`;

    for (const t of tokens) {
      if (t.error) {
        out += `  ${t.address}: ${chalk.red(t.error)}\n`;
      } else {
        out += `  ${chalk.cyan(t.symbol)}: ${t.balance}\n`;
      }
    }

    return out;
  }

  toJSON() {
    return this.data;
  }
}

module.exports = { TVLTracker };

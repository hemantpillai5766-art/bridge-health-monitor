const assert = require('assert');
const { isValidAddress, normalizeAddress, shortenAddress } = require('../src/utils');

describe('utils', () => {
  describe('isValidAddress', () => {
    it('should accept valid checksummed address', () => {
      assert.strictEqual(
        isValidAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'),
        true
      );
    });

    it('should accept lowercase address', () => {
      assert.strictEqual(
        isValidAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'),
        true
      );
    });

    it('should reject invalid address', () => {
      assert.strictEqual(isValidAddress('0xinvalid'), false);
      assert.strictEqual(isValidAddress(''), false);
      assert.strictEqual(isValidAddress('not-an-address'), false);
    });
  });

  describe('normalizeAddress', () => {
    it('should normalize to lowercase', () => {
      const result = normalizeAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      assert.strictEqual(result, '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed');
    });
  });

  describe('shortenAddress', () => {
    it('should shorten long addresses', () => {
      const result = shortenAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
      assert.strictEqual(result, '0x5aAe...eAed');
    });

    it('should handle short strings', () => {
      assert.strictEqual(shortenAddress('0x123'), '0x123');
    });

    it('should handle null/undefined', () => {
      assert.strictEqual(shortenAddress(null), null);
      assert.strictEqual(shortenAddress(undefined), undefined);
    });
  });
});

// Simple test runner (no jest/mocha dependency)
if (require.main === module) {
  let passed = 0;
  let failed = 0;

  function describe(name, fn) { console.log(`\n${name}`); fn(); }
  function it(name, fn) {
    try { fn(); passed++; console.log(`  ✓ ${name}`); }
    catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
  }

  // Re-run with test runner context
  eval(require('fs').readFileSync(__filename, 'utf-8').split('if (require.main')[0]);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

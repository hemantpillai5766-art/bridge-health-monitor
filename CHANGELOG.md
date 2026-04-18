# Changelog

## [0.2.1] - 2026-04-18

### Fixed
- Handle RPC timeout gracefully in monitor service
- Normalize addresses for consistent comparison

## [0.2.0] - 2026-04-17

### Added
- TVL tracker with ERC-20 token balance support
- Live monitoring with webhook alerts
- Change detection (balance, threshold, signers, code)

### Changed
- Refactored multisig checker to support non-Gnosis contracts

## [0.1.0] - 2026-04-17

### Added
- Initial release
- Multisig signer checker with ENS resolution
- CLI with `check`, `monitor`, and `tvl` commands

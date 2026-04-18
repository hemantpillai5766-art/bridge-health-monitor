export interface SignerInfo {
  address: string;
  balance: string;
  txCount: number;
  ens: string | null;
  lastActivity: ActivityStatus;
}

export interface ActivityStatus {
  status: 'active' | 'inactive' | 'never' | 'unknown';
  totalTx?: number;
  pendingTx?: number;
}

export interface CheckResult {
  address: string;
  threshold: number;
  nonce: number;
  totalSigners: number;
  signers: SignerInfo[];
}

export interface MonitorConfig {
  interval: number;
  webhook?: string;
}

export interface ContractState {
  block: number;
  balance: string;
  codeHash: string;
  owners: string[];
  threshold: number;
  nonce: number;
  timestamp: string;
}

export interface TVLSnapshot {
  address: string;
  ethBalance: string;
  tokens: TokenBalance[];
  timestamp: string;
  block: number;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  balance: string;
  raw?: string;
  error?: string;
}

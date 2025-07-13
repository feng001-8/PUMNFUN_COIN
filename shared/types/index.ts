// 代币基础信息
export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  createdAt: Date
  creatorAddress: string
  initialLiquidity: number
  socialLinks?: {
    twitter?: string
    telegram?: string
    website?: string
  }
  isActive?: boolean  // 添加这个属性
}

// 价格数据
export interface PriceData {
  tokenAddress: string
  price: number
  priceChange1m: number
  priceChange5m: number
  priceChange15m: number
  priceChange1h: number
  priceChange24h: number
  timestamp: Date
}

// 交易数据
export interface TradingData {
  tokenAddress: string
  volume24h: number
  volumeChange: number
  txCount24h: number
  activeTraders: number
  liquidity: number
  liquidityChange: number
  timestamp: Date
}

// 持币分析
export interface HolderAnalysis {
  tokenAddress: string
  totalHolders: number
  newHolders1h: number
  holderGrowthRate: number
  top10HoldingPercentage: number
  whaleCount: number
  timestamp: Date
}

// 预警类型
export enum AlertType {
  SUPER_GOLDEN_DOG = 'super_golden_dog',
  POTENTIAL_GOLDEN_DOG = 'potential_golden_dog',
  WATCH_TOKEN = 'watch_token',
  HIGH_RISK = 'high_risk',
  MEDIUM_RISK = 'medium_risk',
  ABNORMAL_TRADING = 'abnormal_trading'
}

// 预警数据
export interface Alert {
  id: string
  tokenAddress: string
  type: AlertType
  title: string
  message: string
  score: number
  conditions: string[]
  timestamp: Date
  isRead: boolean
}

// KOL信息
export interface KOLInfo {
  address: string
  name: string
  category: string
  influence: number
  successRate: number
  isActive: boolean
  addedAt: Date
}

// KOL交易记录
export interface KOLTransaction {
  id: string
  kolAddress: string
  tokenAddress: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: Date
}

// 技术指标
export interface TechnicalIndicators {
  tokenAddress: string
  rsi: number
  macd: number
  volumeProfile: number
  momentum: number
  volatility: number
  timestamp: Date
}

// 风险评估
export interface RiskAssessment {
  tokenAddress: string
  contractSecurity: number
  liquidityRisk: number
  whaleRisk: number
  volatilityRisk: number
  overallRisk: number
  riskFactors: string[]
  timestamp: Date
}
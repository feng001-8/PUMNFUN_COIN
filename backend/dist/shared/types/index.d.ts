export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    createdAt: Date;
    createdTimestamp?: number;
    creatorAddress: string;
    creator?: string;
    initialLiquidity: number;
    socialLinks?: {
        twitter?: string;
        telegram?: string;
        website?: string;
    };
    twitter?: string;
    telegram?: string;
    website?: string;
    isActive?: boolean;
}
export interface PriceData {
    tokenAddress: string;
    price: number;
    priceChange1m: number;
    priceChange5m: number;
    priceChange15m: number;
    priceChange1h: number;
    priceChange24h: number;
    timestamp: Date;
}
export interface TradingData {
    tokenAddress: string;
    volume24h: number;
    volumeChange: number;
    txCount24h: number;
    activeTraders: number;
    liquidity: number;
    liquidityChange: number;
    timestamp: Date;
}
export interface HolderAnalysis {
    tokenAddress: string;
    totalHolders: number;
    newHolders1h: number;
    holderGrowthRate: number;
    top10HoldingPercentage: number;
    whaleCount: number;
    timestamp: Date;
}
export declare enum AlertType {
    SUPER_GOLDEN_DOG = "super_golden_dog",
    POTENTIAL_GOLDEN_DOG = "potential_golden_dog",
    WATCH_TOKEN = "watch_token",
    HIGH_RISK = "high_risk",
    MEDIUM_RISK = "medium_risk",
    ABNORMAL_TRADING = "abnormal_trading"
}
export interface Alert {
    id: string;
    tokenAddress: string;
    type: AlertType;
    title: string;
    message: string;
    score: number;
    conditions: string[];
    timestamp: Date;
    isRead: boolean;
}
export interface KOLInfo {
    address: string;
    name: string;
    category: string;
    influence: number;
    successRate: number;
    isActive: boolean;
    addedAt: Date;
}
export interface KOLTransaction {
    id: string;
    kolAddress: string;
    tokenAddress: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: Date;
}
export interface TechnicalIndicators {
    tokenAddress: string;
    rsi: number;
    macd: number;
    volumeProfile: number;
    momentum: number;
    volatility: number;
    timestamp: Date;
}
export interface RiskAssessment {
    tokenAddress: string;
    contractSecurity: number;
    liquidityRisk: number;
    whaleRisk: number;
    volatilityRisk: number;
    overallRisk: number;
    riskFactors: string[];
    timestamp: Date;
}

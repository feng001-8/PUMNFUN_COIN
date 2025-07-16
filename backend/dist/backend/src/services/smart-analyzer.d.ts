import { DatabaseManager } from '../database/schema.js';
import type { Server } from 'socket.io';
import type { KOLTracker } from './kol-tracker.js';
import type { SentimentAnalyzer } from './sentiment-analyzer.js';
export interface TechnicalIndicator {
    id?: number;
    tokenAddress: string;
    indicatorType: 'rsi' | 'macd' | 'bollinger_bands' | 'moving_average' | 'volume_profile';
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '24h';
    value: number;
    signal: 'buy' | 'sell' | 'hold';
    strength: number;
    timestamp: Date;
    metadata: Record<string, any>;
    createdAt?: Date;
}
export interface SmartAnalysis {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    overallScore: number;
    riskScore: number;
    potentialScore: number;
    technicalAnalysis: {
        score: number;
        signals: string[];
        indicators: TechnicalIndicator[];
        trend: 'bullish' | 'bearish' | 'neutral';
        support: number;
        resistance: number;
    };
    sentimentAnalysis: {
        score: number;
        sentiment: string;
        confidence: number;
        socialVolume: number;
        keySignals: string[];
    };
    kolAnalysis: {
        score: number;
        activeKOLs: number;
        recentActivity: string[];
        influenceLevel: 'high' | 'medium' | 'low';
    };
    marketAnalysis: {
        score: number;
        volume24h: number;
        priceChange24h: number;
        marketCap: number;
        liquidity: number;
        volatility: number;
    };
    recommendation: {
        action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
        confidence: number;
        reasoning: string[];
        riskFactors: string[];
        targetPrice?: number;
        stopLoss?: number;
        timeHorizon: 'short' | 'medium' | 'long';
    };
    prediction: {
        priceTarget1h: number;
        priceTarget24h: number;
        priceTarget7d: number;
        probability: number;
        scenarios: {
            bullish: {
                probability: number;
                target: number;
            };
            neutral: {
                probability: number;
                target: number;
            };
            bearish: {
                probability: number;
                target: number;
            };
        };
    };
    timestamp: Date;
    lastUpdated: Date;
}
export interface MarketState {
    trend: 'bull' | 'bear' | 'sideways';
    volatility: 'high' | 'medium' | 'low';
    volume: 'high' | 'medium' | 'low';
    sentiment: 'positive' | 'negative' | 'neutral';
    riskLevel: 'high' | 'medium' | 'low';
}
export declare class SmartAnalyzer {
    private db;
    private io?;
    private kolTracker?;
    private sentimentAnalyzer?;
    private isRunning;
    private analysisInterval?;
    constructor(db: DatabaseManager);
    setSocketIO(io: Server): void;
    setKOLTracker(kolTracker: KOLTracker): void;
    setSentimentAnalyzer(sentimentAnalyzer: SentimentAnalyzer): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    private performSmartAnalysis;
    analyzeToken(tokenAddress: string): Promise<SmartAnalysis | null>;
    private performTechnicalAnalysis;
    private getSentimentAnalysis;
    private performKOLAnalysis;
    private performMarketAnalysis;
    private calculateOverallScore;
    private calculateRiskScore;
    private calculatePotentialScore;
    private generateRecommendation;
    private generatePricePrediction;
    private getPriceData;
    private calculateTechnicalIndicators;
    private calculateRSI;
    private analyzeTrend;
    private calculateSupportResistance;
    private generateTechnicalSignals;
    private calculateTechnicalScore;
    private getRecentKOLTransactions;
    private analyzeKOLActivity;
    private calculateInfluenceLevel;
    private calculateKOLScore;
    private calculateMarketScore;
    private getCurrentPrice;
    private getActiveTokens;
    private getTokenInfo;
    private initializeTechnicalIndicators;
    private checkAnalysisAlerts;
    private createAnalysisAlert;
}

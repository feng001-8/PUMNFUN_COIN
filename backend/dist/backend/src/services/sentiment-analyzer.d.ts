import { DatabaseManager } from '../database/schema.js';
import type { Server } from 'socket.io';
export interface SentimentData {
    id?: number;
    tokenAddress: string;
    source: 'twitter' | 'telegram' | 'discord' | 'reddit' | 'pump_comments';
    sentimentScore: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    totalMentions: number;
    keywordMentions: {
        bullish: number;
        bearish: number;
        moon: number;
        dump: number;
        hodl: number;
        sell: number;
    };
    influencerMentions: number;
    volumeSpike: boolean;
    trendingScore: number;
    timestamp: Date;
    createdAt?: Date;
}
export interface SentimentAnalysis {
    tokenAddress: string;
    tokenSymbol: string;
    overallSentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
    sentimentScore: number;
    confidence: number;
    trendDirection: 'rising' | 'falling' | 'stable';
    socialVolume: number;
    influencerActivity: number;
    keySignals: string[];
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    timestamp: Date;
}
export declare class SentimentAnalyzer {
    private db;
    private io?;
    private isRunning;
    private analysisInterval?;
    constructor(db: DatabaseManager);
    setSocketIO(io: Server): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    recordSentimentData(data: Omit<SentimentData, 'id' | 'createdAt'>): Promise<void>;
    private performSentimentAnalysis;
    analyzeTokenSentiment(tokenAddress: string): Promise<SentimentAnalysis | null>;
    private calculateOverallSentiment;
    private calculateTrendDirection;
    private calculateSocialVolume;
    private calculateInfluencerActivity;
    private generateKeySignals;
    private aggregateKeywordMentions;
    private assessRiskLevel;
    private generateRecommendation;
    private calculateConfidence;
    private scoresToSentiment;
    private checkSentimentAlerts;
    private createSentimentAlert;
    private getActiveTokens;
    private getTokenInfo;
    private initializeMockSentimentData;
    getTokenSentimentHistory(tokenAddress: string, hours?: number): Promise<SentimentData[]>;
}

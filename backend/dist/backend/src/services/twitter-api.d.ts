import { SentimentAnalyzer } from './sentiment-analyzer.js';
import { TokenMappingService } from './token-mapping.js';
import { DatabaseManager } from '../database/schema.js';
export interface TwitterConfig {
    bearerToken: string;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessSecret?: string;
}
export interface TweetSentimentData {
    tweetId: string;
    text: string;
    authorId: string;
    authorUsername: string;
    authorFollowers: number;
    createdAt: Date;
    publicMetrics: {
        retweetCount: number;
        likeCount: number;
        replyCount: number;
        quoteCount: number;
    };
    sentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    tokenMentions: string[];
    isInfluencer: boolean;
}
export interface InfluencerInfo {
    userId: string;
    username: string;
    displayName: string;
    followersCount: number;
    verifiedType?: string;
    category: 'crypto_trader' | 'analyst' | 'influencer' | 'whale' | 'developer';
    credibilityScore: number;
}
export declare class TwitterAPIService {
    private client;
    private db;
    private sentimentAnalyzer;
    private tokenMapping;
    private isRunning;
    private streamingInterval?;
    private rateLimitReset;
    private io?;
    private readonly CRYPTO_KEYWORDS;
    private readonly CRYPTO_INFLUENCERS;
    constructor(config: TwitterConfig, db: DatabaseManager, sentimentAnalyzer: SentimentAnalyzer, tokenMapping: TokenMappingService);
    start(): Promise<void>;
    stop(): Promise<void>;
    setSocketIO(io: any): void;
    verifyConnection(): Promise<boolean>;
    private validateConnection;
    private initializeInfluencers;
    private addInfluencer;
    private categorizeInfluencer;
    private calculateCredibilityScore;
    private saveInfluencer;
    startDataCollection(): Promise<void>;
    private searchCryptoTweets;
    private buildSearchQuery;
    private processTweets;
    private analyzeTweet;
    private analyzeTweetSentiment;
    private extractTokenMentions;
    private isUserInfluencer;
    private saveTweetSentiment;
    private convertToSentimentData;
    private extractKeywordMentions;
    private detectVolumeSpike;
    private calculateTrendingScore;
    private monitorInfluencers;
    private getStoredInfluencers;
    private getInfluencerTweets;
    private checkRateLimit;
    private delay;
    getStoredInfluencersList(): Promise<InfluencerInfo[]>;
    addInfluencerPublic(influencerData: {
        username: string;
        category?: string;
        description?: string;
    }): Promise<void>;
    getTwitterSentimentStats(tokenAddress?: string): Promise<any>;
}

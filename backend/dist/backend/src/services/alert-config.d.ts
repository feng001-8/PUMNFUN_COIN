import { DatabaseManager } from '../database/schema.js';
import type { Server } from 'socket.io';
export interface AlertConfig {
    id?: number;
    userId: string;
    name: string;
    description?: string;
    isActive: boolean;
    conditions: AlertCondition[];
    actions: AlertAction[];
    cooldownMinutes: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    createdAt?: Date;
    updatedAt?: Date;
    lastTriggered?: Date;
}
export interface AlertCondition {
    type: 'price_change' | 'volume_spike' | 'sentiment_change' | 'kol_activity' | 'technical_indicator' | 'market_cap_change';
    operator: 'greater_than' | 'less_than' | 'equals' | 'between' | 'percentage_change';
    value: number | number[];
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '24h';
    tokenAddress?: string;
    additionalParams?: Record<string, any>;
}
export interface AlertAction {
    type: 'notification' | 'email' | 'webhook' | 'auto_trade';
    config: Record<string, any>;
    enabled: boolean;
}
export interface AlertTrigger {
    configId: number;
    configName: string;
    userId: string;
    tokenAddress?: string;
    tokenSymbol?: string;
    conditionType: string;
    currentValue: number;
    thresholdValue: number | number[];
    message: string;
    priority: string;
    timestamp: Date;
    data: Record<string, any>;
}
export declare class AlertConfigService {
    private db;
    private io?;
    private isRunning;
    private monitoringInterval?;
    private activeConfigs;
    constructor(db: DatabaseManager);
    setSocketIO(io: Server): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    createAlertConfig(config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered'>): Promise<number>;
    updateAlertConfig(id: number, updates: Partial<AlertConfig>): Promise<void>;
    deleteAlertConfig(id: number): Promise<void>;
    getAlertConfig(id: number): Promise<AlertConfig | null>;
    getUserAlertConfigs(userId: string): Promise<AlertConfig[]>;
    private checkAlertConditions;
    private evaluateCondition;
    private evaluatePriceChangeCondition;
    private evaluateVolumeSpikeCondition;
    private evaluateSentimentChangeCondition;
    private evaluateKOLActivityCondition;
    private evaluateTechnicalIndicatorCondition;
    private evaluateMarketCapChangeCondition;
    private triggerAlert;
    private executeAlertAction;
    private updateLastTriggered;
    private recordAlert;
    private loadActiveConfigs;
    private initializeDefaultConfigs;
    private mapRowToConfig;
    private getTokenInfo;
}

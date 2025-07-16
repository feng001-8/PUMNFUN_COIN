import { DatabaseManager } from '../database/schema.js';
import type { Server } from 'socket.io';
export declare class AlertEngine {
    private db;
    private io?;
    private isRunning;
    constructor(db: DatabaseManager);
    setSocketIO(io: Server): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    private checkAlertConditions;
    private checkGoldenDogAlerts;
    private checkRiskAlerts;
    private checkAbnormalTradingAlerts;
    private createGoldenDogAlert;
    private calculateGoldenDogScore;
    private saveAlert;
    private broadcastAlert;
}

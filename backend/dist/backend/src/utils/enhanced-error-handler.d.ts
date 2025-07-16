import type { Server } from 'socket.io';
export declare enum ErrorType {
    API_ERROR = "API_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface EnhancedError extends Error {
    type: ErrorType;
    severity: ErrorSeverity;
    context?: Record<string, any>;
    timestamp: Date;
    retryable: boolean;
    retryCount?: number;
    maxRetries?: number;
    originalError?: Error;
}
interface ErrorStats {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    lastHour: number;
    lastDay: number;
}
interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: ErrorType[];
}
declare class EnhancedErrorHandler {
    private errorStats;
    private errorHistory;
    private retryConfig;
    private io?;
    constructor();
    /**
     * 设置Socket.io实例用于实时错误通知
     */
    setSocketIO(io: Server): void;
    /**
     * 创建增强错误
     */
    createError(message: string, type?: ErrorType, severity?: ErrorSeverity, context?: Record<string, any>, originalError?: Error): EnhancedError;
    /**
     * 处理错误
     */
    handleError(error: Error | EnhancedError, context?: string, additionalContext?: Record<string, any>): Promise<void>;
    /**
     * 带重试的操作执行
     */
    withRetry<T>(operation: () => Promise<T>, context: string, customRetryConfig?: Partial<RetryConfig>): Promise<T>;
    /**
     * 获取错误统计
     */
    getErrorStats(): ErrorStats;
    /**
     * 获取最近错误
     */
    getRecentErrors(limit?: number): EnhancedError[];
    /**
     * 清除错误统计
     */
    clearStats(): void;
    private isEnhancedError;
    private classifyError;
    private determineSeverity;
    private recordError;
    private logError;
    private notifyError;
    private checkAlertThresholds;
    private updateTimeWindowStats;
    private cleanupErrorHistory;
    private sleep;
}
export declare const enhancedErrorHandler: EnhancedErrorHandler;
export default enhancedErrorHandler;

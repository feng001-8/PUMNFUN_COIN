export declare enum ErrorCode {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
    DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
    DATABASE_MIGRATION_ERROR = "DATABASE_MIGRATION_ERROR",
    API_REQUEST_ERROR = "API_REQUEST_ERROR",
    API_RATE_LIMIT_ERROR = "API_RATE_LIMIT_ERROR",
    API_AUTHENTICATION_ERROR = "API_AUTHENTICATION_ERROR",
    API_TIMEOUT_ERROR = "API_TIMEOUT_ERROR",
    TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
    INVALID_TOKEN_ADDRESS = "INVALID_TOKEN_ADDRESS",
    PRICE_DATA_UNAVAILABLE = "PRICE_DATA_UNAVAILABLE",
    TRADING_DATA_UNAVAILABLE = "TRADING_DATA_UNAVAILABLE"
}
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly context?: any;
    readonly timestamp: Date;
    constructor(message: string, code?: ErrorCode, statusCode?: number, isOperational?: boolean, context?: any);
    toJSON(): {
        name: string;
        message: string;
        code: ErrorCode;
        statusCode: number;
        isOperational: boolean;
        context: any;
        timestamp: string;
        stack: string | undefined;
    };
}
export declare class ErrorHandler {
    private static instance;
    private errorCounts;
    private lastErrors;
    static getInstance(): ErrorHandler;
    private constructor();
    handleError(error: Error | AppError, context?: string): void;
    private handleCriticalError;
    private updateErrorStats;
    private checkErrorThresholds;
    getErrorStats(): {
        code: ErrorCode;
        count: number;
        lastOccurrence: Date;
    }[];
    clearErrorStats(): void;
}
export declare const errorHandler: ErrorHandler;
export declare const createError: {
    validation: (message: string, context?: any) => AppError;
    configuration: (message: string, context?: any) => AppError;
    database: (message: string, context?: any) => AppError;
    apiRequest: (message: string, context?: any) => AppError;
    apiRateLimit: (message: string, context?: any) => AppError;
    apiTimeout: (message: string, context?: any) => AppError;
    tokenNotFound: (address: string) => AppError;
    invalidTokenAddress: (address: string) => AppError;
    priceDataUnavailable: (address: string) => AppError;
    tradingDataUnavailable: (address: string) => AppError;
};
export declare function withErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R>, context?: string): (...args: T) => Promise<R>;
export declare function withErrorHandlingSync<T extends any[], R>(fn: (...args: T) => R, context?: string): (...args: T) => R;

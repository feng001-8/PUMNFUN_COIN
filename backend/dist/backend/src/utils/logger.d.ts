export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    data?: any;
    error?: Error;
}
export declare class Logger {
    private logLevel;
    private logDir;
    private enableConsole;
    private enableFile;
    constructor(options?: {
        logLevel?: LogLevel;
        logDir?: string;
        enableConsole?: boolean;
        enableFile?: boolean;
    });
    private log;
    private logToConsole;
    private logToFile;
    error(message: string, data?: any, error?: Error): void;
    warn(message: string, data?: any): void;
    info(message: string, data?: any): void;
    debug(message: string, data?: any): void;
    apiRequest(method: string, url: string, duration?: number): void;
    apiError(method: string, url: string, error: Error, duration?: number): void;
    tokenDiscovered(symbol: string, address: string, score?: number): void;
    goldenDogAlert(symbol: string, address: string, score: number, reasons: string[]): void;
    priceUpdate(address: string, price: number, change24h: number): void;
    tradingDataUpdate(address: string, volume24h: number, activeTraders: number): void;
}
export declare const logger: Logger;
export declare const log: {
    error: (message: string, data?: any, error?: Error) => void;
    warn: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
    apiRequest: (method: string, url: string, duration?: number) => void;
    apiError: (method: string, url: string, error: Error, duration?: number) => void;
    tokenDiscovered: (symbol: string, address: string, score?: number) => void;
    goldenDogAlert: (symbol: string, address: string, score: number, reasons: string[]) => void;
    priceUpdate: (address: string, price: number, change24h: number) => void;
    tradingDataUpdate: (address: string, volume24h: number, activeTraders: number) => void;
};

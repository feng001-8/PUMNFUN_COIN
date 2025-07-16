import { logger } from './logger.js'

export enum ErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // 数据库错误
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_MIGRATION_ERROR = 'DATABASE_MIGRATION_ERROR',
  
  // API错误
  API_REQUEST_ERROR = 'API_REQUEST_ERROR',
  API_RATE_LIMIT_ERROR = 'API_RATE_LIMIT_ERROR',
  API_AUTHENTICATION_ERROR = 'API_AUTHENTICATION_ERROR',
  API_TIMEOUT_ERROR = 'API_TIMEOUT_ERROR',
  
  // 业务逻辑错误
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  INVALID_TOKEN_ADDRESS = 'INVALID_TOKEN_ADDRESS',
  PRICE_DATA_UNAVAILABLE = 'PRICE_DATA_UNAVAILABLE',
  TRADING_DATA_UNAVAILABLE = 'TRADING_DATA_UNAVAILABLE'
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: any
  public readonly timestamp: Date

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date()
    
    // 确保堆栈跟踪正确
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    }
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorCounts: Map<ErrorCode, number> = new Map()
  private lastErrors: Map<ErrorCode, Date> = new Map()

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private constructor() {
    // 监听未捕获的异常
    process.on('uncaughtException', (error: Error) => {
      this.handleCriticalError('未捕获的异常', error)
    })

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.handleCriticalError('未处理的Promise拒绝', new Error(String(reason)))
    })
  }

  handleError(error: Error | AppError, context?: string): void {
    const isAppError = error instanceof AppError
    const errorCode = isAppError ? error.code : ErrorCode.UNKNOWN_ERROR
    
    // 更新错误统计
    this.updateErrorStats(errorCode)
    
    // 记录错误
    const logContext = {
      context,
      errorCode,
      isOperational: isAppError ? error.isOperational : false,
      ...(isAppError && error.context ? { errorContext: error.context } : {})
    }
    
    if (isAppError && error.isOperational) {
      // 可操作的错误，记录为警告
      logger.warn(`操作错误: ${error.message}`, logContext)
    } else {
      // 系统错误，记录为错误
      logger.error(`系统错误: ${error.message}`, {
        ...logContext,
        stack: error.stack,
        errorMessage: error.message
      })
    }
    
    // 检查是否需要采取特殊行动
    this.checkErrorThresholds(errorCode)
  }

  private handleCriticalError(type: string, error: Error): void {
    logger.error(`🚨 严重错误 - ${type}`, {
      type,
      message: error.message,
      stack: error.stack
    })
    
    // 在严重错误时，给应用一些时间来清理资源
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  }

  private updateErrorStats(errorCode: ErrorCode): void {
    const currentCount = this.errorCounts.get(errorCode) || 0
    this.errorCounts.set(errorCode, currentCount + 1)
    this.lastErrors.set(errorCode, new Date())
  }

  private checkErrorThresholds(errorCode: ErrorCode): void {
    const count = this.errorCounts.get(errorCode) || 0
    const lastError = this.lastErrors.get(errorCode)
    
    // 如果在5分钟内同一类型错误超过10次，发出警告
    if (count > 10 && lastError) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (lastError > fiveMinutesAgo) {
        logger.warn(`错误频率过高: ${errorCode}`, {
          count,
          timeWindow: '5分钟',
          lastError: lastError.toISOString()
        })
      }
    }
  }

  getErrorStats(): { code: ErrorCode; count: number; lastOccurrence: Date }[] {
    const stats: { code: ErrorCode; count: number; lastOccurrence: Date }[] = []
    
    for (const [code, count] of this.errorCounts.entries()) {
      const lastOccurrence = this.lastErrors.get(code)!
      stats.push({ code, count, lastOccurrence })
    }
    
    return stats.sort((a, b) => b.count - a.count)
  }

  clearErrorStats(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
    logger.info('错误统计已清除')
  }
}

// 创建全局错误处理器实例
export const errorHandler = ErrorHandler.getInstance()

// 便捷的错误创建函数
export const createError = {
  validation: (message: string, context?: any) => 
    new AppError(message, ErrorCode.VALIDATION_ERROR, 400, true, context),
    
  configuration: (message: string, context?: any) => 
    new AppError(message, ErrorCode.CONFIGURATION_ERROR, 500, true, context),
    
  database: (message: string, context?: any) => 
    new AppError(message, ErrorCode.DATABASE_QUERY_ERROR, 500, true, context),
    
  apiRequest: (message: string, context?: any) => 
    new AppError(message, ErrorCode.API_REQUEST_ERROR, 502, true, context),
    
  apiRateLimit: (message: string, context?: any) => 
    new AppError(message, ErrorCode.API_RATE_LIMIT_ERROR, 429, true, context),
    
  apiTimeout: (message: string, context?: any) => 
    new AppError(message, ErrorCode.API_TIMEOUT_ERROR, 504, true, context),
    
  tokenNotFound: (address: string) => 
    new AppError(`代币未找到: ${address}`, ErrorCode.TOKEN_NOT_FOUND, 404, true, { address }),
    
  invalidTokenAddress: (address: string) => 
    new AppError(`无效的代币地址: ${address}`, ErrorCode.INVALID_TOKEN_ADDRESS, 400, true, { address }),
    
  priceDataUnavailable: (address: string) => 
    new AppError(`价格数据不可用: ${address}`, ErrorCode.PRICE_DATA_UNAVAILABLE, 503, true, { address }),
    
  tradingDataUnavailable: (address: string) => 
    new AppError(`交易数据不可用: ${address}`, ErrorCode.TRADING_DATA_UNAVAILABLE, 503, true, { address })
}

// 异步函数错误包装器
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      errorHandler.handleError(error as Error, context)
      throw error
    }
  }
}

// 同步函数错误包装器
export function withErrorHandlingSync<T extends any[], R>(
  fn: (...args: T) => R,
  context?: string
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return fn(...args)
    } catch (error) {
      errorHandler.handleError(error as Error, context)
      throw error
    }
  }
}
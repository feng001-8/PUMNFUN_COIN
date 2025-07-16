import { logger } from './logger.js'
import { environment } from '../config/environment.js'
import type { Server } from 'socket.io'

// 错误类型枚举
export enum ErrorType {
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 增强错误接口
export interface EnhancedError extends Error {
  type: ErrorType
  severity: ErrorSeverity
  context?: Record<string, any>
  timestamp: Date
  retryable: boolean
  retryCount?: number
  maxRetries?: number
  originalError?: Error
}

// 错误统计接口
interface ErrorStats {
  total: number
  byType: Record<ErrorType, number>
  bySeverity: Record<ErrorSeverity, number>
  lastHour: number
  lastDay: number
}

// 重试配置接口
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: ErrorType[]
}

class EnhancedErrorHandler {
  private errorStats: ErrorStats
  private errorHistory: EnhancedError[] = []
  private retryConfig: RetryConfig
  private io?: Server

  constructor() {
    this.errorStats = {
      total: 0,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      lastHour: 0,
      lastDay: 0
    }

    this.retryConfig = {
      maxRetries: environment.performance.httpMaxRetries,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: [
        ErrorType.NETWORK_ERROR,
        ErrorType.TIMEOUT_ERROR,
        ErrorType.RATE_LIMIT_ERROR,
        ErrorType.API_ERROR
      ]
    }

    // 初始化错误统计
    Object.values(ErrorType).forEach(type => {
      this.errorStats.byType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      this.errorStats.bySeverity[severity] = 0
    })

    // 定期清理错误历史
    setInterval(() => {
      this.cleanupErrorHistory()
    }, 60 * 60 * 1000) // 每小时清理一次
  }

  /**
   * 设置Socket.io实例用于实时错误通知
   */
  setSocketIO(io: Server): void {
    this.io = io
  }

  /**
   * 创建增强错误
   */
  createError(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    originalError?: Error
  ): EnhancedError {
    const error = new Error(message) as EnhancedError
    error.type = type
    error.severity = severity
    error.context = context
    error.timestamp = new Date()
    error.retryable = this.retryConfig.retryableErrors.includes(type)
    error.retryCount = 0
    error.maxRetries = this.retryConfig.maxRetries
    error.originalError = originalError

    return error
  }

  /**
   * 处理错误
   */
  async handleError(
    error: Error | EnhancedError,
    context?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    let enhancedError: EnhancedError

    if (this.isEnhancedError(error)) {
      enhancedError = error
    } else {
      enhancedError = this.createError(
        error.message,
        this.classifyError(error),
        this.determineSeverity(error),
        { context, ...additionalContext },
        error
      )
    }

    // 记录错误
    this.recordError(enhancedError)

    // 日志记录
    this.logError(enhancedError, context)

    // 发送实时通知
    await this.notifyError(enhancedError)

    // 检查是否需要触发告警
    this.checkAlertThresholds()
  }

  /**
   * 带重试的操作执行
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig }
    let lastError: Error
    let attempt = 0

    while (attempt <= config.maxRetries) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        const enhancedError = this.isEnhancedError(error) 
          ? error as EnhancedError
          : this.createError(
              (error as Error).message,
              this.classifyError(error as Error),
              this.determineSeverity(error as Error),
              { context, attempt },
              error as Error
            )

        // 如果不可重试或达到最大重试次数，抛出错误
        if (!enhancedError.retryable || attempt >= config.maxRetries) {
          enhancedError.retryCount = attempt
          await this.handleError(enhancedError, context)
          throw enhancedError
        }

        // 计算延迟时间
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )

        logger.warn(`⏳ ${delay}ms后重试...`)
        await this.sleep(delay)
        attempt++
      }
    }

    throw lastError!
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): ErrorStats {
    return { ...this.errorStats }
  }

  /**
   * 获取最近错误
   */
  getRecentErrors(limit: number = 50): EnhancedError[] {
    return this.errorHistory.slice(-limit)
  }

  /**
   * 清除错误统计
   */
  clearStats(): void {
    this.errorStats.total = 0
    Object.keys(this.errorStats.byType).forEach(type => {
      this.errorStats.byType[type as ErrorType] = 0
    })
    Object.keys(this.errorStats.bySeverity).forEach(severity => {
      this.errorStats.bySeverity[severity as ErrorSeverity] = 0
    })
    this.errorStats.lastHour = 0
    this.errorStats.lastDay = 0
    this.errorHistory = []
  }

  // 私有方法

  private isEnhancedError(error: any): error is EnhancedError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error
  }

  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('fetch failed') || message.includes('network') || message.includes('enotfound')) {
      return ErrorType.NETWORK_ERROR
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return ErrorType.TIMEOUT_ERROR
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorType.RATE_LIMIT_ERROR
    }
    if (message.includes('database') || message.includes('sqlite') || stack.includes('database')) {
      return ErrorType.DATABASE_ERROR
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.AUTHENTICATION_ERROR
    }
    if (message.includes('api') || stack.includes('api')) {
      return ErrorType.API_ERROR
    }

    return ErrorType.UNKNOWN_ERROR
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase()

    if (message.includes('critical') || message.includes('fatal') || message.includes('crash')) {
      return ErrorSeverity.CRITICAL
    }
    if (message.includes('database') || message.includes('authentication')) {
      return ErrorSeverity.HIGH
    }
    if (message.includes('api') || message.includes('network')) {
      return ErrorSeverity.MEDIUM
    }

    return ErrorSeverity.LOW
  }

  private recordError(error: EnhancedError): void {
    this.errorStats.total++
    this.errorStats.byType[error.type]++
    this.errorStats.bySeverity[error.severity]++

    // 记录到历史
    this.errorHistory.push(error)

    // 限制历史记录数量
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-500)
    }

    // 更新时间窗口统计
    this.updateTimeWindowStats()
  }

  private logError(error: EnhancedError, context?: string): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: context || error.context,
      timestamp: error.timestamp,
      retryCount: error.retryCount,
      stack: error.stack
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('🚨 CRITICAL ERROR:', logData)
        break
      case ErrorSeverity.HIGH:
        logger.error('❌ HIGH SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.MEDIUM:
        logger.warn('⚠️ MEDIUM SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.LOW:
        logger.info('ℹ️ LOW SEVERITY ERROR:', logData)
        break
    }
  }

  private async notifyError(error: EnhancedError): Promise<void> {
    if (this.io && error.severity === ErrorSeverity.CRITICAL) {
      this.io.emit('critical_error', {
        type: error.type,
        message: error.message,
        timestamp: error.timestamp,
        context: error.context
      })
    }
  }

  private checkAlertThresholds(): void {
    const criticalErrors = this.errorStats.bySeverity[ErrorSeverity.CRITICAL]
    const highErrors = this.errorStats.bySeverity[ErrorSeverity.HIGH]

    if (criticalErrors >= 5) {
      logger.error('🚨 ALERT: 检测到过多严重错误！')
    }
    if (highErrors >= 10) {
      logger.warn('⚠️ ALERT: 检测到过多高级错误！')
    }
    if (this.errorStats.lastHour >= 50) {
      logger.warn('⚠️ ALERT: 过去一小时错误率过高！')
    }
  }

  private updateTimeWindowStats(): void {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    this.errorStats.lastHour = this.errorHistory.filter(
      error => error.timestamp.getTime() > oneHourAgo
    ).length

    this.errorStats.lastDay = this.errorHistory.filter(
      error => error.timestamp.getTime() > oneDayAgo
    ).length
  }

  private cleanupErrorHistory(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.errorHistory = this.errorHistory.filter(
      error => error.timestamp.getTime() > oneDayAgo
    )
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 导出单例
export const enhancedErrorHandler = new EnhancedErrorHandler()
export default enhancedErrorHandler
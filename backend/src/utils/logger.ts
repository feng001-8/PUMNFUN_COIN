import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  data?: any
  error?: Error
}

export class Logger {
  private logLevel: LogLevel
  private logDir: string
  private enableConsole: boolean
  private enableFile: boolean

  constructor(options: {
    logLevel?: LogLevel
    logDir?: string
    enableConsole?: boolean
    enableFile?: boolean
  } = {}) {
    this.logLevel = options.logLevel ?? LogLevel.INFO
    this.logDir = options.logDir ?? './logs'
    this.enableConsole = options.enableConsole ?? true
    this.enableFile = options.enableFile ?? true

    // 确保日志目录存在
    if (this.enableFile && !existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level > this.logLevel) return

    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    
    const logEntry: LogEntry = {
      timestamp,
      level: levelName,
      message,
      data,
      error
    }

    // 控制台输出
    if (this.enableConsole) {
      this.logToConsole(logEntry)
    }

    // 文件输出
    if (this.enableFile) {
      this.logToFile(logEntry)
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, data, error } = entry
    const timeStr = new Date(timestamp).toLocaleTimeString()
    
    let emoji = '📝'
    let color = '\x1b[0m' // 重置颜色
    
    switch (entry.level) {
      case 'ERROR':
        emoji = '❌'
        color = '\x1b[31m' // 红色
        break
      case 'WARN':
        emoji = '⚠️'
        color = '\x1b[33m' // 黄色
        break
      case 'INFO':
        emoji = '📊'
        color = '\x1b[36m' // 青色
        break
      case 'DEBUG':
        emoji = '🔍'
        color = '\x1b[90m' // 灰色
        break
    }

    console.log(`${color}${emoji} [${timeStr}] ${level}: ${message}\x1b[0m`)
    
    if (data) {
      console.log('  📋 数据:', JSON.stringify(data, null, 2))
    }
    
    if (error) {
      console.error('  🚨 错误:', error.stack || error.message)
    }
  }

  private logToFile(entry: LogEntry): void {
    const date = new Date().toISOString().split('T')[0]
    const logFile = join(this.logDir, `${date}.log`)
    
    const logLine = JSON.stringify(entry) + '\n'
    
    try {
      appendFileSync(logFile, logLine, 'utf8')
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  error(message: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, data, error)
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  // API相关的专用日志方法
  apiRequest(method: string, url: string, duration?: number): void {
    this.info(`API请求: ${method} ${url}`, { duration })
  }

  apiError(method: string, url: string, error: Error, duration?: number): void {
    this.error(`API请求失败: ${method} ${url}`, { duration }, error)
  }

  tokenDiscovered(symbol: string, address: string, score?: number): void {
    this.info(`发现新代币: ${symbol}`, { address, score })
  }

  goldenDogAlert(symbol: string, address: string, score: number, reasons: string[]): void {
    this.info(`🔥 金狗预警: ${symbol}`, { address, score, reasons })
  }

  priceUpdate(address: string, price: number, change24h: number): void {
    this.debug(`价格更新: ${address}`, { price, change24h })
  }

  tradingDataUpdate(address: string, volume24h: number, activeTraders: number): void {
    this.debug(`交易数据更新: ${address}`, { volume24h, activeTraders })
  }
}

// 获取日志级别
function getLogLevel(): LogLevel {
  const envLogLevel = process.env.LOG_LEVEL?.toLowerCase()
  switch (envLogLevel) {
    case 'debug': return LogLevel.DEBUG
    case 'info': return LogLevel.INFO
    case 'warn': return LogLevel.WARN
    case 'error': return LogLevel.ERROR
    default:
      return process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
  }
}

// 创建全局日志实例
export const logger = new Logger({
  logLevel: getLogLevel(),
  enableConsole: true,
  enableFile: true
})

// 导出便捷方法
export const log = {
  error: (message: string, data?: any, error?: Error) => logger.error(message, data, error),
  warn: (message: string, data?: any) => logger.warn(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  debug: (message: string, data?: any) => logger.debug(message, data),
  
  // API专用
  apiRequest: (method: string, url: string, duration?: number) => logger.apiRequest(method, url, duration),
  apiError: (method: string, url: string, error: Error, duration?: number) => logger.apiError(method, url, error, duration),
  
  // 业务专用
  tokenDiscovered: (symbol: string, address: string, score?: number) => logger.tokenDiscovered(symbol, address, score),
  goldenDogAlert: (symbol: string, address: string, score: number, reasons: string[]) => logger.goldenDogAlert(symbol, address, score, reasons),
  priceUpdate: (address: string, price: number, change24h: number) => logger.priceUpdate(address, price, change24h),
  tradingDataUpdate: (address: string, volume24h: number, activeTraders: number) => logger.tradingDataUpdate(address, volume24h, activeTraders)
}
import { getPumpPortalAPI } from './pumpportal-api.js'
import { getConfig } from '../config/api-config.js'
import { logger } from '../utils/logger.js'
import type { TokenInfo, TradingData } from '../../../shared/types/index.ts'
import type { Server } from 'socket.io'

/**
 * 数据源管理器 - 使用 PumpPortal 作为唯一数据源
 */
export class DataSourceManager {
  private config = getConfig()
  private io?: Server
  private isRunning: boolean = false

  constructor() {
    this.initializeDataSource()
  }

  /**
   * 设置Socket.IO实例
   */
  setSocketIO(io: Server): void {
    this.io = io
  }

  /**
   * 启动数据源管理器
   */
  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    logger.info('📊 数据源管理器启动')
  }

  /**
   * 停止数据源管理器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return
    this.isRunning = false
    logger.info('📊 数据源管理器停止')
  }

  /**
   * 初始化数据源
   */
  private async initializeDataSource(): Promise<void> {
    logger.info('使用 PumpPortal 作为数据源')
  }

  /**
   * 获取最新代币列表
   */
  async getNewTokens(limit: number = 50, offset: number = 0): Promise<TokenInfo[]> {
    try {
      return await getPumpPortalAPI().getNewTokens(limit, offset)
    } catch (error) {
      logger.error('PumpPortal 获取代币列表失败:', error)
      return []
    }
  }

  /**
   * 获取特定代币信息
   */
  async getTokenInfo(address: string): Promise<TokenInfo | null> {
    try {
      return await getPumpPortalAPI().getTokenInfo(address)
    } catch (error) {
      logger.error('PumpPortal 获取代币信息失败:', error)
      return null
    }
  }

  /**
   * 计算交易数据
   */
  async calculateTradingData(address: string): Promise<TradingData | null> {
    try {
      return await getPumpPortalAPI().calculateTradingData(address)
    } catch (error) {
      logger.error('PumpPortal 计算交易数据失败:', error)
      return null
    }
  }

  /**
   * 检查金狗条件
   */
  async checkGoldenDogCriteria(address: string): Promise<{
    isGoldenDog: boolean
    score: number
    reasons: string[]
  }> {
    try {
      return await getPumpPortalAPI().checkGoldenDogCriteria(address)
    } catch (error) {
      logger.error('PumpPortal 检查金狗条件失败:', error)
      return { isGoldenDog: false, score: 0, reasons: ['检查失败'] }
    }
  }

  /**
   * 订阅新代币事件
   */
  onNewToken(listener: (token: TokenInfo) => void): void {
    if (this.config.pumpportal.enabled) {
      getPumpPortalAPI().onNewToken(listener)
    }
  }

  /**
   * 订阅交易事件
   */
  onTrade(listener: (trade: any) => void): void {
    if (this.config.pumpportal.enabled) {
      getPumpPortalAPI().onTrade(listener)
    }
  }

  /**
   * 订阅特定代币交易
   */
  subscribeTokenTrades(tokenAddress: string): void {
    if (this.config.pumpportal.enabled) {
      getPumpPortalAPI().subscribeTokenTrades(tokenAddress)
    }
  }

  /**
   * 获取当前数据源
   */
  getCurrentDataSource(): string {
    return 'pumpportal'
  }

  /**
   * 获取数据源状态
   */
  getDataSourceStatus(): {
    current: string
    pumpPortalConnected: boolean
  } {
    return {
      current: 'pumpportal',
      pumpPortalConnected: getPumpPortalAPI().isConnected()
    }
  }
}

// 导出单例实例
export const dataSourceManager = new DataSourceManager()
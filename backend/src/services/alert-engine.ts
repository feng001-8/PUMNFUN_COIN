import { Database } from '../database/mock-database.js'
import { AlertType } from '../../../shared/types/index.js'
import type { Alert, TokenInfo } from '../../../shared/types/index.ts'
import type { Server } from 'socket.io'

// 定义数据库查询结果的接口
interface TokenCandidate {
  address: string
  name: string
  symbol: string
  price_change_5m: number
  price_change_1h: number
  volume_24h: number
  volume_change: number
  liquidity: number
}

export class AlertEngine {
  private db: Database
  private isRunning: boolean = false
  
  constructor(db: Database) {
    this.db = db
  }

  async start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('🚨 预警引擎启动')
    
    // 每30秒检查预警条件
    setInterval(() => {
      this.checkAlertConditions()
    }, 30000)
  }

  async stop() {
    this.isRunning = false
    console.log('🛑 预警引擎停止')
  }

  private async checkAlertConditions() {
    try {
      console.log('🔍 检查预警条件...')
      
      // 检查金狗预警
      await this.checkGoldenDogAlerts()
      
      // 检查风险预警
      await this.checkRiskAlerts()
      
      // 检查异常交易预警
      await this.checkAbnormalTradingAlerts()
      
    } catch (error) {
      console.error('❌ 检查预警条件失败:', error)
    }
  }

  private async checkGoldenDogAlerts() {
    const db = this.db.getDb()
    
    try {
      // 查询符合金狗条件的代币
      const query = `
        SELECT 
          t.address, t.name, t.symbol,
          p.price_change_5m, p.price_change_1h,
          td.volume_24h, td.volume_change, td.liquidity
        FROM tokens t
        LEFT JOIN price_data p ON t.address = p.token_address
        LEFT JOIN trading_data td ON t.address = td.token_address
        WHERE t.is_active = 1
          AND p.timestamp > datetime('now', '-10 minutes')
          AND td.timestamp > datetime('now', '-10 minutes')
          AND p.price_change_5m > 50  -- 5分钟涨幅 > 50%
          AND td.volume_change > 300  -- 交易量增长 > 300%
          AND td.liquidity > 10       -- 流动性 > 10 SOL
        ORDER BY p.price_change_5m DESC
      `
      
      const stmt = db.prepare(query)
      const candidates: TokenCandidate[] = stmt.all() as TokenCandidate[]
      
      for (const token of candidates) {
        await this.createGoldenDogAlert(token)
      }
      
    } catch (error) {
      console.error('❌ 检查金狗预警失败:', error)
    }
  }

  private async checkRiskAlerts() {
    // TODO: 实现风险预警检查
    console.log('🔍 检查风险预警...')
  }

  private async checkAbnormalTradingAlerts() {
    // TODO: 实现异常交易预警检查
    console.log('🔍 检查异常交易预警...')
  }

  private async createGoldenDogAlert(tokenData: TokenCandidate) {
    const alert: Alert = {
      id: `golden_dog_${tokenData.address}_${Date.now()}`,
      tokenAddress: tokenData.address,
      type: AlertType.SUPER_GOLDEN_DOG,
      title: `🔥 金狗预警: ${tokenData.symbol}`,
      message: `${tokenData.name} (${tokenData.symbol}) 检测到金狗信号！\n` +
               `5分钟涨幅: ${tokenData.price_change_5m?.toFixed(2)}%\n` +
               `交易量增长: ${tokenData.volume_change?.toFixed(2)}%\n` +
               `当前流动性: ${tokenData.liquidity?.toFixed(2)} SOL`,
      score: this.calculateGoldenDogScore(tokenData),
      conditions: [
        `5分钟涨幅: ${tokenData.price_change_5m?.toFixed(2)}%`,
        `交易量增长: ${tokenData.volume_change?.toFixed(2)}%`,
        `流动性: ${tokenData.liquidity?.toFixed(2)} SOL`
      ],
      timestamp: new Date(),
      isRead: false
    }

    await this.saveAlert(alert)
    await this.broadcastAlert(alert)
  }

  private calculateGoldenDogScore(tokenData: TokenCandidate): number {
    let score = 0
    
    // 价格涨幅评分 (0-40分)
    if (tokenData.price_change_5m > 100) score += 40
    else if (tokenData.price_change_5m > 50) score += 30
    else score += 20
    
    // 交易量增长评分 (0-30分)
    if (tokenData.volume_change > 500) score += 30
    else if (tokenData.volume_change > 300) score += 20
    else score += 10
    
    // 流动性评分 (0-30分)
    if (tokenData.liquidity > 50) score += 30
    else if (tokenData.liquidity > 20) score += 20
    else if (tokenData.liquidity > 10) score += 10
    
    return Math.min(score, 100)
  }

  private async saveAlert(alert: Alert) {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT INTO alerts (
          id, token_address, type, title, message, 
          score, conditions, timestamp, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        alert.id, alert.tokenAddress, alert.type, alert.title,
        alert.message, alert.score, JSON.stringify(alert.conditions),
        alert.timestamp.toISOString(), alert.isRead ? 1 : 0
      )
      
      console.log(`✅ 保存预警: ${alert.title}`)
    } catch (error) {
      console.error('❌ 保存预警失败:', error)
    }
  }

  private async broadcastAlert(alert: Alert) {
    try {
      // 通过Socket.io广播预警
      // 注意：这里需要延迟导入io实例，避免循环依赖
      const { io } = await import('../index.js')
      io.emit('new_alert', alert)
      console.log(`📡 广播预警: ${alert.title}`)
    } catch (error) {
      console.error('❌ 广播预警失败:', error)
    }
  }
}
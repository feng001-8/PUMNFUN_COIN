import { DatabaseManager } from '../database/schema.js'
import { logger } from '../utils/logger.js'
import { enhancedErrorHandler, ErrorType, ErrorSeverity } from '../utils/enhanced-error-handler.js'
import type { Server } from 'socket.io'

// 预警配置接口
export interface AlertConfig {
  id?: number
  userId: string
  name: string
  description?: string
  isActive: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  cooldownMinutes: number // 冷却时间，防止频繁预警
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  createdAt?: Date
  updatedAt?: Date
  lastTriggered?: Date
}

// 预警条件接口
export interface AlertCondition {
  type: 'price_change' | 'volume_spike' | 'sentiment_change' | 'kol_activity' | 'technical_indicator' | 'market_cap_change'
  operator: 'greater_than' | 'less_than' | 'equals' | 'between' | 'percentage_change'
  value: number | number[] // 单值或范围值
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '24h'
  tokenAddress?: string // 特定代币，为空则监控所有代币
  additionalParams?: Record<string, any>
}

// 预警动作接口
export interface AlertAction {
  type: 'notification' | 'email' | 'webhook' | 'auto_trade'
  config: Record<string, any>
  enabled: boolean
}

// 预警触发结果接口
export interface AlertTrigger {
  configId: number
  configName: string
  userId: string
  tokenAddress?: string
  tokenSymbol?: string
  conditionType: string
  currentValue: number
  thresholdValue: number | number[]
  message: string
  priority: string
  timestamp: Date
  data: Record<string, any>
}

export class AlertConfigService {
  private db: DatabaseManager
  private io?: Server
  private isRunning: boolean = false
  private monitoringInterval?: NodeJS.Timeout
  private activeConfigs: Map<number, AlertConfig> = new Map()
  
  constructor(db: DatabaseManager) {
    this.db = db
    logger.info('⚙️ 预警配置服务已初始化')
  }

  setSocketIO(io: Server): void {
    this.io = io
  }

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    
    try {
      // 加载活跃的预警配置
      await this.loadActiveConfigs()
      
      // 初始化一些默认预警配置
      await this.initializeDefaultConfigs()
      
      logger.info('⚙️ 预警配置服务启动完成')
      
      // 定期检查预警条件
      this.monitoringInterval = setInterval(() => {
        this.checkAlertConditions().catch(error => {
          enhancedErrorHandler.handleError(error, '预警条件检查定时任务')
        })
      }, 30000) // 每30秒检查一次
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        '预警配置服务启动'
      )
      throw error
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
    logger.info('🛑 预警配置服务停止')
  }

  // 创建预警配置
  async createAlertConfig(config: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered'>): Promise<number> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT INTO user_alert_configs (
          user_id, name, description, is_active, conditions, actions,
          cooldown_minutes, priority, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      const result = stmt.run(
        config.userId,
        config.name,
        config.description || '',
        config.isActive ? 1 : 0,
        JSON.stringify(config.conditions),
        JSON.stringify(config.actions),
        config.cooldownMinutes,
        config.priority,
        JSON.stringify(config.tags)
      )
      
      const configId = result.lastInsertRowid as number
      
      // 如果配置是活跃的，加载到内存中
      if (config.isActive) {
        const fullConfig = await this.getAlertConfig(configId)
        if (fullConfig) {
          this.activeConfigs.set(configId, fullConfig)
        }
      }
      
      logger.info(`✅ 创建预警配置: ${config.name} (ID: ${configId})`)
      
      return configId
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'createAlertConfig',
        { userId: config.userId, name: config.name }
      )
      throw error
    }
  }

  // 更新预警配置
  async updateAlertConfig(id: number, updates: Partial<AlertConfig>): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const setParts: string[] = []
      const values: any[] = []
      
      if (updates.name !== undefined) {
        setParts.push('name = ?')
        values.push(updates.name)
      }
      
      if (updates.description !== undefined) {
        setParts.push('description = ?')
        values.push(updates.description)
      }
      
      if (updates.isActive !== undefined) {
        setParts.push('is_active = ?')
        values.push(updates.isActive ? 1 : 0)
      }
      
      if (updates.conditions !== undefined) {
        setParts.push('conditions = ?')
        values.push(JSON.stringify(updates.conditions))
      }
      
      if (updates.actions !== undefined) {
        setParts.push('actions = ?')
        values.push(JSON.stringify(updates.actions))
      }
      
      if (updates.cooldownMinutes !== undefined) {
        setParts.push('cooldown_minutes = ?')
        values.push(updates.cooldownMinutes)
      }
      
      if (updates.priority !== undefined) {
        setParts.push('priority = ?')
        values.push(updates.priority)
      }
      
      if (updates.tags !== undefined) {
        setParts.push('tags = ?')
        values.push(JSON.stringify(updates.tags))
      }
      
      if (setParts.length === 0) return
      
      setParts.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      
      const stmt = db.prepare(`
        UPDATE user_alert_configs 
        SET ${setParts.join(', ')}
        WHERE id = ?
      `)
      
      stmt.run(...values)
      
      // 更新内存中的配置
      if (updates.isActive === false) {
        this.activeConfigs.delete(id)
      } else {
        const updatedConfig = await this.getAlertConfig(id)
        if (updatedConfig && updatedConfig.isActive) {
          this.activeConfigs.set(id, updatedConfig)
        }
      }
      
      logger.info(`📝 更新预警配置: ID ${id}`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'updateAlertConfig',
        { id }
      )
      throw error
    }
  }

  // 删除预警配置
  async deleteAlertConfig(id: number): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare('DELETE FROM user_alert_configs WHERE id = ?')
      stmt.run(id)
      
      // 从内存中移除
      this.activeConfigs.delete(id)
      
      logger.info(`🗑️ 删除预警配置: ID ${id}`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'deleteAlertConfig',
        { id }
      )
      throw error
    }
  }

  // 获取预警配置
  async getAlertConfig(id: number): Promise<AlertConfig | null> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare('SELECT * FROM user_alert_configs WHERE id = ?')
      const row = stmt.get(id) as any
      
      if (!row) return null
      
      return this.mapRowToConfig(row)
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'getAlertConfig',
        { id }
      )
      return null
    }
  }

  // 获取用户的预警配置列表
  async getUserAlertConfigs(userId: string): Promise<AlertConfig[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM user_alert_configs 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `)
      
      const rows = stmt.all(userId) as any[]
      
      return rows.map(row => this.mapRowToConfig(row))
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'getUserAlertConfigs',
        { userId }
      )
      return []
    }
  }

  // 检查预警条件
  private async checkAlertConditions(): Promise<void> {
    try {
      for (const [configId, config] of this.activeConfigs) {
        // 检查冷却时间
        if (config.lastTriggered) {
          const cooldownMs = config.cooldownMinutes * 60 * 1000
          const timeSinceLastTrigger = Date.now() - config.lastTriggered.getTime()
          if (timeSinceLastTrigger < cooldownMs) {
            continue // 还在冷却期内
          }
        }
        
        // 检查每个条件
        for (const condition of config.conditions) {
          const triggered = await this.evaluateCondition(condition)
          if (triggered) {
            await this.triggerAlert(config, condition, triggered)
            break // 一个配置只触发一次
          }
        }
      }
      
      logger.debug('⚙️ 预警条件检查完成')
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'checkAlertConditions'
      )
    }
  }

  // 评估单个条件
  private async evaluateCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    try {
      switch (condition.type) {
        case 'price_change':
          return await this.evaluatePriceChangeCondition(condition)
        case 'volume_spike':
          return await this.evaluateVolumeSpikeCondition(condition)
        case 'sentiment_change':
          return await this.evaluateSentimentChangeCondition(condition)
        case 'kol_activity':
          return await this.evaluateKOLActivityCondition(condition)
        case 'technical_indicator':
          return await this.evaluateTechnicalIndicatorCondition(condition)
        case 'market_cap_change':
          return await this.evaluateMarketCapChangeCondition(condition)
        default:
          logger.warn(`未知的预警条件类型: ${condition.type}`)
          return null
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'evaluateCondition',
        { conditionType: condition.type }
      )
      return null
    }
  }

  // 评估价格变化条件
  private async evaluatePriceChangeCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    const db = this.db.getDb()
    
    try {
      // 构建查询条件
      let whereClause = ''
      let params: any[] = []
      
      if (condition.tokenAddress) {
        whereClause = 'WHERE token_address = ?'
        params.push(condition.tokenAddress)
      }
      
      // 获取指定时间范围内的价格数据
      const timeframeMap = {
        '1m': '1 minute',
        '5m': '5 minutes',
        '15m': '15 minutes',
        '1h': '1 hour',
        '4h': '4 hours',
        '24h': '24 hours'
      }
      
      const timeframe = timeframeMap[condition.timeframe] || '1 hour'
      
      const stmt = db.prepare(`
        SELECT 
          token_address,
          price,
          timestamp,
          LAG(price) OVER (PARTITION BY token_address ORDER BY timestamp) as prev_price
        FROM price_data 
        ${whereClause}
        AND timestamp > datetime('now', '-${timeframe}')
        ORDER BY timestamp DESC
        LIMIT 100
      `)
      
      const rows = stmt.all(...params) as any[]
      
      for (const row of rows) {
        if (!row.prev_price) continue
        
        const currentPrice = row.price
        const previousPrice = row.prev_price
        const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100
        
        let triggered = false
        
        switch (condition.operator) {
          case 'greater_than':
            triggered = changePercent > (Array.isArray(condition.value) ? condition.value[0] : condition.value)
            break
          case 'less_than':
            triggered = changePercent < (Array.isArray(condition.value) ? condition.value[0] : condition.value)
            break
          case 'percentage_change':
            const thresholdValue = Array.isArray(condition.value) ? condition.value[0] : condition.value
            triggered = Math.abs(changePercent) > Math.abs(thresholdValue)
            break
        }
        
        if (triggered) {
          const tokenInfo = await this.getTokenInfo(row.token_address)
          return {
            configId: 0, // 将在调用处设置
            configName: '',
            userId: '',
            tokenAddress: row.token_address,
            tokenSymbol: tokenInfo?.symbol || 'Unknown',
            conditionType: 'price_change',
            currentValue: changePercent,
            thresholdValue: condition.value,
            message: `${tokenInfo?.symbol || 'Token'} 价格变化 ${changePercent.toFixed(2)}%`,
            priority: 'medium',
            timestamp: new Date(),
            data: {
              currentPrice,
              previousPrice,
              changePercent,
              timeframe: condition.timeframe
            }
          }
        }
      }
      
      return null
    } catch (error) {
      logger.error('评估价格变化条件失败:', error)
      return null
    }
  }

  // 评估交易量激增条件
  private async evaluateVolumeSpikeCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    const db = this.db.getDb()
    
    try {
      const timeframeMap: Record<string, string> = {
        '1m': '1 minute',
        '5m': '5 minutes',
        '15m': '15 minutes',
        '1h': '1 hour',
        '4h': '4 hours',
        '24h': '24 hours'
      }
      
      const timeframe = timeframeMap[condition.timeframe] || '1 hour'
      
      let whereClause = ''
      let params: any[] = []
      
      if (condition.tokenAddress) {
        whereClause = 'AND token_address = ?'
        params.push(condition.tokenAddress)
      }
      
      const stmt = db.prepare(`
        SELECT 
          token_address,
          AVG(volume) as avg_volume,
          MAX(volume) as max_volume
        FROM trading_data 
        WHERE timestamp > datetime('now', '-${timeframe}') ${whereClause}
        GROUP BY token_address
        HAVING max_volume > avg_volume * ?
      `)
      
      const thresholdValue = Array.isArray(condition.value) ? condition.value[0] : condition.value
      params.push(thresholdValue) // 倍数阈值
      const rows = stmt.all(...params) as any[]
      
      for (const row of rows) {
        const spikeRatio = row.max_volume / row.avg_volume
        
        if (spikeRatio > thresholdValue) {
          const tokenInfo = await this.getTokenInfo(row.token_address)
          return {
            configId: 0,
            configName: '',
            userId: '',
            tokenAddress: row.token_address,
            tokenSymbol: tokenInfo?.symbol || 'Unknown',
            conditionType: 'volume_spike',
            currentValue: spikeRatio,
            thresholdValue: condition.value,
            message: `${tokenInfo?.symbol || 'Token'} 交易量激增 ${spikeRatio.toFixed(2)}x`,
            priority: 'high',
            timestamp: new Date(),
            data: {
              avgVolume: row.avg_volume,
              maxVolume: row.max_volume,
              spikeRatio,
              timeframe: condition.timeframe
            }
          }
        }
      }
      
      return null
    } catch (error) {
      logger.error('评估交易量激增条件失败:', error)
      return null
    }
  }

  // 评估情绪变化条件（简化实现）
  private async evaluateSentimentChangeCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    // 这里可以集成情绪分析服务的数据
    // 暂时返回null，实际实现需要查询sentiment_data表
    return null
  }

  // 评估KOL活动条件（简化实现）
  private async evaluateKOLActivityCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    // 这里可以集成KOL追踪服务的数据
    // 暂时返回null，实际实现需要查询kol_transactions表
    return null
  }

  // 评估技术指标条件（简化实现）
  private async evaluateTechnicalIndicatorCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    // 这里可以集成技术指标计算
    // 暂时返回null，实际实现需要查询technical_indicators表
    return null
  }

  // 评估市值变化条件（简化实现）
  private async evaluateMarketCapChangeCondition(condition: AlertCondition): Promise<AlertTrigger | null> {
    // 这里可以基于价格和供应量计算市值变化
    // 暂时返回null
    return null
  }

  // 触发预警
  private async triggerAlert(config: AlertConfig, condition: AlertCondition, trigger: AlertTrigger): Promise<void> {
    try {
      // 更新触发信息
      trigger.configId = config.id!
      trigger.configName = config.name
      trigger.userId = config.userId
      trigger.priority = config.priority
      
      // 执行预警动作
      for (const action of config.actions) {
        if (action.enabled) {
          await this.executeAlertAction(action, trigger)
        }
      }
      
      // 更新最后触发时间
      await this.updateLastTriggered(config.id!)
      
      // 记录预警到数据库
      await this.recordAlert(trigger)
      
      logger.info(`🚨 触发预警: ${config.name} - ${trigger.message}`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'triggerAlert',
        { configId: config.id, configName: config.name }
      )
    }
  }

  // 执行预警动作
  private async executeAlertAction(action: AlertAction, trigger: AlertTrigger): Promise<void> {
    try {
      switch (action.type) {
        case 'notification':
          // 发送实时通知
          if (this.io) {
            this.io.emit('alert_notification', {
              id: Date.now(),
              type: trigger.conditionType,
              message: trigger.message,
              tokenAddress: trigger.tokenAddress,
              tokenSymbol: trigger.tokenSymbol,
              priority: trigger.priority,
              timestamp: trigger.timestamp,
              data: trigger.data
            })
          }
          break
          
        case 'email':
          // 发送邮件（需要实现邮件服务）
          logger.info(`📧 邮件预警: ${trigger.message}`)
          break
          
        case 'webhook':
          // 调用Webhook（需要实现HTTP客户端）
          logger.info(`🔗 Webhook预警: ${trigger.message}`)
          break
          
        case 'auto_trade':
          // 自动交易（需要实现交易接口）
          logger.info(`🤖 自动交易预警: ${trigger.message}`)
          break
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'executeAlertAction',
        { actionType: action.type }
      )
    }
  }

  // 更新最后触发时间
  private async updateLastTriggered(configId: number): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        UPDATE user_alert_configs 
        SET last_triggered = CURRENT_TIMESTAMP 
        WHERE id = ?
      `)
      
      stmt.run(configId)
      
      // 更新内存中的配置
      const config = this.activeConfigs.get(configId)
      if (config) {
        config.lastTriggered = new Date()
      }
    } catch (error) {
      logger.error('更新最后触发时间失败:', error)
    }
  }

  // 记录预警到数据库
  private async recordAlert(trigger: AlertTrigger): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT INTO alerts (
          token_address, type, message, severity, data, is_read
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        trigger.tokenAddress || '',
        trigger.conditionType,
        trigger.message,
        trigger.priority,
        JSON.stringify(trigger.data),
        0
      )
    } catch (error) {
      logger.error('记录预警失败:', error)
    }
  }

  // 加载活跃的预警配置
  private async loadActiveConfigs(): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM user_alert_configs WHERE is_active = 1
      `)
      
      const rows = stmt.all() as any[]
      this.activeConfigs.clear()
      
      rows.forEach(row => {
        const config = this.mapRowToConfig(row)
        this.activeConfigs.set(config.id!, config)
      })
      
      logger.info(`📋 加载了 ${this.activeConfigs.size} 个活跃预警配置`)
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'loadActiveConfigs'
      )
    }
  }

  // 初始化默认预警配置
  private async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs: Omit<AlertConfig, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggered'>[] = [
      {
        userId: 'system',
        name: '价格急剧上涨预警',
        description: '当代币价格在1小时内上涨超过50%时触发',
        isActive: true,
        conditions: [{
          type: 'price_change',
          operator: 'greater_than',
          value: 50,
          timeframe: '1h'
        }],
        actions: [{
          type: 'notification',
          config: {},
          enabled: true
        }],
        cooldownMinutes: 60,
        priority: 'high',
        tags: ['price', 'pump']
      },
      {
        userId: 'system',
        name: '交易量异常激增预警',
        description: '当代币交易量超过平均值5倍时触发',
        isActive: true,
        conditions: [{
          type: 'volume_spike',
          operator: 'greater_than',
          value: 5,
          timeframe: '1h'
        }],
        actions: [{
          type: 'notification',
          config: {},
          enabled: true
        }],
        cooldownMinutes: 30,
        priority: 'medium',
        tags: ['volume', 'activity']
      }
    ]
    
    for (const config of defaultConfigs) {
      try {
        // 检查是否已存在同名配置
        const existing = await this.getUserAlertConfigs(config.userId)
        const exists = existing.some(c => c.name === config.name)
        
        if (!exists) {
          await this.createAlertConfig(config)
        }
      } catch (error) {
        logger.debug(`跳过已存在的预警配置: ${config.name}`)
      }
    }
  }

  // 映射数据库行到配置对象
  private mapRowToConfig(row: any): AlertConfig {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      isActive: row.is_active === 1,
      conditions: JSON.parse(row.conditions || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      cooldownMinutes: row.cooldown_minutes,
      priority: row.priority,
      tags: JSON.parse(row.tags || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastTriggered: row.last_triggered ? new Date(row.last_triggered) : undefined
    }
  }

  // 获取代币信息
  private async getTokenInfo(tokenAddress: string): Promise<{ symbol: string; name: string } | null> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT symbol, name FROM tokens WHERE address = ?
      `)
      
      const row = stmt.get(tokenAddress) as any
      return row ? { symbol: row.symbol, name: row.name } : null
    } catch (error) {
      return null
    }
  }
}
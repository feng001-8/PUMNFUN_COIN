import Fastify from 'fastify'
import { Server } from 'socket.io'
import { DatabaseManager } from './database/schema.js'
import { DataSourceManager } from './services/data-source-manager.js'
import { AlertEngine } from './services/alert-engine.js'
import { KOLTracker } from './services/kol-tracker.js'
import { SentimentAnalyzer } from './services/sentiment-analyzer.js'
import { AlertConfigService } from './services/alert-config.js'
import { SmartAnalyzer } from './services/smart-analyzer.js'
import { TwitterAPIService } from './services/twitter-api.js'
import { TokenMappingService } from './services/token-mapping.js'
import { PriceCalculator } from './services/price-calculator.js'
import { registerRoutes } from './api/routes.js'
import { logger } from './utils/logger.js'
import { enhancedErrorHandler } from './utils/enhanced-error-handler.js'
import { environment } from './config/environment.js'
import { initializePumpPortalAPI } from './services/pumpportal-api.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
})

// 注册CORS
fastify.register(import('@fastify/cors'), {
  origin: environment.cors.origins,
  credentials: true
})

// 注册静态文件服务
fastify.register(import('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/'
})

// 初始化数据库
const db = new DatabaseManager()

// 初始化服务
const dataSourceManager = new DataSourceManager()
const alertService = new AlertEngine(db)
const kolTracker = new KOLTracker(db)
const sentimentAnalyzer = new SentimentAnalyzer(db)
const alertConfigService = new AlertConfigService(db)
const smartAnalyzer = new SmartAnalyzer(db)
const tokenMapping = new TokenMappingService(db)
const priceCalculator = new PriceCalculator(db)

// 初始化Twitter API服务（如果配置了）
let twitterService: TwitterAPIService | null = null
if (environment.twitter?.bearerToken) {
  twitterService = new TwitterAPIService(
    {
      bearerToken: environment.twitter.bearerToken,
      apiKey: environment.twitter.apiKey,
      apiSecret: environment.twitter.apiSecret,
      accessToken: environment.twitter.accessToken,
      accessSecret: environment.twitter.accessSecret
    },
    db,
    sentimentAnalyzer,
    tokenMapping
  )
}

// 监控界面路由
fastify.register(async function (fastify) {
  fastify.get('/monitoring', async (request, reply) => {
    return reply.sendFile('monitoring.html')
  })
})

// Socket.io 设置
const io = new Server(fastify.server, {
  cors: {
    origin: environment.socket.corsOrigins,
    credentials: true
  }
})

// Socket.io 连接处理
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`)
  })
  
  // 发送实时数据
  socket.on('subscribe_token', (tokenAddress: string) => {
    logger.info(`📡 Client subscribed to token: ${tokenAddress}`)
    socket.join(`token:${tokenAddress}`)
  })
  
  socket.on('unsubscribe_token', (tokenAddress: string) => {
    logger.info(`📡 Client unsubscribed from token: ${tokenAddress}`)
    socket.leave(`token:${tokenAddress}`)
  })
  
  // 订阅预警
  socket.on('subscribe_alerts', () => {
    logger.info(`🚨 Client subscribed to alerts: ${socket.id}`)
    socket.join('alerts')
  })
  
  // 发送错误统计
  socket.emit('error_stats', enhancedErrorHandler.getErrorStats())
})

// 启动服务器
const start = async () => {
  try {
    // 打印配置信息
    const { printConfig } = await import('./config/environment.js')
    printConfig()
    
    // 注册API路由
    const { registerRoutes } = await import('./api/routes.js')
    await registerRoutes(fastify, db, twitterService)
    
    await fastify.listen({ port: environment.server.port, host: '0.0.0.0' })
    logger.info('🚀 PumpFun Golden Dog Alert System Backend Started')
    logger.info(`📡 Server: http://localhost:${environment.server.port}`)
    logger.info('🔌 Socket.io Ready')
    
    // 设置Socket.io实例到错误处理器
    enhancedErrorHandler.setSocketIO(io)
    
    // 设置Socket.IO
    dataSourceManager.setSocketIO(io)
    alertService.setSocketIO(io)
    kolTracker.setSocketIO(io)
    sentimentAnalyzer.setSocketIO(io)
    alertConfigService.setSocketIO(io)
    smartAnalyzer.setSocketIO(io)
    
    if (twitterService) {
      twitterService.setSocketIO(io)
    }
    
    // 设置服务依赖关系
    smartAnalyzer.setKOLTracker(kolTracker)
    smartAnalyzer.setSentimentAnalyzer(sentimentAnalyzer)
    
    // 初始化PumpPortal API
    logger.info('🔌 初始化PumpPortal API...')
    initializePumpPortalAPI(db)
    
    // 启动数据源管理器
    logger.info('🔄 启动数据源管理器...')
    await dataSourceManager.start()
    
    // 启动预警服务
    logger.info('🚨 启动预警服务...')
    await alertService.start()
    
    // 启动KOL追踪服务
    logger.info('🎯 启动KOL追踪服务...')
    await kolTracker.start()
    
    // 启动情绪分析服务
    logger.info('📊 启动情绪分析服务...')
    await sentimentAnalyzer.start()
    
    // 启动预警配置服务
    logger.info('⚙️ 启动预警配置服务...')
    await alertConfigService.start()
    
    // 启动代币映射服务
    logger.info('🗺️ 启动代币映射服务...')
    await tokenMapping.start()
    
    // 启动价格计算服务
    logger.info('💰 启动价格计算服务...')
    await priceCalculator.start()
    
    // 启动Twitter API服务（如果配置了）
    if (twitterService) {
      logger.info('🐦 启动Twitter API服务...')
      await twitterService.start()
    } else {
      logger.warn('⚠️ Twitter API未配置，跳过Twitter数据收集')
    }
    
    // 启动智能分析引擎
    logger.info('🧠 启动智能分析引擎...')
    await smartAnalyzer.start()
    
    // 监听新代币事件并写入数据库
    dataSourceManager.onNewToken(async (token) => {
      try {
        const dbInstance = db.getDb()
        const stmt = dbInstance.prepare(`
          INSERT OR REPLACE INTO tokens (
            address, name, symbol, decimals, total_supply,
            created_at, creator_address, initial_liquidity,
            social_links, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        
        stmt.run(
          token.address,
          token.name,
          token.symbol,
          token.decimals || 6,
          token.totalSupply || '1000000000',
          token.createdTimestamp || new Date().toISOString(),
          token.creator || '',
          token.initialLiquidity || 0,
          JSON.stringify({
            twitter: token.twitter || '',
            telegram: token.telegram || '',
            website: token.website || ''
          }),
          1
        )
        
        logger.info(`✅ 新代币已保存到数据库: ${token.symbol} (${token.address})`)
        
        // 通过Socket.io广播新代币
        io.emit('new_token', token)
      } catch (error) {
        logger.error('❌ 保存新代币到数据库失败:', error)
      }
    })
    
    // 监听交易事件并更新价格数据
    dataSourceManager.onTrade(async (trade) => {
      try {
        // 使用价格计算服务更新价格数据
        const pricePerToken = trade.tokenAmount > 0 ? trade.solAmount / trade.tokenAmount : 0
        await priceCalculator.updatePrice(trade.mint, pricePerToken)
        
        // 通过Socket.io广播交易数据
        io.to(`token:${trade.mint}`).emit('trade_update', trade)
      } catch (error) {
        logger.error('❌ 处理交易事件失败:', error)
      }
    })
    
    // 启动预警引擎
    logger.info('🔄 启动预警引擎...')
    const { AlertEngine } = await import('./services/alert-engine.js')
    
    const alertEngine = new AlertEngine(db)
    
    await alertEngine.start()
    
    // 定期发送错误统计
    setInterval(() => {
      io.emit('error_stats', enhancedErrorHandler.getErrorStats())
    }, environment.monitoring.checkAlertsInterval)
    
    logger.info('✅ 所有服务已启动完成')
  } catch (err) {
    await enhancedErrorHandler.handleError(
      err as Error,
      'start'
    )
    process.exit(1)
  }
}

// 优雅关闭
const gracefulShutdown = async () => {
  logger.info('🛑 正在优雅关闭服务器...')
  
  try {
    // 停止智能分析引擎
    await smartAnalyzer.stop()
    
    // 停止价格计算服务
    await priceCalculator.stop()
    
    // 停止Twitter API服务
    if (twitterService) {
      await twitterService.stop()
    }
    
    // 停止预警配置服务
    await alertConfigService.stop()
    
    // 停止情绪分析服务
    await sentimentAnalyzer.stop()
    
    // 停止KOL追踪服务
    await kolTracker.stop()
    
    // 停止预警服务
    await alertService.stop()
    
    // 停止数据源管理器
    await dataSourceManager.stop()
    
    // 关闭数据库连接
    await db.close()
    
    // 关闭服务器
    await fastify.close()
    
    logger.info('✅ 服务器已优雅关闭')
    process.exit(0)
  } catch (error) {
    logger.error('❌ 关闭服务器时发生错误:', error)
    process.exit(1)
  }
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

start()

// 导出实例供其他模块使用
export { fastify, db, io }

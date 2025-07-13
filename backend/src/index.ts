import Fastify from 'fastify'
import { Server } from 'socket.io'
import { Database } from './database/mock-database.js'
import { registerRoutes } from './api/routes.js'

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
  origin: ['http://localhost:5173', 'http://192.168.1.30:5173'],
  credentials: true
})

// 初始化数据库
const db = new Database()

// 注册路由
fastify.register(async function (fastify) {
  await registerRoutes(fastify, db)
})

// Socket.io 设置
const io = new Server(fastify.server, {
  cors: {
    origin: ['http://localhost:5173', 'http://192.168.1.30:5173'],
    credentials: true
  }
})

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id)
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id)
  })
  
  // 发送实时数据
  socket.on('subscribe_token', (tokenAddress: string) => {
    console.log(`📡 Client subscribed to token: ${tokenAddress}`)
    socket.join(`token:${tokenAddress}`)
  })
  
  socket.on('unsubscribe_token', (tokenAddress: string) => {
    console.log(`📡 Client unsubscribed from token: ${tokenAddress}`)
    socket.leave(`token:${tokenAddress}`)
  })
  
  // 订阅预警
  socket.on('subscribe_alerts', () => {
    console.log(`🚨 Client subscribed to alerts: ${socket.id}`)
    socket.join('alerts')
  })
})

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🚀 PumpFun Golden Dog Alert System Backend Started')
    console.log('📡 Server: http://localhost:3000')
    console.log('🔌 Socket.io Ready')
    
    // 延迟导入服务，避免循环依赖
    const { PumpFunCollector } = await import('./services/pumpfun-collector.js')
    const { AlertEngine } = await import('./services/alert-engine.js')
    
    // 初始化服务
    const pumpfunCollector = new PumpFunCollector(db)
    const alertEngine = new AlertEngine(db)
    
    // 启动数据采集和预警服务
    await pumpfunCollector.start()
    await alertEngine.start()
    
    console.log('✅ 所有服务已启动')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await db.close()
  await fastify.close()
  process.exit(0)
})

start()

// 导出io实例供其他模块使用
export { io }

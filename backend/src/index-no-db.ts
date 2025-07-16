import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
})

// 注册 CORS
await fastify.register(cors, {
  origin: true
})

// 模拟数据
const mockTokens = [
  {
    address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    name: 'Popcat',
    symbol: 'POPCAT',
    decimals: 6,
    total_supply: '979618924.612374',
    created_at: '2024-01-15T10:30:00Z',
    creator_address: 'ABC123...',
    initial_liquidity: 50000,
    social_links: JSON.stringify({
      twitter: 'https://twitter.com/popcat',
      telegram: 'https://t.me/popcat'
    }),
    is_active: true,
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    address: '8GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    name: 'Dogwifhat',
    symbol: 'WIF',
    decimals: 6,
    total_supply: '998926393.727829',
    created_at: '2024-01-16T14:20:00Z',
    creator_address: 'DEF456...',
    initial_liquidity: 75000,
    social_links: JSON.stringify({
      twitter: 'https://twitter.com/dogwifhat',
      website: 'https://dogwifhat.com'
    }),
    is_active: true,
    updated_at: '2024-01-16T14:20:00Z'
  }
]

const mockPriceData: Record<string, {
  price: number;
  price_change_1m: number;
  price_change_5m: number;
  price_change_15m: number;
  price_change_1h: number;
  price_change_24h: number;
}> = {
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': {
    price: 1.45,
    price_change_1m: 2.3,
    price_change_5m: -1.2,
    price_change_15m: 5.7,
    price_change_1h: -3.4,
    price_change_24h: 12.8
  },
  '8GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': {
    price: 2.87,
    price_change_1m: -0.8,
    price_change_5m: 3.2,
    price_change_15m: -2.1,
    price_change_1h: 8.9,
    price_change_24h: -5.6
  }
}

const mockAlerts = [
  {
    id: 'alert-001',
    token_address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    type: 'price_spike',
    title: '价格异动警告',
    message: 'POPCAT 价格在过去15分钟内上涨了5.7%',
    score: 75,
    conditions: JSON.stringify({ price_change_15m: 5.7 }),
    timestamp: new Date().toISOString(),
    is_read: false
  },
  {
    id: 'alert-002',
    token_address: '8GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    type: 'volume_spike',
    title: '成交量异动',
    message: 'WIF 成交量在过去1小时内增长了150%',
    score: 85,
    conditions: JSON.stringify({ volume_change_1h: 150 }),
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    is_read: false
  }
]

// API 路由

// 获取代币列表
fastify.get('/api/tokens', async (request, reply) => {
  return { tokens: mockTokens }
})

// 获取特定代币价格
fastify.get('/api/tokens/:address/price', async (request, reply) => {
  const { address } = request.params as { address: string }
  const priceData = mockPriceData[address]
  
  if (!priceData) {
    return reply.code(404).send({ error: 'Token not found' })
  }
  
  return {
    token_address: address,
    ...priceData,
    timestamp: new Date().toISOString()
  }
})

// 获取市场统计
fastify.get('/api/stats', async (request, reply) => {
  return {
    total_tokens: mockTokens.length,
    total_volume_24h: 1250000,
    total_market_cap: 45000000,
    active_traders: 1250,
    price_change_24h: 8.5
  }
})

// 获取预警列表
fastify.get('/api/alerts', async (request, reply) => {
  return { alerts: mockAlerts }
})

// 标记预警为已读
fastify.post('/api/alerts/:alertId/read', async (request, reply) => {
  const { alertId } = request.params as { alertId: string }
  const alert = mockAlerts.find(a => a.id === alertId)
  
  if (!alert) {
    return reply.code(404).send({ error: 'Alert not found' })
  }
  
  alert.is_read = true
  return { success: true }
})

// 系统健康检查
fastify.get('/api/monitoring/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: [
      { name: 'API Server', status: 'running', uptime: '2h 15m' },
      { name: 'Data Collector', status: 'running', uptime: '2h 10m' },
      { name: 'Alert Engine', status: 'running', uptime: '2h 12m' }
    ],
    metrics: {
      cpu_usage: 25.5,
      memory_usage: 68.2,
      disk_usage: 45.8,
      network_io: 12.3
    },
    api_endpoints: [
      { endpoint: '/api/tokens', status: 'healthy', response_time: 45 },
      { endpoint: '/api/alerts', status: 'healthy', response_time: 32 },
      { endpoint: '/api/stats', status: 'healthy', response_time: 28 }
    ]
  }
})

// 健康检查
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// 启动服务器
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
    const host = process.env.HOST || '0.0.0.0'
    
    await fastify.listen({ port, host })
    console.log(`🚀 Server is running on http://${host}:${port}`)
    console.log(`📊 API endpoints available:`)
    console.log(`   - GET  /api/tokens`)
    console.log(`   - GET  /api/tokens/:address/price`)
    console.log(`   - GET  /api/stats`)
    console.log(`   - GET  /api/alerts`)
    console.log(`   - POST /api/alerts/:alertId/read`)
    console.log(`   - GET  /api/monitoring/health`)
    console.log(`   - GET  /health`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
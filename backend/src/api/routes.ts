import { FastifyInstance } from 'fastify'
import { Database } from '../database/mock-database.js'

export async function registerRoutes(fastify: FastifyInstance, db: Database) {
  // 健康检查
  fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // 获取所有代币
  fastify.get('/api/tokens', async (request, reply) => {
    // TODO: 实现代币列表查询
    return { tokens: [] }
  })

  // 获取代币详情
  fastify.get('/api/tokens/:address', async (request, reply) => {
    const { address } = request.params as { address: string }
    // TODO: 实现代币详情查询
    return { token: null }
  })

  // 获取价格数据
  fastify.get('/api/tokens/:address/price', async (request, reply) => {
    const { address } = request.params as { address: string }
    // TODO: 实现价格数据查询
    return { priceData: [] }
  })

  // 获取交易数据
  fastify.get('/api/tokens/:address/trading', async (request, reply) => {
    const { address } = request.params as { address: string }
    // TODO: 实现交易数据查询
    return { tradingData: [] }
  })

  // 获取预警列表
  fastify.get('/api/alerts', async (request, reply) => {
    // TODO: 实现预警列表查询
    return { alerts: [] }
  })

  // 获取KOL列表
  fastify.get('/api/kols', async (request, reply) => {
    // TODO: 实现KOL列表查询
    return { kols: [] }
  })

  // 获取KOL交易记录
  fastify.get('/api/kols/:address/transactions', async (request, reply) => {
    const { address } = request.params as { address: string }
    // TODO: 实现KOL交易记录查询
    return { transactions: [] }
  })
}
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { TwitterAPIService } from '../services/twitter-api.js'
import { logger } from '../utils/logger.js'

// Twitter API路由
export async function twitterRoutes(fastify: FastifyInstance, twitterService: TwitterAPIService | null) {
  // 获取Twitter情绪统计
  fastify.get('/api/twitter/sentiment/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!twitterService) {
        return reply.code(503).send({
          success: false,
          error: 'Twitter API服务未启用'
        })
      }

      const stats = await twitterService.getTwitterSentimentStats()
      
      reply.send({
        success: true,
        data: stats
      })
    } catch (error) {
      logger.error('获取Twitter情绪统计失败:', error)
      reply.code(500).send({
        success: false,
        error: '获取Twitter情绪统计失败'
      })
    }
  })

  // 获取特定代币的Twitter情绪数据
  fastify.get('/api/twitter/sentiment/:tokenAddress', async (request: FastifyRequest<{
    Params: { tokenAddress: string }
    Querystring: { limit?: string; hours?: string }
  }>, reply: FastifyReply) => {
    try {
      if (!twitterService) {
        return reply.code(503).send({
          success: false,
          error: 'Twitter API服务未启用'
        })
      }

      const { tokenAddress } = request.params
      const limit = parseInt(request.query.limit || '50')
      const hours = parseInt(request.query.hours || '24')
      
      // 这里需要在TwitterAPIService中添加获取特定代币情绪数据的方法
      // const sentimentData = await twitterService.getTokenSentimentData(tokenAddress, limit, hours)
      
      reply.send({
        success: true,
        data: {
          tokenAddress,
          limit,
          hours,
          message: '此功能正在开发中'
        }
      })
    } catch (error) {
      logger.error('获取代币Twitter情绪数据失败:', error)
      reply.code(500).send({
        success: false,
        error: '获取代币Twitter情绪数据失败'
      })
    }
  })

  // 获取Twitter影响者列表
  fastify.get('/api/twitter/influencers', async (request: FastifyRequest<{
    Querystring: { limit?: string; category?: string }
  }>, reply: FastifyReply) => {
    try {
      if (!twitterService) {
        return reply.code(503).send({
          success: false,
          error: 'Twitter API服务未启用'
        })
      }

      const limit = parseInt(request.query.limit || '20')
      const category = request.query.category
      
      const influencers = await twitterService.getStoredInfluencersList()
      
      // 根据类别过滤
      let filteredInfluencers = influencers
      if (category) {
        filteredInfluencers = influencers.filter(inf => inf.category === category)
      }
      
      // 限制数量
      const limitedInfluencers = filteredInfluencers.slice(0, limit)
      
      reply.send({
        success: true,
        data: {
          influencers: limitedInfluencers,
          total: filteredInfluencers.length,
          categories: [...new Set(influencers.map(inf => inf.category))]
        }
      })
    } catch (error) {
      logger.error('获取Twitter影响者列表失败:', error)
      reply.code(500).send({
        success: false,
        error: '获取Twitter影响者列表失败'
      })
    }
  })

  // 添加新的影响者
  fastify.post('/api/twitter/influencers', async (request: FastifyRequest<{
    Body: {
      username: string
      category?: string
      description?: string
    }
  }>, reply: FastifyReply) => {
    try {
      if (!twitterService) {
        return reply.code(503).send({
          success: false,
          error: 'Twitter API服务未启用'
        })
      }

      const { username, category, description } = request.body
      
      if (!username) {
        return reply.code(400).send({
          success: false,
          error: '用户名不能为空'
        })
      }
      
      await twitterService.addInfluencerPublic({
        username: username.replace('@', ''), // 移除@符号
        category: category || 'crypto',
        description: description || ''
      })
      
      reply.send({
        success: true,
        message: '影响者添加成功'
      })
    } catch (error) {
      logger.error('添加Twitter影响者失败:', error)
      reply.code(500).send({
        success: false,
        error: '添加Twitter影响者失败'
      })
    }
  })

  // 获取Twitter服务状态
  fastify.get('/api/twitter/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!twitterService) {
        return reply.send({
          success: true,
          data: {
            enabled: false,
            status: 'disabled',
            message: 'Twitter API服务未配置'
          }
        })
      }

      // 检查Twitter API连接状态
      const isConnected = await twitterService.verifyConnection()
      
      reply.send({
        success: true,
        data: {
          enabled: true,
          status: isConnected ? 'connected' : 'disconnected',
          message: isConnected ? 'Twitter API连接正常' : 'Twitter API连接失败'
        }
      })
    } catch (error) {
      logger.error('获取Twitter服务状态失败:', error)
      reply.code(500).send({
        success: false,
        error: '获取Twitter服务状态失败'
      })
    }
  })

  // 手动触发Twitter数据收集
  fastify.post('/api/twitter/collect', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!twitterService) {
        return reply.code(503).send({
          success: false,
          error: 'Twitter API服务未启用'
        })
      }

      // 手动触发数据收集
      await twitterService.startDataCollection()
      
      reply.send({
        success: true,
        message: '数据收集已启动'
      })
    } catch (error) {
      logger.error('手动触发Twitter数据收集失败:', error)
      reply.code(500).send({
        success: false,
        error: '手动触发Twitter数据收集失败'
      })
    }
  })
}
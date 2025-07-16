import { FastifyInstance } from 'fastify'
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js'
import { logger } from '../utils/logger.js'
import { environment } from '../config/environment.js'

export async function registerMonitoringRoutes(fastify: FastifyInstance) {
  /**
   * 获取错误统计信息
   */
  fastify.get('/api/monitoring/errors/stats', async (request, reply) => {
    try {
      const stats = enhancedErrorHandler.getErrorStats()
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'GET /api/monitoring/errors/stats'
      )
      reply.code(500)
      return {
        success: false,
        error: 'Failed to get error statistics'
      }
    }
  })

  /**
   * 获取最近的错误列表
   */
  fastify.get('/api/monitoring/errors/recent', async (request, reply) => {
    try {
      const query = request.query as { limit?: string }
      const limit = parseInt(query.limit || '50')
      const errors = enhancedErrorHandler.getRecentErrors(limit)
      
      // 过滤敏感信息
      const sanitizedErrors = errors.map(error => ({
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: error.timestamp,
        retryCount: error.retryCount,
        context: error.context ? {
          ...error.context,
          // 移除可能的敏感信息
          password: undefined,
          token: undefined,
          key: undefined
        } : undefined
      }))
      
      return {
        success: true,
        data: sanitizedErrors,
        total: sanitizedErrors.length,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'GET /api/monitoring/errors/recent'
      )
      reply.code(500)
      return {
        success: false,
        error: 'Failed to get recent errors'
      }
    }
  })

  /**
   * 清除错误统计
   */
  fastify.post('/api/monitoring/errors/clear', async (request, reply) => {
    try {
      enhancedErrorHandler.clearStats()
      logger.info('📊 错误统计已清除')
      
      return {
        success: true,
        message: 'Error statistics cleared successfully',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'POST /api/monitoring/errors/clear'
      )
      reply.code(500)
      return {
        success: false,
        error: 'Failed to clear error statistics'
      }
    }
  })

  /**
   * 获取系统健康状态
   */
  fastify.get('/api/monitoring/health', async (request, reply) => {
    try {
      const stats = enhancedErrorHandler.getErrorStats()
      const now = Date.now()
      
      // 计算健康分数 (0-100)
      let healthScore = 100
      
      // 根据错误率降低分数
      if (stats.lastHour > 0) {
        healthScore -= Math.min(stats.lastHour * 2, 50) // 每个错误扣2分，最多扣50分
      }
      
      // 根据严重错误降低分数
      const criticalErrors = stats.bySeverity.CRITICAL || 0
      const highErrors = stats.bySeverity.HIGH || 0
      
      healthScore -= criticalErrors * 10 // 每个严重错误扣10分
      healthScore -= highErrors * 5 // 每个高级错误扣5分
      
      healthScore = Math.max(0, healthScore)
      
      // 确定健康状态
      let status: 'healthy' | 'warning' | 'critical'
      if (healthScore >= 80) {
        status = 'healthy'
      } else if (healthScore >= 50) {
        status = 'warning'
      } else {
        status = 'critical'
      }
      
      return {
        success: true,
        data: {
          status,
          healthScore,
          errorStats: stats,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
          }
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'GET /api/monitoring/health'
      )
      reply.code(500)
      return {
        success: false,
        error: 'Failed to get health status'
      }
    }
  })

  /**
   * 获取配置信息（非敏感部分）
   */
  fastify.get('/api/monitoring/config', async (request, reply) => {
    try {
      const config = {
        server: {
          port: environment.server.port,
          nodeEnv: environment.server.nodeEnv
        },
        monitoring: {
          scanNewTokensInterval: environment.monitoring.scanNewTokensInterval,
          updatePriceInterval: environment.monitoring.updatePriceInterval,
          updateTradingInterval: environment.monitoring.updateTradingInterval,
          checkAlertsInterval: environment.monitoring.checkAlertsInterval
        },
        alerts: {
          goldenDog: environment.alerts.goldenDog,
          risk: environment.alerts.risk
        },
        performance: {
          httpTimeout: environment.performance.httpTimeout,
          httpMaxRetries: environment.performance.httpMaxRetries,
          cacheMaxSize: environment.performance.cacheMaxSize,
          cacheTtl: environment.performance.cacheTtl
        }
      }
      
      return {
        success: true,
        data: config,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'GET /api/monitoring/config'
      )
      reply.code(500)
      return {
        success: false,
        error: 'Failed to get configuration'
      }
    }
  })

  /**
   * 测试错误处理（仅开发环境）
   */
  if (environment.server.nodeEnv === 'development') {
    fastify.post('/api/monitoring/test-error', async (request, reply) => {
      try {
        const body = request.body as { type?: string, message?: string }
        const errorType = body.type || 'test'
        const errorMessage = body.message || 'This is a test error'
        
        // 创建测试错误
        const testError = new Error(errorMessage)
        await enhancedErrorHandler.handleError(
          testError,
          `Test error - ${errorType}`
        )
        
        return {
          success: true,
          message: 'Test error generated successfully',
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        reply.code(500)
        return {
          success: false,
          error: 'Failed to generate test error'
        }
      }
    })
  }
}
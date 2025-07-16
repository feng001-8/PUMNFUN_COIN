import { getConfig } from '../config/api-config.js'
import { logger } from './logger.js'
import { errorHandler, createError } from './error-handler.js'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
}

export class HttpClient {
  private config = getConfig()
  private requestCounts = new Map<string, { count: number; resetTime: number }>()

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      retries = 3
    } = options

    const startTime = Date.now()
    
    // 检查速率限制
    if (!this.checkRateLimit(url)) {
      throw createError.apiRateLimit('Rate limit exceeded', { url })
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PumpPortal-Golden-Dog-Alert/1.0',
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    }

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body)
    }

    let lastError: Error
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger.info(`🌐 API请求: ${method} ${url} (尝试 ${attempt + 1}/${retries + 1})`)
        
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          throw createError.apiRequest(`HTTP ${response.status}: ${response.statusText}`, {
            method,
            url,
            status: response.status,
            statusText: response.statusText
          })
        }
        
        const data = await response.json()
        
        // 更新请求计数
        this.updateRequestCount(url)
        
        const duration = Date.now() - startTime
        logger.apiRequest(method, url, duration)
        return data as T
        
      } catch (error) {
        lastError = error as Error
        const duration = Date.now() - startTime
        
        // 处理超时错误
        if (error instanceof Error && error.name === 'TimeoutError') {
          const timeoutError = createError.apiTimeout(`Request timeout: ${method} ${url}`, {
            method,
            url,
            timeout,
            duration
          })
          logger.apiError(method, url, timeoutError, duration)
          lastError = timeoutError
        } else {
          logger.apiError(method, url, lastError, duration)
        }
        
        if (attempt < retries) {
          const delay = 1000 * Math.pow(2, attempt)
          logger.warn(`⏳ ${delay}ms后重试...`)
          await this.sleep(delay)
        }
      }
    }
    
    throw createError.apiRequest(`API请求最终失败: ${lastError!.message}`, {
      method,
      url,
      retries,
      lastError: lastError!.message
    })
  }

  private checkRateLimit(url: string): boolean {
    const domain = new URL(url).hostname
    const now = Date.now()
    const windowMs = 60 * 1000 // 1分钟窗口
    
    const record = this.requestCounts.get(domain)
    
    if (!record || now > record.resetTime) {
      this.requestCounts.set(domain, {
        count: 0,
        resetTime: now + windowMs
      })
      return true
    }
    
    return record.count < 60
  }

  private updateRequestCount(url: string): void {
    const domain = new URL(url).hostname
    const record = this.requestCounts.get(domain)
    
    if (record) {
      record.count++
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 构建URL的辅助方法
  buildUrl(baseUrl: string, endpoint: string, params: Record<string, string> = {}): string {
    let url = baseUrl + endpoint
    
    // 替换路径参数
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(value))
    })
    
    return url
  }

  // 构建查询参数
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }
}

// 单例实例
export const httpClient = new HttpClient()
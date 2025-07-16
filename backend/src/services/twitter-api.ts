import { TwitterApi, TweetV2, UserV2 } from 'twitter-api-v2'
import { logger } from '../utils/logger.js'
import { enhancedErrorHandler } from '../utils/enhanced-error-handler.js'
import { SentimentAnalyzer, SentimentData } from './sentiment-analyzer.js'
import { TokenMappingService } from './token-mapping.js'
import { DatabaseManager } from '../database/schema.js'

// Twitter配置接口
export interface TwitterConfig {
  bearerToken: string
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  accessSecret?: string
}

// 推文情绪数据接口
export interface TweetSentimentData {
  tweetId: string
  text: string
  authorId: string
  authorUsername: string
  authorFollowers: number
  createdAt: Date
  publicMetrics: {
    retweetCount: number
    likeCount: number
    replyCount: number
    quoteCount: number
  }
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number
  tokenMentions: string[]
  isInfluencer: boolean
}

// KOL/影响者信息接口
export interface InfluencerInfo {
  userId: string
  username: string
  displayName: string
  followersCount: number
  verifiedType?: string
  category: 'crypto_trader' | 'analyst' | 'influencer' | 'whale' | 'developer'
  credibilityScore: number
}

export class TwitterAPIService {
  private client: TwitterApi
  private db: DatabaseManager
  private sentimentAnalyzer: SentimentAnalyzer
  private tokenMapping: TokenMappingService
  private isRunning: boolean = false
  private streamingInterval?: NodeJS.Timeout
  private rateLimitReset: Map<string, number> = new Map()
  private io?: any // Socket.io实例
  
  // 加密货币相关关键词
  private readonly CRYPTO_KEYWORDS = [
    'pump', 'moon', 'gem', 'alpha', 'hodl', 'diamond', 'rocket',
    'dump', 'rug', 'scam', 'bearish', 'bullish', 'degen',
    'solana', 'sol', 'pumpfun', 'memecoin', 'shitcoin'
  ]
  
  // 知名加密货币影响者列表
  private readonly CRYPTO_INFLUENCERS = [
    'elonmusk', 'VitalikButerin', 'cz_binance', 'justinsuntron',
    'APompliano', 'michael_saylor', 'naval', 'balajis',
    'coin_bureau', 'altcoinpsycho', 'pentosh1', 'inversebrah'
  ]

  constructor(config: TwitterConfig, db: DatabaseManager, sentimentAnalyzer: SentimentAnalyzer, tokenMapping: TokenMappingService) {
    // 解码 Bearer Token（如果是 URL 编码的）
    const bearerToken = decodeURIComponent(config.bearerToken)
    this.client = new TwitterApi(bearerToken)
    this.db = db
    this.sentimentAnalyzer = sentimentAnalyzer
    this.tokenMapping = tokenMapping
    logger.info('🐦 Twitter API 服务已初始化')
    logger.debug(`🔑 Bearer Token 长度: ${bearerToken.length} 字符`)
  }

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    
    try {
      // 验证API连接
      const isConnected = await this.verifyConnection()
      
      if (!isConnected) {
        logger.warn('⚠️ Twitter API 连接失败，服务将以受限模式运行')
        return
      }
      
      // 初始化影响者数据
      await this.initializeInfluencers()
      
      // 开始数据收集
      await this.startDataCollection()
      
      logger.info('🐦 Twitter API 服务启动完成')
    } catch (error) {
      logger.warn('⚠️ Twitter API 服务启动失败，将以受限模式运行:', error)
      // 不抛出错误，让应用继续运行
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval)
    }
    logger.info('🛑 Twitter API 服务停止')
  }
  
  // 设置Socket.io实例
  setSocketIO(io: any): void {
    this.io = io
    logger.debug('🔌 Twitter服务已连接Socket.io')
  }

  // 验证API连接
  public async verifyConnection(): Promise<boolean> {
    try {
      const me = await this.client.v2.me()
      logger.info(`🐦 Twitter API 连接成功: ${me.data.username}`)
      return true
    } catch (error: any) {
      // 提供更详细的错误信息
      let errorMessage = 'Unknown error'
      if (error.data) {
        errorMessage = `${error.data.title || 'API Error'}: ${error.data.detail || error.data.message || 'No details'}`
      } else if (error.message) {
        errorMessage = error.message
      }
      
      logger.error(`❌ Twitter API 连接失败: ${errorMessage}`)
      
      // 如果是认证错误，提供具体建议
      if (error.code === 401 || errorMessage.includes('Unauthorized') || errorMessage.includes('authentication')) {
        logger.error('🔑 认证失败 - 请检查 Bearer Token 是否正确')
        logger.error('💡 提示: Bearer Token 应该是以 "AAAAAAAAAAAAAAAAAAAAAA" 开头的长字符串')
      }
      
      return false
    }
  }
  
  // 验证API连接（内部使用）
  private async validateConnection(): Promise<void> {
    try {
      const me = await this.client.v2.me()
      logger.info(`🐦 Twitter API 连接成功: ${me.data.username}`)
    } catch (error) {
      throw new Error(`Twitter API 连接失败: ${error}`)
    }
  }

  // 初始化影响者数据
  private async initializeInfluencers(): Promise<void> {
    try {
      for (const username of this.CRYPTO_INFLUENCERS) {
        await this.addInfluencer(username)
        // 避免API限制
        await this.delay(1000)
      }
    } catch (error) {
      logger.warn('初始化影响者数据时出错:', error)
    }
  }

  // 添加影响者到数据库
  private async addInfluencer(username: string): Promise<void> {
    try {
      const user = await this.client.v2.userByUsername(username, {
        'user.fields': ['public_metrics', 'verified', 'description']
      })
      
      if (!user.data) return
      
      const influencer: InfluencerInfo = {
        userId: user.data.id,
        username: user.data.username,
        displayName: user.data.name,
        followersCount: user.data.public_metrics?.followers_count || 0,
        verifiedType: user.data.verified_type,
        category: this.categorizeInfluencer(user.data),
        credibilityScore: this.calculateCredibilityScore(user.data)
      }
      
      await this.saveInfluencer(influencer)
      
    } catch (error) {
      logger.warn(`添加影响者 ${username} 失败:`, error)
    }
  }

  // 分类影响者
  private categorizeInfluencer(user: UserV2): InfluencerInfo['category'] {
    const description = user.description?.toLowerCase() || ''
    const username = user.username.toLowerCase()
    
    if (description.includes('trader') || description.includes('trading')) {
      return 'crypto_trader'
    }
    if (description.includes('analyst') || description.includes('research')) {
      return 'analyst'
    }
    if (description.includes('developer') || description.includes('dev')) {
      return 'developer'
    }
    if (user.public_metrics?.followers_count && user.public_metrics.followers_count > 100000) {
      return 'whale'
    }
    
    return 'influencer'
  }

  // 计算可信度分数
  private calculateCredibilityScore(user: UserV2): number {
    let score = 50 // 基础分数
    
    // 关注者数量影响
    const followers = user.public_metrics?.followers_count || 0
    if (followers > 1000000) score += 30
    else if (followers > 100000) score += 20
    else if (followers > 10000) score += 10
    
    // 验证状态影响
    if (user.verified_type === 'blue') score += 10
    
    // 账户年龄影响（这里简化处理）
    score += 10
    
    return Math.min(100, Math.max(0, score))
  }

  // 保存影响者到数据库
  private async saveInfluencer(influencer: InfluencerInfo): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO kol_info (
          user_id, name, wallet_address, category, followers_count,
          credibility_score, platform, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        influencer.userId,
        `${influencer.displayName} (@${influencer.username})`,
        '', // Twitter用户没有钱包地址
        influencer.category,
        influencer.followersCount,
        influencer.credibilityScore,
        'twitter',
        1
      )
      
      logger.debug(`💾 保存影响者: ${influencer.username}`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'saveInfluencer',
        { username: influencer.username }
      )
    }
  }

  // 开始数据收集
  public async startDataCollection(): Promise<void> {
    // 定期搜索相关推文
    this.streamingInterval = setInterval(async () => {
      try {
        await this.searchCryptoTweets()
        await this.monitorInfluencers()
      } catch (error) {
        logger.warn('数据收集周期出错:', error)
      }
    }, 300000) // 每5分钟执行一次
    
    // 立即执行一次
    await this.searchCryptoTweets()
  }

  // 搜索加密货币相关推文
  private async searchCryptoTweets(): Promise<void> {
    try {
      // 检查API限制
      if (!await this.checkRateLimit('search')) {
        logger.warn('Twitter搜索API达到限制，跳过本次搜索')
        return
      }
      
      const query = this.buildSearchQuery()
      
      const tweets = await this.client.v2.search(query, {
        max_results: 100,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id', 'text'],
        'user.fields': ['public_metrics', 'verified'],
        expansions: ['author_id']
      })
      
      if (tweets.data) {
        if (tweets.data && Array.isArray(tweets.data)) {
          await this.processTweets(tweets.data, tweets.includes?.users || [])
        }
      }
      
      logger.debug(`🐦 处理了 ${Array.isArray(tweets.data) ? tweets.data.length : 0} 条推文`)
      
    } catch (error) {
      await enhancedErrorHandler.handleError(
        error as Error,
        'searchCryptoTweets'
      )
    }
  }

  // 构建搜索查询
  private buildSearchQuery(): string {
    const keywords = this.CRYPTO_KEYWORDS.slice(0, 5) // 限制关键词数量避免查询过长
    return `(${keywords.join(' OR ')}) lang:en -is:retweet`
  }

  // 处理推文数据
  private async processTweets(tweets: TweetV2[], users: UserV2[]): Promise<void> {
    const userMap = new Map(users.map(user => [user.id, user]))
    
    for (const tweet of tweets) {
      try {
        const author = userMap.get(tweet.author_id!)
        if (!author) continue
        
        const tweetData = await this.analyzeTweet(tweet, author)
        if (tweetData) {
          await this.saveTweetSentiment(tweetData)
          
          // 转换为情绪数据格式并记录
          const sentimentDataList = await this.convertToSentimentData(tweetData)
          for (const sentimentData of sentimentDataList) {
            await this.sentimentAnalyzer.recordSentimentData(sentimentData)
          }
        }
      } catch (error) {
        logger.warn(`处理推文 ${tweet.id} 时出错:`, error)
      }
    }
  }

  // 分析单条推文
  private async analyzeTweet(tweet: TweetV2, author: UserV2): Promise<TweetSentimentData | null> {
    try {
      const sentiment = this.analyzeTweetSentiment(tweet.text)
      const tokenMentions = this.extractTokenMentions(tweet.text)
      
      // 如果没有代币提及，跳过
      if (tokenMentions.length === 0) return null
      
      const isInfluencer = this.isUserInfluencer(author)
      
      return {
        tweetId: tweet.id,
        text: tweet.text,
        authorId: author.id,
        authorUsername: author.username,
        authorFollowers: author.public_metrics?.followers_count || 0,
        createdAt: new Date(tweet.created_at!),
        publicMetrics: {
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
          quoteCount: tweet.public_metrics?.quote_count || 0
        },
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        tokenMentions,
        isInfluencer
      }
    } catch (error) {
      logger.warn('分析推文时出错:', error)
      return null
    }
  }

  // 分析推文情绪
  private analyzeTweetSentiment(text: string): { label: 'positive' | 'negative' | 'neutral', score: number } {
    const lowerText = text.toLowerCase()
    let score = 0
    
    // 积极词汇
    const positiveWords = ['moon', 'pump', 'bullish', 'gem', 'alpha', 'hodl', 'diamond', 'rocket', '🚀', '💎', '📈']
    const negativeWords = ['dump', 'crash', 'bearish', 'rug', 'scam', 'sell', 'dead', 'rip', '📉', '💀']
    
    positiveWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length
      score += matches * 10
    })
    
    negativeWords.forEach(word => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length
      score -= matches * 10
    })
    
    // 表情符号权重
    const emojis = text.match(/[😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫🥱😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱🥵🥶😳🤪😵🥴🤢🤮🤧😷🤒🤕🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾🚀💎📈📉]/g) || []
    emojis.forEach(emoji => {
      if (['🚀', '💎', '📈', '😀', '😊', '🎉'].includes(emoji)) score += 5
      if (['📉', '💀', '😢', '😭', '😰'].includes(emoji)) score -= 5
    })
    
    // 标准化分数到-100到100
    score = Math.max(-100, Math.min(100, score))
    
    let label: 'positive' | 'negative' | 'neutral'
    if (score > 20) label = 'positive'
    else if (score < -20) label = 'negative'
    else label = 'neutral'
    
    return { label, score }
  }

  // 提取代币提及
  private extractTokenMentions(text: string): string[] {
    const mentions: string[] = []
    
    // 查找$符号后的代币符号
    const tokenPattern = /\$([A-Z]{2,10})\b/g
    let match
    while ((match = tokenPattern.exec(text)) !== null) {
      mentions.push(match[1])
    }
    
    // 查找常见代币名称
    const commonTokens = ['SOL', 'BTC', 'ETH', 'USDC', 'USDT']
    commonTokens.forEach(token => {
      if (text.toUpperCase().includes(token)) {
        mentions.push(token)
      }
    })
    
    return [...new Set(mentions)] // 去重
  }

  // 判断用户是否为影响者
  private isUserInfluencer(user: UserV2): boolean {
    const followers = user.public_metrics?.followers_count || 0
    const isVerified = user.verified_type === 'blue'
    const isKnownInfluencer = this.CRYPTO_INFLUENCERS.includes(user.username)
    
    return followers > 10000 || isVerified || isKnownInfluencer
  }

  // 保存推文情绪数据
  private async saveTweetSentiment(tweetData: TweetSentimentData): Promise<void> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO twitter_sentiment (
          tweet_id, text, author_id, author_username, author_followers,
          created_at, retweet_count, like_count, reply_count, quote_count,
          sentiment, sentiment_score, token_mentions, is_influencer
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      
      stmt.run(
        tweetData.tweetId,
        tweetData.text,
        tweetData.authorId,
        tweetData.authorUsername,
        tweetData.authorFollowers,
        tweetData.createdAt.toISOString(),
        tweetData.publicMetrics.retweetCount,
        tweetData.publicMetrics.likeCount,
        tweetData.publicMetrics.replyCount,
        tweetData.publicMetrics.quoteCount,
        tweetData.sentiment,
        tweetData.sentimentScore,
        JSON.stringify(tweetData.tokenMentions),
        tweetData.isInfluencer ? 1 : 0
      )
      
    } catch (error) {
      // 忽略重复插入错误
      if (!(error as Error).toString().includes('UNIQUE constraint failed')) {
        await enhancedErrorHandler.handleError(
          error as Error,
          'saveTweetSentiment',
          { tweetId: tweetData.tweetId }
        )
      }
    }
  }

  // 转换为情绪数据格式
  private async convertToSentimentData(tweetData: TweetSentimentData): Promise<Omit<SentimentData, 'id' | 'createdAt'>[]> {
    const sentimentDataList: Omit<SentimentData, 'id' | 'createdAt'>[] = []
    
    // 为每个提及的代币创建情绪数据
    for (const tokenSymbol of tweetData.tokenMentions) {
      const tokenAddress = await this.tokenMapping.getAddressBySymbol(tokenSymbol)
      
      if (tokenAddress) {
        const sentimentData: Omit<SentimentData, 'id' | 'createdAt'> = {
          tokenAddress,
          source: 'twitter',
          sentimentScore: tweetData.sentimentScore,
          positiveCount: tweetData.sentiment === 'positive' ? 1 : 0,
          negativeCount: tweetData.sentiment === 'negative' ? 1 : 0,
          neutralCount: tweetData.sentiment === 'neutral' ? 1 : 0,
          totalMentions: 1,
          keywordMentions: this.extractKeywordMentions(tweetData.text),
          influencerMentions: tweetData.isInfluencer ? 1 : 0,
          volumeSpike: this.detectVolumeSpike(tweetData),
          trendingScore: this.calculateTrendingScore(tweetData),
          timestamp: tweetData.createdAt
        }
        
        sentimentDataList.push(sentimentData)
      }
    }
    
    return sentimentDataList
  }
  
  // 提取关键词提及
  private extractKeywordMentions(text: string): {
    bullish: number
    bearish: number
    moon: number
    dump: number
    hodl: number
    sell: number
  } {
    const lowerText = text.toLowerCase()
    
    return {
      bullish: (lowerText.match(/bullish|bull/g) || []).length,
      bearish: (lowerText.match(/bearish|bear/g) || []).length,
      moon: (lowerText.match(/moon|🚀|rocket/g) || []).length,
      dump: (lowerText.match(/dump|crash/g) || []).length,
      hodl: (lowerText.match(/hodl|hold|💎|diamond/g) || []).length,
      sell: (lowerText.match(/sell|exit/g) || []).length
    }
  }
  
  // 检测交易量激增
  private detectVolumeSpike(tweetData: TweetSentimentData): boolean {
    const engagement = tweetData.publicMetrics.likeCount + 
                     tweetData.publicMetrics.retweetCount + 
                     tweetData.publicMetrics.replyCount
    
    // 如果是影响者且互动量高，认为可能引起交易量激增
    return tweetData.isInfluencer && engagement > 100
  }
  
  // 计算趋势分数
  private calculateTrendingScore(tweetData: TweetSentimentData): number {
    let score = 0
    
    // 基于互动量
    const engagement = tweetData.publicMetrics.likeCount + 
                      tweetData.publicMetrics.retweetCount + 
                      tweetData.publicMetrics.replyCount
    score += Math.min(50, engagement / 10)
    
    // 影响者加成
    if (tweetData.isInfluencer) {
      score += 30
    }
    
    // 关注者数量加成
    if (tweetData.authorFollowers > 10000) {
      score += 20
    }
    
    return Math.min(100, score)
  }

  // 监控影响者动态
  private async monitorInfluencers(): Promise<void> {
    try {
      // 获取影响者列表
      const influencers = await this.getStoredInfluencers()
      
      for (const influencer of influencers.slice(0, 5)) { // 限制数量避免API限制
        await this.getInfluencerTweets(influencer.userId)
        await this.delay(2000) // 避免API限制
      }
      
    } catch (error) {
      logger.warn('监控影响者时出错:', error)
    }
  }

  // 获取存储的影响者
  private async getStoredInfluencers(): Promise<{ userId: string, username: string }[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT user_id, name FROM kol_info 
        WHERE platform = 'twitter' AND is_active = 1
        ORDER BY credibility_score DESC
        LIMIT 20
      `)
      
      const rows = stmt.all() as any[]
      return rows.map(row => ({
        userId: row.user_id,
        username: row.name
      }))
    } catch (error) {
      return []
    }
  }

  // 获取影响者推文
  private async getInfluencerTweets(userId: string): Promise<void> {
    try {
      if (!await this.checkRateLimit('user_tweets')) {
        return
      }
      
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: 10,
        'tweet.fields': ['created_at', 'public_metrics', 'text'],
        exclude: ['retweets', 'replies']
      })
      
      if (tweets.data && Array.isArray(tweets.data)) {
        // 处理影响者推文（简化版本）
        logger.debug(`📊 获取影响者 ${userId} 的 ${tweets.data.length} 条推文`)
      }
      
    } catch (error) {
      logger.warn(`获取影响者 ${userId} 推文时出错:`, error)
    }
  }

  // 检查API限制
  private async checkRateLimit(endpoint: string): Promise<boolean> {
    const now = Date.now()
    const resetTime = this.rateLimitReset.get(endpoint) || 0
    
    if (now < resetTime) {
      return false
    }
    
    // 设置下次重置时间（15分钟后）
    this.rateLimitReset.set(endpoint, now + 15 * 60 * 1000)
    return true
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 获取存储的影响者列表（公共方法）
  async getStoredInfluencersList(): Promise<InfluencerInfo[]> {
    const db = this.db.getDb()
    
    try {
      const stmt = db.prepare(`
        SELECT * FROM kol_info 
        WHERE platform = 'twitter'
        ORDER BY credibility_score DESC
      `)
      
      const influencers = stmt.all() as any[]
      
      return influencers.map(inf => ({
        userId: inf.user_id,
        username: inf.name.split('(')[1]?.replace(')', '').replace('@', '') || inf.user_id,
        displayName: inf.name.split('(')[0]?.trim() || inf.name,
        followersCount: inf.followers_count || 0,
        verifiedType: inf.verified_type,
        category: inf.category as InfluencerInfo['category'],
        credibilityScore: inf.credibility_score || 0
      }))
    } catch (error) {
      logger.warn('获取影响者列表失败:', error)
      return []
    }
  }

  // 添加影响者（公共方法）
  async addInfluencerPublic(influencerData: { username: string; category?: string; description?: string }): Promise<void> {
    await this.addInfluencer(influencerData.username)
  }

  // 获取Twitter情绪统计
  async getTwitterSentimentStats(tokenAddress?: string): Promise<any> {
    const db = this.db.getDb()
    
    try {
      let query = `
        SELECT 
          sentiment,
          COUNT(*) as count,
          AVG(sentiment_score) as avg_score,
          SUM(like_count + retweet_count) as engagement
        FROM twitter_sentiment
        WHERE created_at > datetime('now', '-24 hours')
      `
      
      if (tokenAddress) {
        query += ` AND token_mentions LIKE '%${tokenAddress}%'`
      }
      
      query += ` GROUP BY sentiment`
      
      const stmt = db.prepare(query)
      const results = stmt.all()
      
      return results
    } catch (error) {
      logger.warn('获取Twitter情绪统计时出错:', error)
      return []
    }
  }
}
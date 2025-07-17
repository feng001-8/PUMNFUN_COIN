import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { TrendingUp, TrendingDown, Brain, Users, AlertTriangle, Target, BarChart3, Activity, Zap, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

interface AnalysisData {
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  overallScore: number
  technicalAnalysis: {
    score: number
    trend: 'bullish' | 'bearish' | 'neutral'
    rsi: number
    signals: string[]
    supportLevel: number
    resistanceLevel: number
  }
  sentimentAnalysis: {
    score: number
    sentiment: string[]
    confidence: number
    sources: {
      twitter: number
      telegram: number
      discord: number
    }
  }
  kolAnalysis: {
    score: number
    activeKOLs: number
    influenceLevel: 'high' | 'medium' | 'low'
    recentTransactions: {
      kolName: string
      action: 'buy' | 'sell'
      amount: number
      timestamp: string
    }[]
  }
  marketAnalysis: {
    score: number
    volume24h: number
    priceChange24h: number
    volatility: number
    liquidity: number
  }
  riskAssessment: {
    riskScore: number
    riskFactors: string[]
    safetyLevel: 'high' | 'medium' | 'low'
  }
  prediction: {
    priceTarget1h: number
    priceTarget24h: number
    priceTarget7d: number
    probability: number
    recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
  }
}

interface AnalysisPanelProps {
  tokenAddress?: string
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ tokenAddress }) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'technical' | 'sentiment' | 'kol' | 'market'>('overview')

  // 模拟分析数据
  const mockAnalysisData: AnalysisData = {
    tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenName: 'PumpCoin',
    tokenSymbol: 'PUMP',
    overallScore: 78,
    technicalAnalysis: {
      score: 75,
      trend: 'bullish',
      rsi: 65,
      signals: ['突破阻力位', '成交量放大', 'RSI超买'],
      supportLevel: 0.00180,
      resistanceLevel: 0.00280
    },
    sentimentAnalysis: {
      score: 82,
      sentiment: ['非常乐观', '社区活跃'],
      confidence: 85,
      sources: {
        twitter: 78,
        telegram: 85,
        discord: 80
      }
    },
    kolAnalysis: {
      score: 70,
      activeKOLs: 5,
      influenceLevel: 'high',
      recentTransactions: [
        {
          kolName: 'CryptoWhale',
          action: 'buy',
          amount: 50000,
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          kolName: 'SolanaTrader',
          action: 'buy',
          amount: 25000,
          timestamp: '2024-01-15T09:45:00Z'
        }
      ]
    },
    marketAnalysis: {
      score: 80,
      volume24h: 125000,
      priceChange24h: 156.7,
      volatility: 45,
      liquidity: 45.6
    },
    riskAssessment: {
      riskScore: 25,
      riskFactors: ['新代币风险', '流动性风险'],
      safetyLevel: 'medium'
    },
    prediction: {
      priceTarget1h: 0.00245,
      priceTarget24h: 0.00280,
      priceTarget7d: 0.00350,
      probability: 75,
      recommendation: 'buy'
    }
  }

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setAnalysisData(mockAnalysisData)
      setLoading(false)
    }, 1500)
  }, [tokenAddress])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
      case 'buy':
        return 'text-green-500'
      case 'hold':
        return 'text-yellow-500'
      case 'sell':
      case 'strong_sell':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy': return '强烈买入'
      case 'buy': return '买入'
      case 'hold': return '持有'
      case 'sell': return '卖出'
      case 'strong_sell': return '强烈卖出'
      default: return '观望'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">选择代币进行分析</h3>
          <p className="text-muted-foreground">请从代币监控面板选择一个代币查看详细分析</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                智能分析 - {analysisData.tokenName} ({analysisData.tokenSymbol})
              </CardTitle>
              <CardDescription>
                基于AI算法的多维度代币分析报告
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">
                {analysisData.overallScore}/100
              </div>
              <div className="text-sm text-muted-foreground">综合评分</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 标签页导航 */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {[
          { key: 'overview', label: '概览', icon: BarChart3 },
          { key: 'technical', label: '技术分析', icon: TrendingUp },
          { key: 'sentiment', label: '情绪分析', icon: Activity },
          { key: 'kol', label: 'KOL追踪', icon: Users },
          { key: 'market', label: '市场分析', icon: Target }
        ].map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                selectedTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 标签页内容 */}
      <motion.div
        key={selectedTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 技术分析卡片 */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  技术分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">评分:</span>
                    <span className={getScoreColor(analysisData.technicalAnalysis.score)}>
                      {analysisData.technicalAnalysis.score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">趋势:</span>
                    <span className={analysisData.technicalAnalysis.trend === 'bullish' ? 'text-green-500' : 'text-red-500'}>
                      {analysisData.technicalAnalysis.trend === 'bullish' ? '看涨' : '看跌'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RSI:</span>
                    <span>{analysisData.technicalAnalysis.rsi}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 情绪分析卡片 */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-green-500" />
                  情绪分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">评分:</span>
                    <span className={getScoreColor(analysisData.sentimentAnalysis.score)}>
                      {analysisData.sentimentAnalysis.score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">置信度:</span>
                    <span>{analysisData.sentimentAnalysis.confidence}%</span>
                  </div>
                  <div className="space-y-1">
                    {analysisData.sentimentAnalysis.sentiment.map((sentiment, index) => (
                      <span key={index} className="inline-block px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded-full mr-1">
                        {sentiment}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KOL分析卡片 */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                  KOL追踪
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">评分:</span>
                    <span className={getScoreColor(analysisData.kolAnalysis.score)}>
                      {analysisData.kolAnalysis.score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">活跃KOL:</span>
                    <span>{analysisData.kolAnalysis.activeKOLs}个</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">影响力:</span>
                    <span className={analysisData.kolAnalysis.influenceLevel === 'high' ? 'text-green-500' : 'text-yellow-500'}>
                      {analysisData.kolAnalysis.influenceLevel === 'high' ? '高' : '中'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 风险评估 */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-orange-500" />
                  风险评估
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">风险评分:</span>
                    <span className={analysisData.riskAssessment.riskScore < 30 ? 'text-green-500' : analysisData.riskAssessment.riskScore < 60 ? 'text-yellow-500' : 'text-red-500'}>
                      {analysisData.riskAssessment.riskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">安全等级:</span>
                    <span className={analysisData.riskAssessment.safetyLevel === 'high' ? 'text-green-500' : 'text-yellow-500'}>
                      {analysisData.riskAssessment.safetyLevel === 'high' ? '高' : '中'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {analysisData.riskAssessment.riskFactors.map((factor, index) => (
                      <span key={index} className="inline-block px-2 py-1 text-xs bg-orange-500/20 text-orange-500 rounded-full mr-1">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 价格预测 */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-cyan-500" />
                  价格预测
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1小时目标:</span>
                    <span className="text-green-500">${analysisData.prediction.priceTarget1h.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24小时目标:</span>
                    <span className="text-green-500">${analysisData.prediction.priceTarget24h.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">7天目标:</span>
                    <span className="text-green-500">${analysisData.prediction.priceTarget7d.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">成功概率:</span>
                    <span>{analysisData.prediction.probability}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 投资建议 */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  投资建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className={`text-2xl font-bold ${getRecommendationColor(analysisData.prediction.recommendation)}`}>
                    {getRecommendationText(analysisData.prediction.recommendation)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    基于多维度分析的智能建议
                  </div>
                  <Button 
                    variant="gradient" 
                    className="w-full"
                    disabled={analysisData.prediction.recommendation.includes('sell')}
                  >
                    {analysisData.prediction.recommendation.includes('buy') ? '立即交易' : '继续观察'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'technical' && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>技术指标详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">技术信号</h4>
                  {analysisData.technicalAnalysis.signals.map((signal, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">关键价位</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">支撑位:</span>
                      <span className="text-green-500">${analysisData.technicalAnalysis.supportLevel.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">阻力位:</span>
                      <span className="text-red-500">${analysisData.technicalAnalysis.resistanceLevel.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'sentiment' && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>社交媒体情绪分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-500 mb-2">{analysisData.sentimentAnalysis.sources.twitter}</div>
                  <div className="text-sm text-muted-foreground">Twitter情绪</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-500 mb-2">{analysisData.sentimentAnalysis.sources.telegram}</div>
                  <div className="text-sm text-muted-foreground">Telegram情绪</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-purple-500 mb-2">{analysisData.sentimentAnalysis.sources.discord}</div>
                  <div className="text-sm text-muted-foreground">Discord情绪</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'kol' && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>KOL交易记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.kolAnalysis.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                        {transaction.kolName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{transaction.kolName}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${transaction.action === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.action === 'buy' ? '买入' : '卖出'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'market' && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>市场数据分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary mb-2">
                    ${(analysisData.marketAnalysis.volume24h / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-muted-foreground">24小时交易量</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    +{analysisData.marketAnalysis.priceChange24h.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">24小时涨幅</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-yellow-500 mb-2">
                    {analysisData.marketAnalysis.volatility}%
                  </div>
                  <div className="text-sm text-muted-foreground">波动率</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-500 mb-2">
                    {analysisData.marketAnalysis.liquidity.toFixed(1)} SOL
                  </div>
                  <div className="text-sm text-muted-foreground">流动性</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default AnalysisPanel
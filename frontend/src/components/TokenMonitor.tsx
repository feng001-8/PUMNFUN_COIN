import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { TrendingUp, TrendingDown, Activity, DollarSign, Users, AlertTriangle, Eye, Filter, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface TokenData {
  address: string
  name: string
  symbol: string
  price: number
  priceChange5m: number
  priceChange1h: number
  priceChange24h: number
  volume24h: number
  volumeChange: number
  liquidity: number
  holders: number
  marketCap: number
  createdAt: string
  riskScore: number
  potentialScore: number
  isGoldenDog: boolean
  alerts: string[]
}

const TokenMonitor: React.FC = () => {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'golden' | 'risky' | 'potential'>('all')
  const [sortBy, setSortBy] = useState<'priceChange5m' | 'volume24h' | 'marketCap' | 'riskScore'>('priceChange5m')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 模拟数据
  const mockTokens: TokenData[] = [
    {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      name: 'PumpCoin',
      symbol: 'PUMP',
      price: 0.00234,
      priceChange5m: 45.2,
      priceChange1h: 78.5,
      priceChange24h: 156.7,
      volume24h: 125000,
      volumeChange: 340,
      liquidity: 45.6,
      holders: 1250,
      marketCap: 234000,
      createdAt: '2024-01-15T10:30:00Z',
      riskScore: 25,
      potentialScore: 85,
      isGoldenDog: true,
      alerts: ['高增长', '交易量激增']
    },
    {
      address: '9yKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV',
      name: 'MoonShot',
      symbol: 'MOON',
      price: 0.00156,
      priceChange5m: 23.1,
      priceChange1h: 34.2,
      priceChange24h: 89.3,
      volume24h: 89000,
      volumeChange: 180,
      liquidity: 32.1,
      holders: 890,
      marketCap: 156000,
      createdAt: '2024-01-15T09:45:00Z',
      riskScore: 35,
      potentialScore: 72,
      isGoldenDog: false,
      alerts: ['潜力代币']
    },
    {
      address: '5xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgCsW',
      name: 'RiskyCoin',
      symbol: 'RISK',
      price: 0.00089,
      priceChange5m: -12.5,
      priceChange1h: -25.3,
      priceChange24h: -45.7,
      volume24h: 45000,
      volumeChange: -60,
      liquidity: 12.3,
      holders: 234,
      marketCap: 89000,
      createdAt: '2024-01-15T08:20:00Z',
      riskScore: 78,
      potentialScore: 25,
      isGoldenDog: false,
      alerts: ['高风险', '流动性不足']
    }
  ]

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setTokens(mockTokens)
      setLoading(false)
    }, 1000)

    // 自动刷新
    if (autoRefresh) {
      const interval = setInterval(() => {
        // 模拟价格更新
        setTokens(prev => prev.map(token => ({
          ...token,
          price: token.price * (1 + (Math.random() - 0.5) * 0.1),
          priceChange5m: token.priceChange5m + (Math.random() - 0.5) * 10
        })))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const filteredTokens = tokens.filter(token => {
    switch (filter) {
      case 'golden':
        return token.isGoldenDog
      case 'risky':
        return token.riskScore > 60
      case 'potential':
        return token.potentialScore > 70 && !token.isGoldenDog
      default:
        return true
    }
  })

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    switch (sortBy) {
      case 'priceChange5m':
        return b.priceChange5m - a.priceChange5m
      case 'volume24h':
        return b.volume24h - a.volume24h
      case 'marketCap':
        return b.marketCap - a.marketCap
      case 'riskScore':
        return a.riskScore - b.riskScore
      default:
        return 0
    }
  })

  const formatPrice = (price: number) => {
    return price < 0.01 ? price.toFixed(6) : price.toFixed(4)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500'
    if (change < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500'
    if (score < 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                实时代币监控
              </CardTitle>
              <CardDescription>
                实时监控PumpFun平台新代币，智能识别金狗机会
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                自动刷新
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* 筛选器 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 rounded-md border border-border bg-background text-sm"
              >
                <option value="all">全部代币</option>
                <option value="golden">金狗代币</option>
                <option value="potential">潜力代币</option>
                <option value="risky">高风险代币</option>
              </select>
            </div>
            
            {/* 排序 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 rounded-md border border-border bg-background text-sm"
              >
                <option value="priceChange5m">5分钟涨幅</option>
                <option value="volume24h">24小时交易量</option>
                <option value="marketCap">市值</option>
                <option value="riskScore">风险评分</option>
              </select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{tokens.length}</div>
              <div className="text-sm text-muted-foreground">监控代币</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-500">{tokens.filter(t => t.isGoldenDog).length}</div>
              <div className="text-sm text-muted-foreground">金狗代币</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-yellow-500">{tokens.filter(t => t.potentialScore > 70).length}</div>
              <div className="text-sm text-muted-foreground">潜力代币</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-red-500">{tokens.filter(t => t.riskScore > 60).length}</div>
              <div className="text-sm text-muted-foreground">高风险代币</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 代币列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          sortedTokens.map((token, index) => (
            <motion.div
              key={token.address}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 ${
                token.isGoldenDog ? 'border-yellow-500/50 bg-yellow-500/5' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* 代币信息 */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {token.name}
                            {token.isGoldenDog && (
                              <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-500 rounded-full">
                                金狗
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{token.symbol}</div>
                        </div>
                      </div>
                    </div>

                    {/* 价格信息 */}
                    <div className="lg:col-span-2">
                      <div className="text-lg font-bold">${formatPrice(token.price)}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={getPriceChangeColor(token.priceChange5m)}>
                          {token.priceChange5m > 0 ? '+' : ''}{token.priceChange5m.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">5分钟</span>
                      </div>
                    </div>

                    {/* 涨跌幅 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">1小时:</span>
                          <span className={getPriceChangeColor(token.priceChange1h)}>
                            {token.priceChange1h > 0 ? '+' : ''}{token.priceChange1h.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">24小时:</span>
                          <span className={getPriceChangeColor(token.priceChange24h)}>
                            {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 交易数据 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">交易量:</span>
                          <span>${formatNumber(token.volume24h)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">流动性:</span>
                          <span>{token.liquidity.toFixed(1)} SOL</span>
                        </div>
                      </div>
                    </div>

                    {/* 风险评分 */}
                    <div className="lg:col-span-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">风险:</span>
                          <span className={getRiskColor(token.riskScore)}>
                            {token.riskScore}/100
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">潜力:</span>
                          <span className="text-green-500">
                            {token.potentialScore}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="lg:col-span-1">
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 预警标签 */}
                  {token.alerts.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {token.alerts.map((alert, alertIndex) => (
                        <span
                          key={alertIndex}
                          className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full"
                        >
                          {alert}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

export default TokenMonitor
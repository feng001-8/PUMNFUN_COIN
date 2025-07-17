import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { BarChart3, TrendingUp, TrendingDown, Activity, DollarSign, Volume2, Target, Zap, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChartData {
  timestamp: string
  price: number
  volume: number
  marketCap: number
  change24h: number
}

interface TechnicalIndicator {
  name: string
  value: number
  signal: 'buy' | 'sell' | 'neutral'
  description: string
}

interface MarketMetrics {
  totalVolume24h: number
  totalMarketCap: number
  activeTokens: number
  topGainers: {
    symbol: string
    change: number
    price: number
  }[]
  topLosers: {
    symbol: string
    change: number
    price: number
  }[]
}

const DataVisualization: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState('PUMP')
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '24h' | '7d'>('24h')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([])
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // 模拟图表数据
  const generateMockChartData = (timeframe: string): ChartData[] => {
    const now = new Date()
    const data: ChartData[] = []
    const intervals = timeframe === '1h' ? 60 : timeframe === '4h' ? 48 : timeframe === '24h' ? 24 : 168
    const intervalMs = timeframe === '1h' ? 60000 : timeframe === '4h' ? 600000 : timeframe === '24h' ? 3600000 : 3600000
    
    let basePrice = 0.00245
    
    for (let i = intervals; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMs).toISOString()
      const volatility = 0.1
      const change = (Math.random() - 0.5) * volatility
      basePrice = Math.max(0.0001, basePrice * (1 + change))
      
      data.push({
        timestamp,
        price: basePrice,
        volume: Math.random() * 100000 + 50000,
        marketCap: basePrice * 1000000000,
        change24h: (Math.random() - 0.5) * 200
      })
    }
    
    return data
  }

  const mockTechnicalIndicators: TechnicalIndicator[] = [
    {
      name: 'RSI (14)',
      value: 65.4,
      signal: 'neutral',
      description: '相对强弱指数显示中性偏强'
    },
    {
      name: 'MACD',
      value: 0.00012,
      signal: 'buy',
      description: 'MACD线上穿信号线，看涨信号'
    },
    {
      name: 'MA (20)',
      value: 0.00238,
      signal: 'buy',
      description: '价格位于20日均线上方'
    },
    {
      name: 'Bollinger Bands',
      value: 0.85,
      signal: 'neutral',
      description: '价格在布林带中轨附近'
    },
    {
      name: 'Volume Profile',
      value: 1.2,
      signal: 'buy',
      description: '成交量高于平均水平'
    },
    {
      name: 'Support/Resistance',
      value: 0.00245,
      signal: 'neutral',
      description: '接近关键支撑位'
    }
  ]

  const mockMarketMetrics: MarketMetrics = {
    totalVolume24h: 2450000,
    totalMarketCap: 125000000,
    activeTokens: 1247,
    topGainers: [
      { symbol: 'ROCKET', change: 245.7, price: 0.00156 },
      { symbol: 'MOON', change: 189.3, price: 0.00089 },
      { symbol: 'DOGE2', change: 156.8, price: 0.00234 },
      { symbol: 'PEPE3', change: 134.5, price: 0.00067 },
      { symbol: 'SHIB2', change: 98.7, price: 0.00123 }
    ],
    topLosers: [
      { symbol: 'DUMP', change: -67.8, price: 0.00045 },
      { symbol: 'BEAR', change: -54.3, price: 0.00078 },
      { symbol: 'DOWN', change: -43.2, price: 0.00156 },
      { symbol: 'FALL', change: -38.9, price: 0.00234 },
      { symbol: 'DROP', change: -29.1, price: 0.00345 }
    ]
  }

  useEffect(() => {
    setLoading(true)
    // 模拟数据加载
    setTimeout(() => {
      setChartData(generateMockChartData(timeframe))
      setTechnicalIndicators(mockTechnicalIndicators)
      setMarketMetrics(mockMarketMetrics)
      setLoading(false)
    }, 1000)
  }, [selectedToken, timeframe])

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      setChartData(generateMockChartData(timeframe))
    }, 30000) // 30秒刷新一次
    
    return () => clearInterval(interval)
  }, [autoRefresh, timeframe])

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-green-500 bg-green-500/20'
      case 'sell': return 'text-red-500 bg-red-500/20'
      case 'neutral': return 'text-yellow-500 bg-yellow-500/20'
      default: return 'text-gray-500 bg-gray-500/20'
    }
  }

  const getSignalText = (signal: string) => {
    switch (signal) {
      case 'buy': return '买入'
      case 'sell': return '卖出'
      case 'neutral': return '中性'
      default: return '观望'
    }
  }

  const formatPrice = (price: number) => {
    return price < 0.01 ? price.toFixed(6) : price.toFixed(4)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toFixed(0)
  }

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0
  const priceChange = chartData.length > 1 ? 
    ((currentPrice - chartData[chartData.length - 2].price) / chartData[chartData.length - 2].price) * 100 : 0

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部控制 */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                数据可视化中心
              </CardTitle>
              <CardDescription>
                实时市场数据分析与技术指标监控
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">代币:</label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-border bg-background"
                >
                  <option value="PUMP">PUMP</option>
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">时间:</label>
                <div className="flex gap-1">
                  {(['1h', '4h', '24h', '7d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        timeframe === tf
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'text-green-500' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? '自动刷新' : '手动刷新'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 市场概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${formatPrice(currentPrice)}</div>
                <div className="text-sm text-muted-foreground">当前价格</div>
              </div>
              <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${formatVolume(marketMetrics?.totalVolume24h || 0)}</div>
                <div className="text-sm text-muted-foreground">24h交易量</div>
              </div>
              <Volume2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${formatVolume(marketMetrics?.totalMarketCap || 0)}</div>
                <div className="text-sm text-muted-foreground">市值</div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{marketMetrics?.activeTokens || 0}</div>
                <div className="text-sm text-muted-foreground">活跃代币</div>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 价格图表 */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              {selectedToken} 价格走势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              {/* 简化的价格图表 */}
              <div className="absolute inset-0 flex items-end justify-between px-2 pb-4">
                {chartData.slice(-20).map((data, index) => {
                  const height = ((data.price - Math.min(...chartData.map(d => d.price))) / 
                    (Math.max(...chartData.map(d => d.price)) - Math.min(...chartData.map(d => d.price)))) * 200 + 20
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="bg-gradient-to-t from-primary/50 to-primary w-2 rounded-t"
                      style={{ height: `${height}px` }}
                    />
                  )
                })}
              </div>
              
              {/* Y轴标签 */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-4">
                <span>${formatPrice(Math.max(...chartData.map(d => d.price)))}</span>
                <span>${formatPrice((Math.max(...chartData.map(d => d.price)) + Math.min(...chartData.map(d => d.price))) / 2)}</span>
                <span>${formatPrice(Math.min(...chartData.map(d => d.price)))}</span>
              </div>
              
              {/* X轴标签 */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-8">
                <span>{timeframe === '1h' ? '1h前' : timeframe === '4h' ? '4h前' : timeframe === '24h' ? '24h前' : '7d前'}</span>
                <span>现在</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 技术指标 */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              技术指标
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {technicalIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{indicator.name}</div>
                    <div className="text-xs text-muted-foreground">{indicator.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{indicator.value.toFixed(indicator.name.includes('MACD') ? 5 : 2)}</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getSignalColor(indicator.signal)}`}>
                      {getSignalText(indicator.signal)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 涨跌榜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              涨幅榜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketMetrics?.topGainers.map((token, index) => (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">${formatPrice(token.price)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500 font-bold">+{token.change.toFixed(1)}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              跌幅榜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketMetrics?.topLosers.map((token, index) => (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{token.symbol}</div>
                      <div className="text-sm text-muted-foreground">${formatPrice(token.price)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-500 font-bold">{token.change.toFixed(1)}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 交易量分析 */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-500" />
            交易量分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 relative">
            {/* 简化的交易量图表 */}
            <div className="absolute inset-0 flex items-end justify-between px-2 pb-4">
              {chartData.slice(-30).map((data, index) => {
                const height = ((data.volume - Math.min(...chartData.map(d => d.volume))) / 
                  (Math.max(...chartData.map(d => d.volume)) - Math.min(...chartData.map(d => d.volume)))) * 100 + 10
                
                return (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ duration: 0.5, delay: index * 0.02 }}
                    className="bg-gradient-to-t from-blue-500/50 to-blue-500 w-1 rounded-t"
                    style={{ height: `${height}px` }}
                  />
                )
              })}
            </div>
            
            {/* Y轴标签 */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-4">
              <span>{formatVolume(Math.max(...chartData.map(d => d.volume)))}</span>
              <span>{formatVolume(Math.min(...chartData.map(d => d.volume)))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataVisualization
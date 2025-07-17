import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { LayoutDashboard, Monitor, Brain, Bell, BarChart3, Settings, Menu, X, Search, Maximize2, Minimize2, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TokenMonitor from './TokenMonitor'
import AnalysisPanel from './AnalysisPanel'
import AlertManager from './AlertManager'
import DataVisualization from './DataVisualization'

type DashboardView = 'overview' | 'monitor' | 'analysis' | 'alerts' | 'charts'

interface DashboardStats {
  totalTokensMonitored: number
  activeAlerts: number
  triggeredAlerts: number
  totalVolume24h: number
  topPerformer: {
    symbol: string
    change: number
  }
  systemStatus: 'online' | 'maintenance' | 'offline'
}

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications] = useState<number>(3)

  // 模拟仪表板统计数据
  const mockDashboardStats: DashboardStats = {
    totalTokensMonitored: 1247,
    activeAlerts: 15,
    triggeredAlerts: 3,
    totalVolume24h: 2450000,
    topPerformer: {
      symbol: 'ROCKET',
      change: 245.7
    },
    systemStatus: 'online'
  }

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setDashboardStats(mockDashboardStats)
    }, 1000)
  }, [])

  const navigationItems = [
    {
      id: 'overview',
      label: '总览',
      icon: LayoutDashboard,
      description: '系统概览和关键指标'
    },
    {
      id: 'monitor',
      label: '代币监控',
      icon: Monitor,
      description: '实时代币价格和交易监控'
    },
    {
      id: 'analysis',
      label: '智能分析',
      icon: Brain,
      description: 'AI驱动的深度分析'
    },
    {
      id: 'alerts',
      label: '预警管理',
      icon: Bell,
      description: '预警规则设置和管理'
    },
    {
      id: 'charts',
      label: '数据图表',
      icon: BarChart3,
      description: '可视化数据分析'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500'
      case 'maintenance': return 'text-yellow-500'
      case 'offline': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线'
      case 'maintenance': return '维护中'
      case 'offline': return '离线'
      default: return '未知'
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toFixed(0)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* 系统状态卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-transparent border-border/50 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                          {dashboardStats?.totalTokensMonitored || 0}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">监控代币</div>
                      </div>
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-600/20">
                        <Monitor className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-transparent border-border/50 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                          {dashboardStats?.activeAlerts || 0}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">活跃预警</div>
                      </div>
                      <div className="p-3 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20">
                        <Bell className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-transparent border-border/50 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                          {dashboardStats?.triggeredAlerts || 0}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">已触发预警</div>
                      </div>
                      <div className="p-3 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20">
                        <Bell className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-transparent border-border/50 hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                          ${formatVolume(dashboardStats?.totalVolume24h || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">24h交易量</div>
                      </div>
                      <div className="p-3 rounded-full bg-gradient-to-r from-purple-500/20 to-purple-600/20">
                        <BarChart3 className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 系统状态和最佳表现者 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="bg-transparent border-border/50 hover:scale-[1.02] transition-transform duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10">
                        <Settings className="w-5 h-5 text-primary" />
                      </div>
                      系统状态
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">系统状态:</span>
                      <span className={`font-semibold ${getStatusColor(dashboardStats?.systemStatus || 'offline')}`}>{getStatusText(dashboardStats?.systemStatus || 'offline')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">数据更新:</span>
                      <span className="text-green-500 font-semibold">实时</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">API状态:</span>
                      <span className="text-green-500 font-semibold">正常</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">延迟:</span>
                      <span className="text-green-500 font-semibold">&lt; 100ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="bg-transparent border-border/50 hover:scale-[1.02] transition-transform duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                      今日最佳表现
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <div className="text-4xl font-bold gradient-text animate-pulse">
                          {dashboardStats?.topPerformer.symbol || 'N/A'}
                        </div>
                        <div className="absolute inset-0 text-4xl font-bold gradient-text opacity-30 blur-sm">
                          {dashboardStats?.topPerformer.symbol || 'N/A'}
                        </div>
                      </div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                        +{dashboardStats?.topPerformer.change.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        24小时涨幅
                      </div>
                      <Button 
                        variant="gradient" 
                        size="sm"
                        className="hover:scale-105 transition-transform duration-200"
                        onClick={() => {
                          setSelectedToken(dashboardStats?.topPerformer.symbol || null)
                          setCurrentView('analysis')
                        }}
                      >
                        查看分析
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 快速操作 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="bg-transparent border-border/50 hover:scale-[1.01] transition-transform duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    快速操作
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-3 border-2 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300"
                        onClick={() => setCurrentView('monitor')}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-600/20">
                          <Monitor className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">代币监控</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-3 border-2 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
                        onClick={() => setCurrentView('analysis')}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-600/20">
                          <Brain className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium">智能分析</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-3 border-2 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300"
                        onClick={() => setCurrentView('alerts')}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500/20 to-orange-600/20">
                          <Bell className="w-6 h-6 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium">预警管理</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outline" 
                        className="h-24 flex flex-col gap-3 border-2 hover:border-green-500/50 hover:bg-green-500/10 transition-all duration-300"
                        onClick={() => setCurrentView('charts')}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-green-600/20">
                          <BarChart3 className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">数据图表</span>
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )
      case 'monitor':
        return <TokenMonitor />
      case 'analysis':
        return <AnalysisPanel tokenAddress={selectedToken || undefined} />
      case 'alerts':
        return <AlertManager />
      case 'charts':
        return <DataVisualization />
      default:
        return <div>页面未找到</div>
    }
  }

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 侧边栏 */}
      <AnimatePresence>
    </div>
  )
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-64 bg-card/95 backdrop-blur-sm border-r border-border z-40"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold gradient-text">PumpFun AI</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon
                  const isActive = currentView === item.id
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as DashboardView)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                      {item.id === 'alerts' && notifications > 0 && (
                        <div className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {notifications}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="w-4 h-4" />
              </Button>
              
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold">
                  {navigationItems.find(item => item.id === currentView)?.label || '总览'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {navigationItems.find(item => item.id === currentView)?.description || ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 搜索框 */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索代币..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {/* 全屏切换 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
              {/* 通知 */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setCurrentView('alerts')}
              >
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </div>
                )}
              </Button>
              
              {/* 设置 */}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="p-6">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentView()}
          </motion.div>
        </main>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
};

export default Dashboard
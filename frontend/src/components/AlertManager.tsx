import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Bell, Plus, Settings, Trash2, Edit, AlertTriangle, TrendingUp, Users, Activity, Target, Clock, CheckCircle, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Alert {
  id: string
  name: string
  type: 'price' | 'volume' | 'technical' | 'kol' | 'sentiment'
  condition: {
    operator: 'above' | 'below' | 'equals' | 'change'
    value: number
    timeframe?: string
  }
  target: {
    tokenAddress?: string
    tokenSymbol?: string
    indicator?: string
  }
  status: 'active' | 'triggered' | 'paused'
  createdAt: string
  triggeredAt?: string
  priority: 'low' | 'medium' | 'high'
  notifications: {
    telegram: boolean
    email: boolean
    push: boolean
  }
}

interface AlertHistory {
  id: string
  alertId: string
  alertName: string
  triggeredAt: string
  message: string
  type: string
  priority: 'low' | 'medium' | 'high'
}

const AlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'active' | 'history' | 'settings'>('active')
  const [newAlert, setNewAlert] = useState<Partial<Alert>>({
    type: 'price',
    condition: { operator: 'above', value: 0 },
    target: {},
    priority: 'medium',
    notifications: { telegram: true, email: false, push: true }
  })

  // 模拟预警数据
  const mockAlerts: Alert[] = [
    {
      id: '1',
      name: 'PUMP价格突破预警',
      type: 'price',
      condition: { operator: 'above', value: 0.003 },
      target: { tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', tokenSymbol: 'PUMP' },
      status: 'active',
      createdAt: '2024-01-15T08:00:00Z',
      priority: 'high',
      notifications: { telegram: true, email: true, push: true }
    },
    {
      id: '2',
      name: 'SOL交易量异常预警',
      type: 'volume',
      condition: { operator: 'above', value: 1000000, timeframe: '1h' },
      target: { tokenSymbol: 'SOL' },
      status: 'triggered',
      createdAt: '2024-01-15T06:30:00Z',
      triggeredAt: '2024-01-15T10:15:00Z',
      priority: 'medium',
      notifications: { telegram: true, email: false, push: true }
    },
    {
      id: '3',
      name: 'KOL大额交易预警',
      type: 'kol',
      condition: { operator: 'above', value: 50000 },
      target: {},
      status: 'active',
      createdAt: '2024-01-15T07:45:00Z',
      priority: 'high',
      notifications: { telegram: true, email: true, push: true }
    }
  ]

  const mockAlertHistory: AlertHistory[] = [
    {
      id: '1',
      alertId: '2',
      alertName: 'SOL交易量异常预警',
      triggeredAt: '2024-01-15T10:15:00Z',
      message: 'SOL 1小时交易量达到 1,250,000，超过设定阈值',
      type: 'volume',
      priority: 'medium'
    },
    {
      id: '2',
      alertId: '1',
      alertName: 'PUMP价格突破预警',
      triggeredAt: '2024-01-15T09:30:00Z',
      message: 'PUMP价格达到 $0.00312，突破设定价格',
      type: 'price',
      priority: 'high'
    },
    {
      id: '3',
      alertId: '3',
      alertName: 'KOL大额交易预警',
      triggeredAt: '2024-01-15T08:45:00Z',
      message: 'CryptoWhale 买入 75,000 USDC 的代币',
      type: 'kol',
      priority: 'high'
    }
  ]

  useEffect(() => {
    setAlerts(mockAlerts)
    setAlertHistory(mockAlertHistory)
  }, [])

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return <TrendingUp className="w-4 h-4" />
      case 'volume': return <Activity className="w-4 h-4" />
      case 'technical': return <Target className="w-4 h-4" />
      case 'kol': return <Users className="w-4 h-4" />
      case 'sentiment': return <Bell className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'price': return 'text-green-500'
      case 'volume': return 'text-blue-500'
      case 'technical': return 'text-purple-500'
      case 'kol': return 'text-orange-500'
      case 'sentiment': return 'text-pink-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/20'
      case 'low': return 'text-green-500 bg-green-500/20'
      default: return 'text-gray-500 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'triggered': return <Bell className="w-4 h-4 text-orange-500" />
      case 'paused': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const handleCreateAlert = () => {
    if (newAlert.name && newAlert.condition?.value) {
      const alert: Alert = {
        id: Date.now().toString(),
        name: newAlert.name,
        type: newAlert.type || 'price',
        condition: newAlert.condition,
        target: newAlert.target || {},
        status: 'active',
        createdAt: new Date().toISOString(),
        priority: newAlert.priority || 'medium',
        notifications: newAlert.notifications || { telegram: true, email: false, push: true }
      }
      setAlerts([...alerts, alert])
      setShowCreateForm(false)
      setNewAlert({
        type: 'price',
        condition: { operator: 'above', value: 0 },
        target: {},
        priority: 'medium',
        notifications: { telegram: true, email: false, push: true }
      })
    }
  }

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId))
  }

  const handleToggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: alert.status === 'active' ? 'paused' : 'active' }
        : alert
    ))
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                预警管理中心
              </CardTitle>
              <CardDescription>
                设置和管理智能预警规则，及时捕捉市场机会
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
              variant="gradient"
            >
              <Plus className="w-4 h-4" />
              创建预警
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{alerts.filter(a => a.status === 'active').length}</div>
                <div className="text-sm text-muted-foreground">活跃预警</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-500">{alerts.filter(a => a.status === 'triggered').length}</div>
                <div className="text-sm text-muted-foreground">已触发</div>
              </div>
              <Bell className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-500">{alerts.filter(a => a.priority === 'high').length}</div>
                <div className="text-sm text-muted-foreground">高优先级</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-500">{alertHistory.length}</div>
                <div className="text-sm text-muted-foreground">历史记录</div>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页导航 */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: 'active', label: '活跃预警', icon: CheckCircle },
          { key: 'history', label: '历史记录', icon: Clock },
          { key: 'settings', label: '设置', icon: Settings }
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

      {/* 创建预警表单 */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>创建新预警</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">预警名称</label>
                    <input
                      type="text"
                      placeholder="输入预警名称"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      value={newAlert.name || ''}
                      onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">预警类型</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      value={newAlert.type}
                      onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                    >
                      <option value="price">价格预警</option>
                      <option value="volume">交易量预警</option>
                      <option value="technical">技术指标预警</option>
                      <option value="kol">KOL动态预警</option>
                      <option value="sentiment">情绪预警</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">条件</label>
                    <div className="flex gap-2">
                      <select
                        className="px-3 py-2 rounded-lg border border-border bg-background"
                        value={newAlert.condition?.operator}
                        onChange={(e) => setNewAlert({ 
                          ...newAlert, 
                          condition: { ...newAlert.condition!, operator: e.target.value as any }
                        })}
                      >
                        <option value="above">大于</option>
                        <option value="below">小于</option>
                        <option value="equals">等于</option>
                        <option value="change">变化</option>
                      </select>
                      <input
                        type="number"
                        placeholder="数值"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background"
                        value={newAlert.condition?.value || ''}
                        onChange={(e) => setNewAlert({ 
                          ...newAlert, 
                          condition: { ...newAlert.condition!, value: parseFloat(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">优先级</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      value={newAlert.priority}
                      onChange={(e) => setNewAlert({ ...newAlert, priority: e.target.value as any })}
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">代币符号</label>
                    <input
                      type="text"
                      placeholder="如: PUMP, SOL"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                      value={newAlert.target?.tokenSymbol || ''}
                      onChange={(e) => setNewAlert({ 
                        ...newAlert, 
                        target: { ...newAlert.target!, tokenSymbol: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">通知方式</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAlert.notifications?.telegram}
                          onChange={(e) => setNewAlert({ 
                            ...newAlert, 
                            notifications: { ...newAlert.notifications!, telegram: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Telegram</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAlert.notifications?.email}
                          onChange={(e) => setNewAlert({ 
                            ...newAlert, 
                            notifications: { ...newAlert.notifications!, email: e.target.checked }
                          })}
                        />
                        <span className="text-sm">邮件</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAlert.notifications?.push}
                          onChange={(e) => setNewAlert({ 
                            ...newAlert, 
                            notifications: { ...newAlert.notifications!, push: e.target.checked }
                          })}
                        />
                        <span className="text-sm">推送</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button onClick={handleCreateAlert} variant="gradient">
                    创建预警
                  </Button>
                  <Button 
                    onClick={() => setShowCreateForm(false)} 
                    variant="outline"
                  >
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标签页内容 */}
      <motion.div
        key={selectedTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedTab === 'active' && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getAlertTypeColor(alert.type)} bg-current/20`}>
                        {getAlertTypeIcon(alert.type)}
                      </div>
                      <div>
                        <div className="font-semibold">{alert.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.target.tokenSymbol} {alert.condition.operator} {alert.condition.value}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          创建于 {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(alert.priority)}`}>
                        {alert.priority === 'high' ? '高' : alert.priority === 'medium' ? '中' : '低'}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(alert.status)}
                        <span className="text-sm">
                          {alert.status === 'active' ? '活跃' : alert.status === 'triggered' ? '已触发' : '暂停'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAlert(alert.id)}
                        >
                          {alert.status === 'active' ? '暂停' : '启用'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-4">
            {alertHistory.map((history) => (
              <Card key={history.id} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getAlertTypeColor(history.type)} bg-current/20 mt-1`}>
                        {getAlertTypeIcon(history.type)}
                      </div>
                      <div>
                        <div className="font-semibold">{history.alertName}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {history.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          触发时间: {new Date(history.triggeredAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(history.priority)}`}>
                      {history.priority === 'high' ? '高' : history.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === 'settings' && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>预警设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">通知设置</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>启用Telegram通知</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>启用邮件通知</span>
                      <input type="checkbox" className="rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>启用推送通知</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">预警频率</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>高优先级预警间隔</span>
                      <select className="px-3 py-1 rounded border border-border bg-background">
                        <option>立即</option>
                        <option>1分钟</option>
                        <option>5分钟</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span>中优先级预警间隔</span>
                      <select className="px-3 py-1 rounded border border-border bg-background">
                        <option>1分钟</option>
                        <option>5分钟</option>
                        <option>15分钟</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span>低优先级预警间隔</span>
                      <select className="px-3 py-1 rounded border border-border bg-background">
                        <option>5分钟</option>
                        <option>15分钟</option>
                        <option>30分钟</option>
                      </select>
                    </label>
                  </div>
                </div>
                
                <Button variant="gradient">保存设置</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default AlertManager
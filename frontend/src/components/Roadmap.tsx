import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { CheckCircle, Circle, Clock, Rocket, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const Roadmap: React.FC = () => {
  const roadmapItems = [
    {
      phase: 'Phase 1',
      title: '核心分析引擎',
      description: '基础智能分析功能，支持实时代币监控和风险评估',
      status: 'completed',
      icon: CheckCircle,
      date: '2024 Q1',
      features: [
        '基础AI分析算法',
        '实时代币监控',
        '风险评估体系',
        '预警通知系统'
      ]
    },
    {
      phase: 'Phase 2',
      title: 'Web智能分析平台',
      description: '完整的Web界面，提供丰富的数据可视化和分析工具',
      status: 'in-progress',
      icon: Clock,
      date: '2024 Q2',
      features: [
        '交互式仪表板',
        '高级图表分析',
        'KOL钱包追踪',
        '市场情绪分析'
      ]
    },
    {
      phase: 'Phase 3',
      title: 'AI算法优化',
      description: '引入更先进的机器学习模型，提高金狗识别精度',
      status: 'planned',
      icon: Target,
      date: '2024 Q3',
      features: [
        '深度学习模型',
        '多维度情绪分析',
        '聪明钱行为预测',
        '自适应预警策略'
      ]
    },
    {
      phase: 'Phase 4',
      title: '移动端应用',
      description: 'iOS和Android原生应用，随时随地监控市场动态',
      status: 'planned',
      icon: Rocket,
      date: '2024 Q4',
      features: [
        'iOS/Android应用',
        '实时推送通知',
        '离线数据缓存',
        '指纹识别安全'
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'in-progress':
        return 'text-yellow-500'
      case 'planned':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20'
      case 'in-progress':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'planned':
        return 'bg-gray-500/10 border-gray-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <section id="roadmap" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">发展蓝图</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我们的愿景是打造最智能、最可靠的金狗预警和风险评估平台，以下是我们的发展计划
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-yellow-500 to-gray-400 transform md:-translate-x-0.5" />

          <div className="space-y-12">
            {roadmapItems.map((item, index) => {
              const IconComponent = item.icon
              const isEven = index % 2 === 0
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-4 md:left-1/2 w-8 h-8 transform md:-translate-x-4 z-10">
                    <div className={`w-8 h-8 rounded-full border-4 border-background ${getStatusBg(item.status)} flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${getStatusColor(item.status)}`} />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`ml-16 md:ml-0 ${isEven ? 'md:mr-8 md:text-right' : 'md:ml-8'} md:w-1/2`}>
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                      <CardHeader>
                        <div className={`flex items-center gap-3 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(item.status)} ${getStatusColor(item.status)}`}>
                            {item.phase}
                          </div>
                          <div className="text-sm text-muted-foreground">{item.date}</div>
                        </div>
                        <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className={`space-y-2 ${isEven ? 'md:text-right' : ''}`}>
                          {item.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className={`flex items-center gap-2 text-sm text-muted-foreground ${isEven ? 'md:flex-row-reverse' : ''}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 gradient-text">加入我们的旅程</h3>
              <p className="text-muted-foreground mb-6">
                成为PumpFun智能分析系统的用户，与我们一起见证AI金狗预警的未来
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-all duration-300 glow-green">
                  立即开始
                </button>
                <button className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  了解更多
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

export default Roadmap
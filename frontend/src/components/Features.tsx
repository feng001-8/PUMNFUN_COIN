import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Bot, Zap, Shield, TrendingUp, Clock, Target, Brain, BarChart3, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const Features: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: '智能分析引擎',
      description: '多维度AI分析算法，综合技术指标、社交媒体情绪、KOL行为等数据，精准识别金狗项目。',
      gradient: 'from-blue-500 to-cyan-500',
      benefits: ['95%预警准确率', '实时数据分析', '多维度评分']
    },
    {
      icon: Zap,
      title: '实时预警系统',
      description: '毫秒级金狗检测和风险预警，第一时间发现投资机会，助您抢占先机。',
      gradient: 'from-yellow-500 to-orange-500',
      benefits: ['毫秒级响应', '24/7监控', '智能推送']
    },
    {
      icon: Shield,
      title: '风险评估体系',
      description: '全方位风险分析，包括合约安全、流动性风险、巨鲸持仓等，帮您规避投资陷阱。',
      gradient: 'from-green-500 to-emerald-500',
      benefits: ['合约安全检测', '流动性分析', '风险评级']
    },
    {
      icon: Target,
      title: 'KOL钱包追踪',
      description: '实时追踪知名KOL和聪明钱钱包动向，跟随成功投资者的步伐。',
      gradient: 'from-purple-500 to-pink-500',
      benefits: ['聪明钱追踪', 'KOL动向监控', '投资策略分析']
    },
    {
      icon: TrendingUp,
      title: '市场情绪分析',
      description: '分析社交媒体情绪、交易量变化、价格走势等，全面把握市场脉搏。',
      gradient: 'from-red-500 to-rose-500',
      benefits: ['情绪指数监控', '热度趋势分析', '市场预测']
    },
    {
      icon: BarChart3,
      title: '数据可视化',
      description: '直观的图表展示和数据分析工具，让复杂的市场数据一目了然。',
      gradient: 'from-indigo-500 to-blue-500',
      benefits: ['实时图表', '数据报告', '趋势分析']
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">核心功能</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PumpFun智能分析系统集成了最先进的AI技术和数据分析算法，为您提供全方位的金狗预警和风险评估解决方案
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-500 group hover:shadow-2xl hover:shadow-primary/20 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <CardHeader className="text-center relative z-10">
                    <div className="mx-auto mb-4 relative">
                      <motion.div 
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-4 group-hover:scale-110 transition-transform duration-300`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <IconComponent className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-300`} />
                    </div>
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative z-10">
                    <CardDescription className="text-center text-muted-foreground leading-relaxed mb-6">
                      {feature.description}
                    </CardDescription>
                    
                    {/* Benefits List */}
                    <div className="space-y-2 mb-6">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <motion.div
                          key={benefitIndex}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: benefitIndex * 0.1 }}
                          className="flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="text-center">
                      <Button variant="ghost" className="group/btn p-0 h-auto font-medium text-primary hover:text-primary">
                        了解更多
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">95.2%</div>
            <div className="text-sm text-muted-foreground">预警准确率</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">&lt;100ms</div>
            <div className="text-sm text-muted-foreground">响应时间</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">50K+</div>
            <div className="text-sm text-muted-foreground">监控代币</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">成功预警</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features
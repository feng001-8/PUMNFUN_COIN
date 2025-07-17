import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Shield, Users, Award, TrendingUp, Zap, Bot, CheckCircle, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const About: React.FC = () => {
  const achievements = [
    {
      icon: Users,
      number: '1000+',
      label: '成功预警次数',
      description: '精准捕捉优质代币机会'
    },
    {
      icon: TrendingUp,
      number: '500+',
      label: '监控代币数',
      description: '实时监控PumpFun平台代币'
    },
    {
      icon: Award,
      number: '95.2%',
      label: '预警准确率',
      description: '经过验证的预警准确率'
    },
    {
      icon: Shield,
      number: '24/7',
      label: '实时监控',
      description: '全天候代币数据监控'
    }
  ]

  const features = [
    {
      title: '智能分析引擎',
      description: '多维度AI分析算法，综合技术指标、情绪分析、KOL追踪和市场数据',
      icon: Bot,
      benefits: [
        '技术指标分析(RSI、MACD)',
        '社交媒体情绪监控',
        'KOL钱包行为追踪',
        '综合评分体系'
      ]
    },
    {
      title: '实时预警系统',
      description: '毫秒级金狗检测和风险预警，第一时间发现投资机会',
      icon: Zap,
      benefits: [
        '金狗预警机制',
        '风险评估预警',
        '异常交易检测',
        '个性化预警配置'
      ]
    },
    {
      title: '风险管理',
      description: '全方位风险评估体系，帮助您规避投资陷阱',
      icon: Shield,
      benefits: [
        '合约安全分析',
        '流动性风险评估',
        '巨鲸持仓监控',
        '价格操控检测'
      ]
    },
    {
      title: '数据可视化',
      description: '直观的数据展示和分析工具，全面掌握市场动态',
      icon: Star,
      benefits: [
        '实时价格走势图',
        '交易量分析图表',
        '持币分布统计',
        '市场热度指数'
      ]
    }
  ]

  const testimonials = [
    {
      name: '张明',
      role: '专业交易员',
      content: 'PumpFun智能分析系统帮我提前发现了多个金狗项目。预警系统非常精准，让我的投资收益率提升了200%。',
      rating: 5
    },
    {
      name: '李华',
      role: '投资顾问',
      content: '作为投资顾问，我经常使用这个系统为客户筛选优质代币。风险评估功能帮助我们避免了很多投资陷阱。',
      rating: 5
    },
    {
      name: '王强',
      role: 'DeFi投资者',
      content: '系统的KOL追踪功能让我能跟上聪明钱的步伐。多维度分析报告为我的投资决策提供了强有力的支持。',
      rating: 5
    }
  ]

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="gradient-text">关于PumpFun智能分析系统</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            PumpFun智能分析系统是专业的代币早期发现和预警平台，专注于Solana生态中PumpFun平台的新代币监控。
            我们结合了先进的智能分析算法、实时数据监控和多维度风险评估，
            为用户提供精准的金狗预警和投资决策支持。
          </p>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
                  {achievement.number}
                </div>
                <div className="font-semibold text-foreground mb-1">
                  {achievement.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {achievement.description}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20"
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/10">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            用户<span className="gradient-text">评价</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20 max-w-4xl mx-auto">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">
                准备开始您的<span className="gradient-text">智能交易</span>之旅？
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                加入数万名用户的行列，体验AI驱动的加密货币交易革命。
                立即开始，让CORNBOT为您创造更多收益。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gradient" size="xl" className="group">
                  立即开始交易
                  <CheckCircle className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
                <Button variant="outline" size="xl">
                  联系我们
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

export default About
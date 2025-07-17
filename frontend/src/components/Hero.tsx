import React from 'react'
import { Button } from './ui/button'
import { Bot, Zap, TrendingUp, ArrowRight, Play } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeroProps {
  onEnterDashboard?: () => void
}

const Hero: React.FC<HeroProps> = ({ onEnterDashboard }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-purple-500/10" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-green-400/20 rounded-full blur-xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4 mr-2" />
            PumpFun 智能分析系统
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="gradient-text">PumpFun</span>
            <br />
            <span className="text-foreground">金狗预警</span>
            <br />
            <span className="text-foreground">智能分析系统</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            专业的PumpFun代币早期发现和预警系统，实现对Solana生态中PumpFun平台新代币的实时监控和智能分析，
            帮助您捕捉金狗机会，规避投资风险。
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">95.2%</div>
              <div className="text-sm text-muted-foreground">预警准确率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-muted-foreground">全天候监控</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">500+</div>
              <div className="text-sm text-muted-foreground">监控代币</div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              variant="gradient" 
              size="xl" 
              className="group"
              onClick={onEnterDashboard}
            >
              进入智能分析系统
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="group"
            >
              <Play className="w-5 h-5 mr-2" />
              观看演示
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60"
          >
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span className="text-sm">智能预警</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">金狗发现</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm">风险评估</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
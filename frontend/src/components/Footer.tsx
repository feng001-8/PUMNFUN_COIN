import React from 'react'
import { Bot, Github, Twitter, MessageCircle, Mail, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

const Footer: React.FC = () => {
  const socialLinks = [
    {
      name: 'Telegram',
      icon: MessageCircle,
      href: '#',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: '#',
      color: 'hover:text-blue-400'
    },
    {
      name: 'GitHub',
      icon: Github,
      href: '#',
      color: 'hover:text-gray-400'
    },
    {
      name: 'Email',
      icon: Mail,
      href: 'mailto:contact@cornbot.io',
      color: 'hover:text-green-400'
    }
  ]

  const quickLinks = [
    { name: '特性', href: '#features' },
    { name: '发展蓝图', href: '#roadmap' },
    { name: '关于我们', href: '#about' },
    { name: '帮助中心', href: '#' },
    { name: '隐私政策', href: '#' },
    { name: '服务条款', href: '#' }
  ]

  const resources = [
    { name: 'API文档', href: '#' },
    { name: '开发者指南', href: '#' },
    { name: '社区论坛', href: '#' },
    { name: '状态页面', href: '#' },
    { name: '更新日志', href: '#' },
    { name: '博客', href: '#' }
  ]

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CORNBOT</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              CORNBOT是下一代AI驱动的加密货币交易机器人，致力于为用户提供最智能、最安全的交易体验。
              我们的使命是让每个人都能轻松参与到加密货币投资中来。
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => {
                const IconComponent = link.icon
                return (
                  <motion.a
                    key={index}
                    href={link.href}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground transition-colors ${link.color}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                )
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold text-foreground mb-4">快速链接</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="font-semibold text-foreground mb-4">资源</h3>
            <ul className="space-y-3">
              {resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">订阅我们的更新</h3>
              <p className="text-muted-foreground">获取最新的功能更新和市场洞察</p>
            </div>
            <div className="flex w-full md:w-auto max-w-md">
              <input
                type="email"
                placeholder="输入您的邮箱地址"
                className="flex-1 px-4 py-2 bg-muted border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-r-lg hover:from-green-500 hover:to-blue-600 transition-all duration-300 font-medium">
                订阅
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="text-muted-foreground text-sm">
            © 2024 CORNBOT. 保留所有权利。
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
            <a href="#" className="hover:text-primary transition-colors">服务条款</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie政策</a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
import React from 'react'
import { Button } from './ui/button'
import { Menu, X, Bot, Zap, Shield, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeaderProps {
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
  onEnterDashboard?: () => void
}

const Header: React.FC<HeaderProps> = ({ isMenuOpen, setIsMenuOpen, onEnterDashboard }) => {
  const navItems = [
    { name: '首页', href: '#home' },
    { name: '功能', href: '#features' },
    { name: '关于我们', href: '#about' },
    { name: '路线图', href: '#roadmap' },
    { name: '联系我们', href: '#contact' }
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PumpFun</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-blue-500 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Button variant="outline" size="sm" className="hover:border-primary/50">
                Web应用程序
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <Button 
                variant="gradient" 
                size="sm" 
                className="shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300"
                onClick={onEnterDashboard}
              >
                进入系统
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          className="md:hidden bg-background border-t border-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 py-6 space-y-4">
            <a 
              href="#features" 
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              特性
            </a>
            <a 
              href="#roadmap" 
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              发展蓝图
            </a>
            <a 
              href="#about" 
              className="block text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              关于我们
            </a>
            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full">
                Web应用程序
              </Button>
              <Button 
                variant="gradient" 
                className="w-full"
                onClick={onEnterDashboard}
              >
                进入系统
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  )
}

export default Header
import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import About from './components/About'
import Roadmap from './components/Roadmap'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  if (showDashboard) {
    return <Dashboard />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} onEnterDashboard={() => setShowDashboard(true)} />
      <main>
        <Hero onEnterDashboard={() => setShowDashboard(true)} />
        <Features />
        <About />
        <Roadmap />
      </main>
      <Footer />
    </div>
  )
}

export default App

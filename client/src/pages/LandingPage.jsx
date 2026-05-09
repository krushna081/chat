import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lock, MessageCircle, Zap } from 'lucide-react';
import '@/styles/LandingPage.css';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="landing-page min-h-screen bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyber-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyber-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="flex justify-between items-center px-8 py-6">
          <motion.div className="text-3xl font-bold cyber-glow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            🔐 SecureChat
          </motion.div>
          <div className="space-x-4">
            <Link to="/login">
              <button className="px-6 py-2 btn-secondary">Login</button>
            </Link>
            <Link to="/signup">
              <button className="px-6 py-2 btn-primary">Sign Up</button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.div
          className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className="text-5xl md:text-7xl font-bold mb-6 cyber-glow" variants={itemVariants}>
            Private Messaging<br />
            Evolved
          </motion.h1>

          <motion.p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl" variants={itemVariants}>
            Military-grade end-to-end encryption. Self-destructing messages. Zero server logs. Your privacy is non-negotiable.
          </motion.p>

          <motion.div className="hero-buttons flex gap-4 mb-12" variants={itemVariants}>
            <Link to="/signup">
              <button className="px-8 py-3 btn-primary text-lg">Get Started</button>
            </Link>
            <button className="px-8 py-3 btn-secondary text-lg">Learn More</button>
          </motion.div>

          {/* Features Grid */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl" variants={containerVariants}>
            {[
              { icon: <Lock size={32} />, title: 'End-to-End Encrypted', desc: 'AES-256 GCM encryption' },
              { icon: <MessageCircle size={32} />, title: 'Self-Destructing', desc: 'Messages auto-delete' },
              { icon: <Zap size={32} />, title: 'Real-Time', desc: 'Instant messaging' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="feature-card glass-dark p-6 rounded-xl text-center hover:scale-105 transition-transform"
                variants={itemVariants}
              >
                <div className="text-cyber-100 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

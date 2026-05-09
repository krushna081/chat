import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-900 via-gray-900 to-cyber-900 flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertTriangle size={96} className="mx-auto text-red-500 mb-6" />
        <h1 className="text-6xl font-bold cyber-glow mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-3">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist. Let's get you back to safety.
        </p>

        <Link to="/">
          <motion.button
            className="btn-primary px-8 py-3 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <motion.div
        className="not-found-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AlertTriangle size={72} className="not-found-icon" aria-hidden="true" />
        <h1>404</h1>
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary not-found-link">
          Go home
        </Link>
      </motion.div>
    </div>
  );
}

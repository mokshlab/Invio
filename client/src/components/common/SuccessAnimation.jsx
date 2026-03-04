import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

/**
 * Full-screen overlay celebration that auto-dismisses.
 * Show when an invoice is created, paid, etc.
 *
 * @param {{ show: boolean, message?: string, onDone?: () => void }} props
 */
const SuccessAnimation = ({ show, message = 'Success!', onDone }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onAnimationComplete={(def) => {
          // auto-dismiss after showing
          if (def === 'exit' && onDone) onDone();
        }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-3 max-w-xs mx-4"
        >
          {/* Animated check ring */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </motion.div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center"
          >
            {message}
          </motion.p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SuccessAnimation;

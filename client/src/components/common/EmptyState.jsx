import { motion } from 'framer-motion';

/**
 * Reusable empty-state component with illustration ring, heading, copy and optional CTA.
 *
 * @param {{ icon: React.ElementType, title: string, description: string, action?: React.ReactNode, compact?: boolean }} props
 */
const EmptyState = ({ icon: Icon, title, description, action, compact = false }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35 }}
    className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'}`}
  >
    {/* Illustration ring */}
    <div className="relative mb-5">
      <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-full scale-150 blur-2xl opacity-40" />
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200/50 dark:border-primary-700/30 flex items-center justify-center">
        <Icon className="w-7 h-7 text-primary-500 dark:text-primary-400" strokeWidth={1.5} />
      </div>
    </div>

    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">{description}</p>

    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

export default EmptyState;

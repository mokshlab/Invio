import { FileText, Sparkles, BarChart3, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const highlights = [
  { icon: Sparkles, title: 'AI Generation', desc: 'Create invoices from natural language' },
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Revenue trends & payment insights' },
  { icon: Shield, title: 'Secure & Fast', desc: 'Token auth with encrypted cookies' },
  { icon: Zap, title: 'Instant PDF', desc: 'Export & share with one click' },
];

const AuthLayout = ({ headline, headlineAccent, subtitle, children }) => (
  <div className="min-h-screen flex">
    {/* -------- Left Panel — Branding -------- */}
    <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-gray-900 via-gray-900 to-primary-950 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col gap-y-8 py-8 px-8 w-full">
      {/* relative z-10 flex flex-col justify-between py-12 px-16 w-full */}
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Invio</span>
          </div>
        </motion.div>

        {/* Hero text */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4"
          >
            {headline}<br />
            <span className="text-primary-400">{headlineAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-lg max-w-md"
          >
            {subtitle}
          </motion.p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4 mt-10">
            {highlights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* -------- Right Panel — Form Content -------- */}
    <div className="w-full lg:w-[45%] flex items-center justify-center pt-4 pb-4 px-8 sm:pt-6 sm:pb-6 sm:px-12 bg-white dark:bg-gray-950">
    {/* w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 bg-white dark:bg-gray-950 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px]"
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-10 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Invio</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            AI-Powered Invoice Management
          </p>
        </div>

        {children}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;

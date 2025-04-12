"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 800); // Delay to finish exit animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50  flex flex-col items-center justify-center transition-colors duration-500"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.img
            src="/logo.png"
            alt="Logo"
            className="w-24 h-24 mb-4 dark:hidden"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
          <motion.img
            src="/logo_dark.png"
            alt="Logo"
            className="w-24 h-24 mb-4 hidden dark:block"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.8 }}
          />

          <motion.h1
            className="text-3xl font-bold text-neutral-600 dark:text-white transition-colors duration-500"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            SyncPen ~ Mainak
          </motion.h1>

          <motion.p
            className="mt-2 text-sm text-neutral-500 dark:text-neutral-300 transition-colors duration-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Your Digital Productivity Hub
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

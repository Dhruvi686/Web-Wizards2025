import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Vote, BarChart3, Home, Github, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const Navbar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Simulate loading on route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Loading animation duration

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Track scroll progress for smooth animations
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = 200; // Maximum scroll distance for full animation
      const progress = Math.min(scrollTop / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: "/",
      label: "Polls",
      icon: Home,
      description: "Browse all polls"
    },
    {
      path: "/admin",
      label: "Admin",
      icon: Shield,
      description: "Admin Dashboard"
    },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/60"
    >
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex h-16 items-center relative"
          style={{
            justifyContent: scrollProgress > 0.1 ? 'center' : 'space-between',
            gap: scrollProgress > 0.1 ? `${Math.max(8 - (scrollProgress * 4), 2)}rem` : 'normal',
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Logo and Brand */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3"
            animate={{
              scale: 1 - (scrollProgress * 0.08), // Gentle scale down
              opacity: Math.max(1 - (scrollProgress * 0.15), 0.85), // Slight fade for depth
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 group-hover:opacity-30 transition-opacity"
                />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                  <Vote className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PollSystem
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                  Democratic Voting
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Navigation Links */}
          <motion.nav 
            className="hidden md:flex items-center space-x-6"
            animate={{
              scale: 1 - (scrollProgress * 0.05), // Gentle scale down
              opacity: Math.max(1 - (scrollProgress * 0.15), 0.85), // Slight fade for depth
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <motion.div
                  key={item.path}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Link
                    to={item.path}
                    className={`
                      relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50"
                          : "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* Mobile menu button */}
          <motion.div 
            className="md:hidden"
            animate={{
              opacity: Math.max(1 - (scrollProgress * 2), 0), // Gradual fade out
              scale: Math.max(1 - (scrollProgress * 0.4), 0.6), // Smooth scale down
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Button variant="ghost" size="sm">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Progress bar for loading states */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ 
          scaleX: isLoading ? [0, 0.3, 0.7, 1] : 0,
          opacity: isLoading ? 1 : 0
        }}
        transition={{
          duration: isLoading ? 0.8 : 0.2,
          ease: isLoading ? "easeInOut" : "easeOut",
          times: isLoading ? [0, 0.3, 0.7, 1] : undefined
        }}
        className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 origin-left shadow-lg"
      />
    </motion.header>
  );
};

export default Navbar;

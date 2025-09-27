import React from "react";
import { motion } from "framer-motion";
import { Heart, Code, Coffee, Github, Mail } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand and Description */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg">
                <div className="w-4 h-4 bg-white dark:bg-slate-900 rounded-sm" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                PollSystem MVP
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              A modern, secure polling platform built with React and Node.js.
              Create polls, collect votes via email tokens, and view real-time results.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-500">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-red-500" />
              <span>using</span>
              <Code className="w-3 h-3" />
              <span>and lots of</span>
              <Coffee className="w-3 h-3 text-amber-600" />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              Features
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span>Email-based voting tokens</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span>Real-time result updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                <span>Secure vote tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                <span>Mobile-friendly interface</span>
              </li>
            </ul>
          </div>

          {/* Contact and Links */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              Connect
            </h3>
            <div className="flex space-x-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <Github className="w-3 h-3" />
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="mailto:hello@pollsystem.com"
                    className="flex items-center space-x-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span className="hidden sm:inline">Email</span>
                  </a>
                </Button>
              </motion.div>
            </div>

            {/* Tech Stack */}
            <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
              <p>Built with:</p>
              <div className="flex flex-wrap gap-1">
                {["React", "Vite", "Node.js", "MongoDB", "shadcn/ui"].map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
              <span>© {currentYear} PollSystem</span>
              <span>•</span>
              <span>MVP Version</span>
              <span>•</span>
              <span>Made for WebWizards</span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center space-x-1"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>System Operational</span>
              </motion.div>
              <span>•</span>
              <span>Real-time Updates</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-64 h-64 bg-gradient-to-l from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-32 w-64 h-64 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-full blur-3xl opacity-30" />
      </div>
    </motion.footer>
  );
};

export default Footer;

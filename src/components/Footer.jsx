import React from "react";
import { motion } from "framer-motion";
import { Heart, Code, Coffee, Github, Mail, Twitter, Linkedin } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative border-t bg-gradient-to-br from-white to-slate-100 dark:from-slate-950 dark:to-slate-900"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Description */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg">
                <div className="w-4 h-4 bg-white dark:bg-slate-900 rounded-sm" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                PollSystem
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              A modern, secure polling platform built with React and Node.js.
              Create polls, collect votes via email tokens, and view real-time results.
            </p>
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

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              Resources
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#" className="hover:text-blue-500">Docs</a></li>
              <li><a href="#" className="hover:text-blue-500">API</a></li>
              <li><a href="#" className="hover:text-blue-500">Support</a></li>
              <li><a href="#" className="hover:text-blue-500">Blog</a></li>
            </ul>
          </div>

          {/* Connect & Social */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              Connect
            </h3>
            <div className="flex space-x-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:hello@pollsystem.com">
                    <Mail className="w-4 h-4" />
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://twitter.com">
                    <Twitter className="w-4 h-4" />
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://linkedin.com">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center space-x-4">
              <span>© {currentYear} PollSystem</span>
              <span>•</span>
              <span>Made for WebWizards</span>
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
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
    </motion.footer>
  );
};

export default Footer;

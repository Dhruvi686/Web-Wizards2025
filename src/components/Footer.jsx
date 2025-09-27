import React from "react";
import { motion } from "framer-motion";
import { Heart, Code, Coffee, Github, Mail, Twitter, Linkedin, Vote } from "lucide-react";
import { Button } from "./ui/button";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative border-t bg-gradient-to-br from-blue-600 to-purple-600"
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and Description */}
          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30"
                />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-full">
                  <Vote className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  PollSystem
                </span>
                <span className="text-xs text-white/60 -mt-1">
                  Democratic Voting
                </span>
              </div>
            </motion.div>
            <p className="text-sm text-white/80 leading-relaxed">
              A modern, secure polling platform built with React and Node.js.
              Create polls, collect votes via email tokens, and view real-time results.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-white">
              Features
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
                <span>Email-based voting tokens</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                <span>Real-time result updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-300 rounded-full" />
                <span>Secure vote tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-300 rounded-full" />
                <span>Mobile-friendly interface</span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-medium text-white">
              Resources
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Connect & Social */}
          <div className="space-y-3">
            <h3 className="font-medium text-white">
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
          className="mt-12 pt-6 border-t border-white/20"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-white/70">
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
                <div className="w-2 h-2 bg-green-400 rounded-full" />
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

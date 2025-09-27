import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const NotFound = () => {
  return (
    <div className="min-h-96 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md mx-auto"
      >
        <Card>
          <CardContent className="pt-12 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="space-y-6"
            >
              {/* 404 Animation */}
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-8xl font-bold text-slate-200 dark:text-slate-800"
                >
                  404
                </motion.div>
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <AlertTriangle className="h-16 w-16 text-orange-500" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Page Not Found
                </h1>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Oops! The page you're looking for doesn't exist. It might have been
                  moved, deleted, or you entered the wrong URL.
                </p>
              </div>

              {/* Suggestions */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Here are some suggestions:
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Check the URL for typos</li>
                  <li>• Go back to the previous page</li>
                  <li>• Visit our homepage to find what you need</li>
                  <li>• Browse active polls</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link to="/">
                    <Button className="w-full sm:w-auto">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-500">
                  Need help? Check our{" "}
                  <Link to="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                    active polls
                  </Link>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Floating Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              rotate: [0, -180, -360],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/3 right-1/3 w-3 h-3 bg-purple-200 dark:bg-purple-800 rounded-full opacity-30"
          />
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -80, 0],
              rotate: [0, 90, 180],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-green-200 dark:bg-green-800 rounded-full opacity-25"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

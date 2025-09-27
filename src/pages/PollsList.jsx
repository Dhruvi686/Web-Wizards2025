import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Calendar,
  TrendingUp,
  Vote,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";

import { pollAPI, apiUtils } from "../services/api";
import { usePollsList } from "../hooks/usePolling";

const PollsList = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'popular'

  // Temporary: Direct API call for debugging
  const [pollsResponse, setPollsResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      console.log('Direct API call starting...');
      const response = await pollAPI.getPolls();
      console.log('Direct API call response:', response);
      setPollsResponse(response);
      setError(null);
    } catch (err) {
      console.error('Direct API call error:', err);
      setError(err);
      toast({
        title: "Connection Error",
        description: apiUtils.formatError(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const refetch = fetchPolls;
  const isPolling = false;

  const polls = pollsResponse?.data?.polls || [];

  // Debug logging
  console.log('PollsList Debug:', {
    pollsResponse,
    polls,
    loading,
    error,
    pollsLength: polls.length
  });

  // Filter and sort polls
  const filteredAndSortedPolls = React.useMemo(() => {
    let filtered = polls.filter((poll) =>
      poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort polls
    switch (sortBy) {
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "popular":
        filtered.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
  }, [polls, searchTerm, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  // Loading state
  if (loading && polls.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
          />
          <p className="text-slate-600 dark:text-slate-400">Loading polls...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && polls.length === 0) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Unable to load polls
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {apiUtils.formatError(error)}
          </p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Active Polls
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Participate in ongoing polls and see real-time results. Your voice matters!
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1">
            <Vote className="h-4 w-4" />
            <span>{polls.length} Active Polls</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{polls.reduce((acc, poll) => acc + (poll.totalVotes || 0), 0)} Total Votes</span>
          </div>
          {isPolling && (
            <div className="flex items-center space-x-1">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="h-3 w-3 text-green-500" />
              </motion.div>
              <span className="text-green-600 dark:text-green-400">Live Updates</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 items-center justify-between"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search polls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>

          {/* View Mode */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Manual Refresh */}
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Polls Grid/List */}
      <AnimatePresence>
        {filteredAndSortedPolls.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                No polls found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm
                  ? `No polls match your search for "${searchTerm}"`
                  : "No active polls available at the moment"}
              </p>
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredAndSortedPolls.map((poll, index) => (
              <PollCard
                key={poll.id}
                poll={poll}
                index={index}
                viewMode={viewMode}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Poll Card Component
const PollCard = ({ poll, index, viewMode }) => {
  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, delay: index * 0.05 },
    },
  };

  if (viewMode === "list") {
    return (
      <motion.div variants={cardVariants}>
        <Link to={`/poll/${poll.id}`}>
          <Card className="hover:shadow-md transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {poll.title}
                    </h3>
                    <Badge variant="secondary">
                      {poll.optionsCount} options
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-1">
                    {poll.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{poll.totalVotes || 0} votes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{apiUtils.formatPollDate(poll.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariants}>
      <Link to={`/poll/${poll.id}`}>
        <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800/50 dark:hover:to-slate-700/50 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {poll.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {poll.optionsCount} options
                  </Badge>
                  {(poll.totalVotes || 0) > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {poll.totalVotes} votes
                    </Badge>
                  )}
                </div>
              </div>
              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="h-5 w-5 text-blue-500" />
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {poll.description}
            </p>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{apiUtils.formatPollDate(poll.createdAt)}</span>
              </div>
              {(poll.totalVotes || 0) > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{poll.totalVotes} votes</span>
                </div>
              )}
            </div>

            {/* Progress indicator if poll has votes */}
            {(poll.totalVotes || 0) > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-500">Participation</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (poll.totalVotes / 50) * 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default PollsList;

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Share2,
  Download,
  Eye,
  Clock,
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";

import { pollAPI, apiUtils } from "../services/api";
import { usePollResults, usePollDetails } from "../hooks/usePolling";

const Results = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState("chart"); // chart, table
  const [showPercentages, setShowPercentages] = useState(true);

  // Fetch poll details
  const {
    data: pollResponse,
    loading: pollLoading,
    error: pollError,
  } = usePollDetails(id, {
    enabled: !!id,
    onError: (error) => {
      if (error.response?.status === 404) {
        navigate("/");
        toast({
          title: "Poll Not Found",
          description: "The poll you're looking for doesn't exist.",
          variant: "destructive",
        });
      }
    },
  });

  // Fetch real-time results (polls every 3 seconds)
  const {
    data: resultsResponse,
    loading: resultsLoading,
    error: resultsError,
    isPolling,
    refetch: refetchResults,
  } = usePollResults(id, {
    enabled: !!id && !pollLoading && !pollError,
    onError: (error) => {
      console.error("Results polling error:", error);
    },
  });

  const poll = pollResponse?.data;
  const results = resultsResponse?.data?.results || [];
  const totalVotes = resultsResponse?.data?.totalVotes || 0;
  const lastUpdated = resultsResponse?.data?.lastUpdated;

  // Calculate winner
  const winner = results.length > 0
    ? results.reduce((prev, current) => (prev.votes > current.votes) ? prev : current)
    : null;

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Poll Results: ${poll?.title}`,
          text: `Check out the results for "${poll?.title}"`,
          url: url,
        });
      } catch (error) {
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Results link copied to clipboard!",
        });
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Results link copied to clipboard!",
      });
    }
  };

  // Loading state
  if (pollLoading || (resultsLoading && results.length === 0)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (pollError || resultsError) {
    const error = pollError || resultsError;
    return (
      <div className="text-center space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Unable to load results
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {apiUtils.formatError(error)}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={refetchResults} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => navigate("/")} variant="default">
              Back to Polls
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="h-6 border-l border-slate-300 dark:border-slate-600" />

          <Link to={`/poll/${id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Poll
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Results
          </Button>

          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "chart" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Poll Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-2xl">{poll.title}</CardTitle>
                {winner && totalVotes > 0 && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    Leader
                  </Badge>
                )}
              </div>

              <p className="text-slate-600 dark:text-slate-400">
                {poll.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {apiUtils.formatPollDate(poll.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{totalVotes} total votes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{results.length} options</span>
                </div>
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Closed"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Real-time indicator */}
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center space-x-4">
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

              {lastUpdated && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPercentages(!showPercentages)}
              className="text-xs"
            >
              {showPercentages ? "Hide" : "Show"} Percentages
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {totalVotes === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                      No Votes Yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      This poll hasn't received any votes yet. Be the first to vote!
                    </p>
                  </div>
                  <Link to={`/poll/${id}`}>
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Vote Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === "chart" ? (
          <ResultsChart
            results={results}
            totalVotes={totalVotes}
            showPercentages={showPercentages}
            winner={winner}
          />
        ) : (
          <ResultsTable
            results={results}
            totalVotes={totalVotes}
            showPercentages={showPercentages}
            winner={winner}
          />
        )}
      </AnimatePresence>

      {/* Statistics Card */}
      {totalVotes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Poll Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalVotes}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    Total Votes
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {results.length}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    Options
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {winner ? winner.votes : 0}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    Leading Votes
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {winner ? winner.percentage : 0}%
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500">
                    Leading Share
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

// Results Chart Component
const ResultsChart = ({ results, totalVotes, showPercentages, winner }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Results Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results
              .sort((a, b) => b.votes - a.votes)
              .map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`space-y-2 p-4 rounded-lg ${
                    winner && result.id === winner.id
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-200 dark:border-yellow-800"
                      : "bg-slate-50 dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${winner && result.id === winner.id
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }
                      `}>
                        {index + 1}
                      </div>
                      <span className={`font-medium ${
                        winner && result.id === winner.id
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {result.text}
                      </span>
                      {winner && result.id === winner.id && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {result.votes} votes
                      </span>
                      {showPercentages && (
                        <Badge variant="outline" className="font-mono">
                          {result.percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                      className={`h-3 rounded-full ${
                        winner && result.id === winner.id
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                          : "bg-gradient-to-r from-blue-500 to-purple-500"
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Results Table Component
const ResultsTable = ({ results, totalVotes, showPercentages, winner }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Detailed Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Rank
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Option
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Votes
                  </th>
                  {showPercentages && (
                    <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Percentage
                    </th>
                  )}
                  <th className="text-right py-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => b.votes - a.votes)
                  .map((result, index) => (
                    <motion.tr
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b last:border-b-0 ${
                        winner && result.id === winner.id
                          ? "bg-yellow-50 dark:bg-yellow-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="py-3">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${winner && result.id === winner.id
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }
                        `}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {result.text}
                          </span>
                          {winner && result.id === winner.id && (
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {result.votes}
                      </td>
                      {showPercentages && (
                        <td className="py-3 text-right">
                          <Badge variant="outline" className="font-mono">
                            {result.percentage}%
                          </Badge>
                        </td>
                      )}
                      <td className="py-3 text-right w-32">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: index * 0.05 }}
                            className={`h-2 rounded-full ${
                              winner && result.id === winner.id
                                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                : "bg-gradient-to-r from-blue-500 to-purple-500"
                            }`}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Results;

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Mail,
  Vote,
  BarChart3,
  Share2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";

import { pollAPI, tokenAPI, apiUtils } from "../services/api";
import { usePollDetails, usePollResults } from "../hooks/usePolling";

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Direct API calls instead of polling hooks
  const [pollResponse, setPollResponse] = useState(null);
  const [pollLoading, setPollLoading] = useState(true);
  const [pollError, setPollError] = useState(null);
  const [resultsResponse, setResultsResponse] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const fetchPoll = async () => {
    if (!id) return;
    
    try {
      setPollLoading(true);
      setPollError(null);
      console.log('Fetching poll details for ID:', id);
      const response = await pollAPI.getPoll(id);
      console.log('Poll API response:', response);
      setPollResponse(response);
    } catch (error) {
      console.error('Poll fetch error:', error);
      setPollError(error);
      if (error.response?.status === 404) {
        navigate("/");
        toast({
          title: "Poll Not Found",
          description: "The poll you're looking for doesn't exist or has been removed.",
          variant: "destructive",
        });
      }
    } finally {
      setPollLoading(false);
    }
  };

  const refetchPoll = fetchPoll;

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const poll = pollResponse?.data;
  const results = resultsResponse?.data?.results || poll?.results || [];

  // Debug logging
  console.log('PollDetail Debug:', {
    id,
    pollResponse,
    poll,
    pollLoading,
    pollError,
    results,
    pollTitle: poll?.title,
    pollOptions: poll?.options
  });

  // Handle email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setEmailLoading(true);

    try {
      const response = await tokenAPI.requestToken({
        pollId: id,
        email: email.trim(),
      });

      setEmailSent(true);
      toast({
        title: "Email Sent!",
        description: `Voting instructions have been sent to ${email}`,
      });
    } catch (error) {
      const errorMessage = apiUtils.formatError(error);

      if (apiUtils.isRateLimitError(error)) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many requests. Please wait before trying again.",
          variant: "destructive",
        });
      } else if (apiUtils.isValidationError(error)) {
        const validationErrors = apiUtils.getValidationErrors(error);
        toast({
          title: "Invalid Email",
          description: validationErrors.join(", ") || "Please enter a valid email address.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSharePoll = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: poll.title,
          text: poll.description,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Poll link copied to clipboard!",
        });
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Poll link copied to clipboard!",
      });
    }
  };

  // Loading state
  if (pollLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (pollError) {
    return (
      <div className="text-center space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Unable to load poll
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {apiUtils.formatError(pollError)}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={refetchPoll} variant="outline">
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
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Polls
        </Button>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleSharePoll}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Link to={`/results/${id}`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </Link>
        </div>
      </div>

      {/* Poll Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{poll.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {apiUtils.formatPollDate(poll.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{poll.totalVotes || 0} votes</span>
                </div>
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Closed"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {poll.description}
          </p>

          {/* Options Preview */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              Available Options:
            </h3>
            <div className="grid gap-3">
              {poll.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      {option.text}
                    </span>
                  </div>

                  {results.length > 0 && poll.settings?.showResults && (
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {results.find(r => r.id === option.id)?.votes || 0} votes
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {results.find(r => r.id === option.id)?.percentage || 0}%
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Voting Section */}
          {poll.isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg border"
            >
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Ready to Vote?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enter your email to receive a secure voting token.
                    You'll get a magic link to cast your vote instantly.
                  </p>
                </div>

                <Button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Get Voting Token
                </Button>

                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Secure voting</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>One-time use</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>Email verification</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Real-time Results Preview */}
          {poll.settings?.showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  Current Results
                </h3>
                <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-500">
                  {!resultsLoading && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                      <span>Live updates</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {result.text}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          {result.votes} votes
                        </span>
                        <Badge variant="outline">{result.percentage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Get Your Voting Token</span>
                </DialogTitle>
                <DialogDescription>
                  {emailSent
                    ? "Check your email for voting instructions!"
                    : "Enter your email address to receive a secure voting token. You'll get a magic link to vote instantly."}
                </DialogDescription>
              </DialogHeader>

              {!emailSent ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={emailLoading}
                    />
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>Your email is only used for voting verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>Voting tokens expire in 24 hours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Vote className="h-3 w-3" />
                      <span>Each token can only be used once</span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEmailModal(false)}
                      disabled={emailLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={emailLoading || !email.trim()}
                    >
                      {emailLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Token
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-6 space-y-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        Email Sent Successfully!
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Check your inbox at <strong>{email}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <p>• Click the magic link to vote instantly</p>
                    <p>• Or copy the token and visit the voting page manually</p>
                    <p>• The token expires in 24 hours</p>
                  </div>

                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setShowEmailModal(false);
                        setEmailSent(false);
                        setEmail("");
                      }}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Got It
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PollDetail;

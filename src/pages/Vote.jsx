import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote as VoteIcon,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Mail,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";

import { pollAPI, tokenAPI, apiUtils } from "../services/api";

const Vote = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // URL parameters
  const tokenFromUrl = searchParams.get("token");
  const pollIdFromUrl = searchParams.get("poll") || searchParams.get("pollId");

  // Component state
  const [step, setStep] = useState("loading"); // loading, verify, vote, success, error
  const [manualToken, setManualToken] = useState(tokenFromUrl || "");
  const [manualPollId, setManualPollId] = useState(pollIdFromUrl || "");
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(false);
  const [poll, setPoll] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [voteResult, setVoteResult] = useState(null);

  // Auto-verify token from URL
  useEffect(() => {
    if (tokenFromUrl && pollIdFromUrl) {
      verifyTokenAndLoadPoll(tokenFromUrl, pollIdFromUrl);
    } else {
      setStep("verify");
    }
  }, [tokenFromUrl, pollIdFromUrl]);

  // Verify token and load poll data
  const verifyTokenAndLoadPoll = async (token, pollId) => {
    setLoading(true);
    setStep("loading");

    try {
      // Verify token
      const tokenResponse = await tokenAPI.verifyToken(token, pollId);

      if (!tokenResponse.valid) {
        throw new Error(tokenResponse.message || "Invalid token");
      }

      setTokenData(tokenResponse.data);

      // Load poll details
      const pollResponse = await pollAPI.getPoll(pollId);
      setPoll(pollResponse.data);

      setStep("vote");
    } catch (error) {
      console.error("Token verification error:", error);
      toast({
        title: "Token Verification Failed",
        description: apiUtils.formatError(error),
        variant: "destructive",
      });
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  // Handle manual token verification
  const handleManualVerification = async (e) => {
    e.preventDefault();

    if (!manualToken.trim() || !manualPollId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both token and poll ID",
        variant: "destructive",
      });
      return;
    }

    await verifyTokenAndLoadPoll(manualToken.trim(), manualPollId.trim());
  };

  // Handle vote submission
  const handleVoteSubmission = async () => {
    if (!selectedOption) {
      toast({
        title: "No Option Selected",
        description: "Please select an option to vote for",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const voteResponse = await pollAPI.castVote(poll.id, {
        token: tokenFromUrl || manualToken,
        optionId: selectedOption,
      });

      setVoteResult(voteResponse.data);
      setStep("success");

      toast({
        title: "Vote Cast Successfully!",
        description: "Your vote has been recorded. Thank you for participating!",
      });
    } catch (error) {
      console.error("Vote submission error:", error);

      let errorMessage = apiUtils.formatError(error);
      let errorTitle = "Vote Failed";

      if (error.response?.status === 409) {
        errorTitle = "Already Voted";
        errorMessage = "This token has already been used to vote.";
      } else if (error.response?.status === 401) {
        errorTitle = "Invalid Token";
        errorMessage = "Your voting token is invalid or has expired.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
          />
          <div className="space-y-1">
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
              Verifying your voting token
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please wait while we validate your access...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  Token Verification Failed
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your voting token is invalid, expired, or has already been used.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setStep("verify");
                    setManualToken("");
                    setManualPollId("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Try Different Token
                </Button>
                <Button onClick={() => navigate("/")} className="w-full">
                  Back to Polls
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Manual token verification form
  if (step === "verify") {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <VoteIcon className="h-5 w-5 text-blue-600" />
              <span>Enter Voting Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Voting Token</Label>
                <Input
                  id="token"
                  placeholder="Enter your voting token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The token you received via email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pollId">Poll ID</Label>
                <Input
                  id="pollId"
                  placeholder="Enter poll ID"
                  value={manualPollId}
                  onChange={(e) => setManualPollId(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Found in your voting email or poll URL
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !manualToken.trim() || !manualPollId.trim()}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button variant="ghost" onClick={() => navigate("/")} className="text-sm">
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to Polls
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-500">
                <p className="font-medium">Need help?</p>
                <ul className="space-y-1 ml-4">
                  <li>• Check your email for the voting link</li>
                  <li>• Make sure you're using the correct poll ID</li>
                  <li>• Tokens expire after 24 hours</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Voting interface
  if (step === "vote" && poll) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Poll Info */}
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="text-xl">{poll.title}</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {poll.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>Voting as: {tokenData?.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Token expires: {new Date(tokenData?.expiresAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Select your choice:
                </Label>
                <div className="grid gap-3">
                  {poll.options?.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        style={{
                          borderColor: selectedOption === option.id ? "#3b82f6" : "",
                          backgroundColor: selectedOption === option.id ? "#eff6ff" : "",
                        }}
                      >
                        <input
                          type="radio"
                          name="vote-option"
                          value={option.id}
                          checked={selectedOption === option.id}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex items-center justify-between w-full">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {option.text}
                          </span>
                          {selectedOption === option.id && (
                            <Badge className="bg-blue-600 text-white">Selected</Badge>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={handleVoteSubmission}
                  disabled={loading || !selectedOption}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Casting Vote...
                    </>
                  ) : (
                    <>
                      <VoteIcon className="h-4 w-4 mr-2" />
                      Cast Your Vote
                    </>
                  )}
                </Button>

                <div className="text-center text-xs text-slate-500 dark:text-slate-500">
                  ⚠️ Your vote is final and cannot be changed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Success state
  if (step === "success" && voteResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md mx-auto"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Vote Cast Successfully! 🎉
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Thank you for participating in the poll. Your voice matters!
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Poll: {poll?.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Voted at: {voteResult.votedAt ? new Date(voteResult.votedAt).toLocaleString() : 'Just now'}
                </p>
              </div>

              <div className="space-y-2">
                <Link to={`/results/${poll?.id}`}>
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live Results
                  </Button>
                </Link>

                <Button onClick={() => navigate("/")} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Polls
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return null;
};

export default Vote;

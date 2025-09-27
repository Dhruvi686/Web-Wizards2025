import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Eye,
  RefreshCw,
  X,
  Shield,
  AlertCircle,
  Sparkles,
  Edit,
  ChevronDown,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

import { adminAPI, pollAPI, apiUtils } from "../services/api";

const AdminDashboard = () => {
  const { toast } = useToast();

  // State management
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // cards or table

  // Create poll form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // AI poll creation state
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPoll, setGeneratedPoll] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
    loading: false,
  });

  // Check authentication on mount
  useEffect(() => {
    const savedSecret = localStorage.getItem("admin_secret");
    if (savedSecret) {
      setAdminSecret(savedSecret);
      setIsAuthenticated(true);
      fetchPolls(savedSecret);
    } else {
      setLoading(false); // Set loading to false if no saved secret
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreateOptions && !event.target.closest('.relative')) {
        setShowCreateOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateOptions]);

  // Fetch all polls
  const fetchPolls = async (secret = adminSecret) => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdminPolls(secret);
      setPolls(response.data.polls || []);
    } catch (error) {
      console.error("Failed to fetch polls:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem("admin_secret");
        toast({
          title: "Authentication Failed",
          description: "Invalid admin secret. Please login again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to load polls",
          description: apiUtils.formatError(error),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle admin login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!adminSecret.trim()) {
      toast({
        title: "Admin Secret Required",
        description: "Please enter the admin secret key.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoginLoading(true);
      // Test the secret by fetching polls
      await adminAPI.getAdminPolls(adminSecret);
      setIsAuthenticated(true);
      localStorage.setItem("admin_secret", adminSecret);
      await fetchPolls(adminSecret);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
      });
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Invalid admin secret key.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminSecret("");
    setPolls([]);
    localStorage.removeItem("admin_secret");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  // Create new poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();

    if (!pollTitle.trim() || !pollDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = pollOptions.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Insufficient Options",
        description: "Please provide at least 2 poll options.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateLoading(true);
      await adminAPI.createPoll({
        title: pollTitle.trim(),
        description: pollDescription.trim(),
        options: validOptions
      }, adminSecret);

      // Reset form
      setPollTitle("");
      setPollDescription("");
      setPollOptions(["", ""]);
      setShowCreateForm(false);

      // Refresh polls
      await fetchPolls();

      toast({
        title: "Poll Created",
        description: `"${pollTitle}" has been created successfully!`,
      });
    } catch (error) {
      toast({
        title: "Failed to Create Poll",
        description: apiUtils.formatError(error),
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Add option to poll creation form
  const addOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  // Remove option from poll creation form
  const removeOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Update option text
  const updateOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Generate AI poll
  const handleGenerateAIPoll = async (e) => {
    e.preventDefault();

    if (!aiPrompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please provide a description for your poll.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAiLoading(true);
      const response = await adminAPI.generateAIPoll({
        prompt: aiPrompt.trim()
      }, adminSecret);

      const pollStructure = response.data;
      setGeneratedPoll(pollStructure);
      
      // Pre-fill the edit form with generated data
      setPollTitle(pollStructure.title);
      setPollDescription(pollStructure.description);
      setPollOptions(pollStructure.options);
      
      // Close AI form and show edit form
      setShowAIForm(false);
      setShowEditForm(true);

      toast({
        title: "Poll Generated",
        description: "AI has generated your poll. You can now edit and submit it.",
      });
    } catch (error) {
      toast({
        title: "Failed to Generate Poll",
        description: apiUtils.formatError(error),
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Submit edited AI poll
  const handleSubmitEditedPoll = async (e) => {
    e.preventDefault();

    if (!pollTitle.trim() || !pollDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both title and description.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = pollOptions.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Insufficient Options",
        description: "Please provide at least 2 poll options.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateLoading(true);
      await adminAPI.createPoll({
        title: pollTitle.trim(),
        description: pollDescription.trim(),
        options: validOptions
      }, adminSecret);

      // Reset all form data
      resetAllForms();

      // Refresh polls
      await fetchPolls();

      toast({
        title: "Poll Created",
        description: `"${pollTitle}" has been created successfully!`,
      });
    } catch (error) {
      toast({
        title: "Failed to Create Poll",
        description: apiUtils.formatError(error),
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Reset all form states
  const resetAllForms = () => {
    setPollTitle("");
    setPollDescription("");
    setPollOptions(["", ""]);
    setAiPrompt("");
    setGeneratedPoll(null);
    setShowCreateForm(false);
    setShowAIForm(false);
    setShowEditForm(false);
    setShowCreateOptions(false);
  };

  // Toggle poll status (close/reopen)
  const togglePollStatus = async (pollId, currentStatus) => {
    const action = currentStatus ? "close" : "reopen";
    setConfirmDialog({
      show: true,
      title: `${action === "close" ? "Close" : "Reopen"} Poll`,
      message: `Are you sure you want to ${action} this poll?`,
      action: async () => {
        try {
          setConfirmDialog(prev => ({ ...prev, loading: true }));

          // Update poll status
          await adminAPI.updatePoll(pollId, { isActive: !currentStatus }, adminSecret);

          // Refresh polls
          await fetchPolls();

          setConfirmDialog({ show: false, title: "", message: "", action: null, loading: false });

          toast({
            title: `Poll ${action === "close" ? "Closed" : "Reopened"}`,
            description: `The poll has been ${action}d successfully.`,
          });
        } catch (error) {
          setConfirmDialog(prev => ({ ...prev, loading: false }));
          toast({
            title: `Failed to ${action} poll`,
            description: apiUtils.formatError(error),
            variant: "destructive",
          });
        }
      },
      loading: false,
    });
  };

  // Delete poll
  const deletePoll = async (pollId, pollTitle) => {
    setConfirmDialog({
      show: true,
      title: "Delete Poll",
      message: `Are you sure you want to delete "${pollTitle}"? This action cannot be undone.`,
      action: async () => {
        try {
          setConfirmDialog(prev => ({ ...prev, loading: true }));

          await adminAPI.deletePoll(pollId, adminSecret);

          // Refresh polls
          await fetchPolls();

          setConfirmDialog({ show: false, title: "", message: "", action: null, loading: false });

          toast({
            title: "Poll Deleted",
            description: `"${pollTitle}" has been deleted successfully.`,
          });
        } catch (error) {
          setConfirmDialog(prev => ({ ...prev, loading: false }));
          toast({
            title: "Failed to delete poll",
            description: apiUtils.formatError(error),
            variant: "destructive",
          });
        }
      },
      loading: false,
    });
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter your admin secret to access the dashboard
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminSecret">Admin Secret</Label>
                  <Input
                    id="adminSecret"
                    type="password"
                    placeholder="Enter admin secret key"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                      />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Login
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage polls and view system statistics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPolls()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{polls.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Total Polls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {polls.filter(poll => poll.isActive).length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Active Polls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {polls.reduce((acc, poll) => acc + (poll.totalVotes || 0), 0)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Total Votes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {polls.filter(poll => {
                      const today = new Date();
                      const created = new Date(poll.createdAt);
                      return today.toDateString() === created.toDateString();
                    }).length}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Created Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex items-center space-x-2">
          <div className="relative">
            <Button
              onClick={() => setShowCreateOptions(!showCreateOptions)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
            
            {/* Dropdown Menu */}
            <AnimatePresence>
              {showCreateOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
                >
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowCreateOptions(false);
                        setShowCreateForm(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-3 text-slate-500" />
                      Create Manually
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateOptions(false);
                        setShowAIForm(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
                    >
                      <Sparkles className="h-4 w-4 mr-3 text-purple-500" />
                      AI Powered
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-500 dark:text-slate-500">View:</span>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      {/* Polls List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"
          />
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  No polls created yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Get started by creating your first poll!
                </p>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Poll
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {polls.map((poll, index) => (
              <PollCard
                key={poll._id}
                poll={poll}
                index={index}
                onToggleStatus={togglePollStatus}
                onDelete={deletePoll}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <PollTable
              polls={polls}
              onToggleStatus={togglePollStatus}
              onDelete={deletePoll}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Poll Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Poll</DialogTitle>
            <DialogDescription>
              Create a new poll for users to vote on.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePoll} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input
                id="title"
                placeholder="What's your question?"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Provide more context for your poll..."
                value={pollDescription}
                onChange={(e) => setPollDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Poll Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={pollOptions.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>

              <AnimatePresence>
                {pollOptions.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <p className="text-xs text-slate-500 dark:text-slate-500">
                Minimum 2 options required. Maximum 10 options allowed.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {createLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Poll
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Poll Generation Dialog */}
      <Dialog open={showAIForm} onOpenChange={setShowAIForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>AI-Powered Poll Creation</span>
            </DialogTitle>
            <DialogDescription>
              Describe your poll in natural language and let AI generate the structure for you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateAIPoll} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt">Poll Description</Label>
              <textarea
                id="ai-prompt"
                placeholder="e.g., 'Create a poll about favorite programming languages with 5 options' or 'I want to survey people about their preferred work-from-home days'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white resize-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Be as specific as possible. Mention the number of options you want if you have a preference.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAIForm(false);
                  setAiPrompt("");
                }}
                disabled={aiLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={aiLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {aiLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Poll
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Generated Poll Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-blue-500" />
              <span>Edit & Submit Poll</span>
            </DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated poll before submitting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEditedPoll} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Poll Title</Label>
              <Input
                id="edit-title"
                placeholder="What's your question?"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Provide more context for your poll..."
                value={pollDescription}
                onChange={(e) => setPollDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Poll Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={pollOptions.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>

              <AnimatePresence>
                {pollOptions.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <p className="text-xs text-slate-500 dark:text-slate-500">
                Minimum 2 options required. Maximum 10 options allowed.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetAllForms()}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {createLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Poll
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.show} onOpenChange={(open) =>
        !confirmDialog.loading && setConfirmDialog(prev => ({ ...prev, show: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>{confirmDialog.title}</span>
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
              disabled={confirmDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDialog.action}
              disabled={confirmDialog.loading}
              variant="destructive"
            >
              {confirmDialog.loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

// Poll Card Component
const PollCard = ({ poll, index, onToggleStatus, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                {poll.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {poll.description}
              </p>
            </div>
            <Badge variant={poll.isActive ? "default" : "secondary"}>
              {poll.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                {poll.optionsCount || poll.options?.length || 0} options
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                {poll.totalVotes || 0} votes
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">
                {apiUtils.formatPollDate(poll.createdAt)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/admin/poll/${poll._id}`}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Shield className="h-4 w-4" />
                <span>Admin View</span>
              </Link>
              <a
                href={`/poll/${poll._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:underline"
              >
                <Eye className="h-4 w-4" />
                <span>Public View</span>
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggleStatus(poll._id, poll.isActive)}
              className="flex-1"
            >
              {poll.isActive ? (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Close
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Reopen
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(poll._id, poll.title)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Poll Table Component
const PollTable = ({ polls, onToggleStatus, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
              Poll
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
              Options
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
              Votes
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
              Created
            </th>
            <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {polls.map((poll, index) => (
            <motion.tr
              key={poll._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <td className="py-4 px-4">
                <div className="space-y-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {poll.title}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-500 line-clamp-1">
                    {poll.description}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                {poll.optionsCount || poll.options?.length || 0}
              </td>
              <td className="py-4 px-4">
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Closed"}
                </Badge>
              </td>
              <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                {poll.totalVotes || 0}
              </td>
              <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                {apiUtils.formatPollDate(poll.createdAt)}
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-end space-x-2">
                  <Link to={`/admin/poll/${poll._id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Admin View"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/poll/${poll._id}`, '_blank')}
                    title="Public View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleStatus(poll._id, poll.isActive)}
                  >
                    {poll.isActive ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(poll._id, poll.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;

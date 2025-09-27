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
  Eye,
  Shield,
  UserCheck,
  Globe,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

import { PollChartSelector } from "../components/charts";
import { adminAPI, apiUtils } from "../services/api";

const AdminPollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [poll, setPoll] = useState(null);
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votersLoading, setVotersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showVotersModal, setShowVotersModal] = useState(false);

  // Check admin authentication
  const adminSecret = localStorage.getItem("admin_secret");

  useEffect(() => {
    if (!adminSecret) {
      navigate("/admin");
      return;
    }
    fetchPollDetails();
  }, [id, adminSecret]);

  // Fetch poll details with admin-specific data
  const fetchPollDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch poll details
      const response = await adminAPI.getPollAudit(id, adminSecret);
      setPoll(response.data.poll);
      setVoters(response.data.voters || []);

    } catch (error) {
      console.error("Failed to fetch poll details:", error);
      setError(error);
      
      if (error.response?.status === 404) {
        navigate("/admin");
        toast({
          title: "Poll Not Found",
          description: "The poll you're looking for doesn't exist or has been removed.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/admin");
        toast({
          title: "Access Denied",
          description: "You need admin privileges to view this page.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Load Poll",
          description: apiUtils.formatError(error),
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const pollUrl = `${window.location.origin}/poll/${id}`;
    navigator.clipboard.writeText(pollUrl);
    toast({
      title: "Link Copied",
      description: "Poll link has been copied to clipboard",
    });
  };

  const handleShare = () => {
    const pollUrl = `${window.location.origin}/poll/${id}`;
    if (navigator.share) {
      navigator.share({
        title: poll?.title,
        text: poll?.description,
        url: pollUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Failed to Load Poll
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {apiUtils.formatError(error)}
        </p>
        <Button onClick={fetchPollDetails}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  const totalVotes = poll.totalVotes || 0;
  const uniqueVoters = voters.length;
  const conversionRate = totalVotes > 0 ? ((uniqueVoters / totalVotes) * 100).toFixed(1) : 0;

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
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="h-6 border-l border-slate-300 dark:border-slate-600" />

          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            Admin View
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Link to={`/poll/${id}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Public Poll
            </Button>
          </Link>
          
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Poll
          </Button>
        </div>
      </div>

      {/* Poll Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-2xl">{poll.title}</CardTitle>
                <Badge variant={poll.isActive ? "default" : "secondary"}>
                  {poll.isActive ? "Active" : "Closed"}
                </Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {poll.description}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Total Votes
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">{uniqueVoters}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Unique Voters
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-purple-600">{poll.options?.length || 0}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Options
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {new Date(poll.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Created
              </div>
            </div>
          </div>

          {/* Poll Settings */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Poll Settings</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Email Required:</span>
                <Badge variant={poll.settings?.requireEmail ? "default" : "secondary"}>
                  {poll.settings?.requireEmail ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Show Results:</span>
                <Badge variant={poll.settings?.showResults ? "default" : "secondary"}>
                  {poll.settings?.showResults ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Multiple Votes:</span>
                <Badge variant={poll.settings?.allowMultipleVotes ? "default" : "secondary"}>
                  {poll.settings?.allowMultipleVotes ? "Allowed" : "Single"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Voter Information
            </CardTitle>
            <Button 
              variant="outline" 
              onClick={() => setShowVotersModal(true)}
              disabled={voters.length === 0}
            >
              View All Voters ({voters.length})
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {voters.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No voters yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voters.slice(0, 4).map((voter, index) => (
                  <motion.div
                    key={voter.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">{voter.email}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(voter.votedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Voted for: <span className="font-medium">{voter.selectedOption}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {voters.length > 4 && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => setShowVotersModal(true)}>
                    View {voters.length - 4} more voters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Charts */}
      {totalVotes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PollChartSelector
            pollData={poll}
            title="Poll Results (Admin View)"
            description={`${totalVotes} total votes from ${uniqueVoters} unique voters`}
            defaultChart="donut"
          />
        </motion.div>
      )}

      {/* Voters Modal */}
      <Dialog open={showVotersModal} onOpenChange={setShowVotersModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Voters ({voters.length})</DialogTitle>
            <DialogDescription>
              Complete list of voters for this poll
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {voters.map((voter, index) => (
              <motion.div
                key={voter.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{voter.email}</span>
                  </div>
                  <Badge variant="outline">{voter.selectedOption}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Vote #{index + 1}</span>
                  <span>{new Date(voter.votedAt).toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminPollDetail;
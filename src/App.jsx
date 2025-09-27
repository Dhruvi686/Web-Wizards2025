import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import "./App.css";

// Import pages
import PollsList from "./pages/PollsList";
import PollDetail from "./pages/PollDetail";
import Vote from "./pages/Vote";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPollDetail from "./pages/AdminPollDetail";

// Import layout components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col min-h-screen">
          {/* Navigation */}
          <Navbar />

          {/* Main content */}
          <main className="flex-1 container mx-auto px-4 py-8">
            <Routes>
              {/* Home page - List of polls */}
              <Route path="/" element={<PollsList />} />

              {/* Poll detail page */}
              <Route path="/poll/:id" element={<PollDetail />} />

              {/* Vote page (from magic link) */}
              <Route path="/vote" element={<Vote />} />

              {/* Results page */}
              <Route path="/results/:id" element={<Results />} />

              {/* Admin Dashboard */}
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* Admin Poll Detail */}
              <Route path="/admin/poll/:id" element={<AdminPollDetail />} />

              {/* Redirect old routes */}
              <Route path="/polls" element={<Navigate to="/" replace />} />

              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
        </div>

        {/* Toast notifications */}
        <Toaster />
      </div>
    </Router>
  );
}

export default App;

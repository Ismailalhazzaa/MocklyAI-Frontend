import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import ProtectedRoute from "@/components/ProtectedRoute"; // ← أضف هذا فقط
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import RegisterPage from "./pages/RegisterPage";
import SetupPage from "./pages/SetupPage";
import QuestionPage from "./pages/QuestionPage";
import AnalysisPage from "./pages/AnalysisPage";
import SessionSummaryPage from "./pages/SessionSummaryPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import FAQPage from "./pages/FAQPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useNotifications();

  return (
    <Routes>
      <Route path="/"                element={<HomePage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email"    element={<EmailVerificationPage />} />
      <Route path="/register"        element={<RegisterPage />} />

      <Route path="/setup"       element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />
      <Route path="/question"    element={<ProtectedRoute><QuestionPage /></ProtectedRoute>} />
      <Route path="/analysis"    element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
      <Route path="/summary"     element={<ProtectedRoute><SessionSummaryPage /></ProtectedRoute>} />
      <Route path="/history"     element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
      <Route path="/faq"         element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
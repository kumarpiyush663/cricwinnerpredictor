import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TournamentProvider } from "./contexts/TournamentContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { LandingPage } from "./components/pages/LandingPage";
import { LoginPage } from "./components/auth/LoginPage";
import { SignupPage } from "./components/auth/SignupPage";
import { ForgotPasswordPage, ResetPasswordPage } from "./components/auth/PasswordReset";
import { Dashboard } from "./components/pages/Dashboard";
import { Leaderboard } from "./components/pages/Leaderboard";
import { Report } from "./components/pages/Report";
import { MatchDetails } from "./components/matches/MatchDetails";
import { AdminPanel } from "./components/admin/AdminPanel";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TournamentProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes without navbar */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Routes with navbar layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<LandingPage />} />
                
                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <ProtectedRoute>
                      <Report />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/match/:matchId"
                  element={
                    <ProtectedRoute>
                      <MatchDetails />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TournamentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

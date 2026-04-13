import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import VoterLogin from './pages/voter/VoterLogin';
import VotingPage from './pages/voter/VotingPage';
import VotingSuccess from './pages/voter/VotingSuccess';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCandidates from './pages/admin/AdminCandidates';
import AdminVoters from './pages/admin/AdminVoters';

import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';

function ProtectedVoterRoute({ children }) {
    const { voterAuth } = useAuth();
    
    if (!voterAuth.token) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

function ProtectedAdminRoute({ children }) {
    const { adminAuth } = useAuth();
    
    if (!adminAuth.token) {
        return <Navigate to="/admin/login" replace />;
    }
    
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<VoterLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Voter Protected Routes */}
            <Route
                path="/vote"
                element={
                    <ProtectedVoterRoute>
                        <VotingPage />
                    </ProtectedVoterRoute>
                }
            />
            <Route
                path="/success"
                element={
                    <ProtectedVoterRoute>
                        <VotingSuccess />
                    </ProtectedVoterRoute>
                }
            />

            {/* Admin Protected Routes */}
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedAdminRoute>
                        <AdminDashboard />
                    </ProtectedAdminRoute>
                }
            />
            <Route
                path="/admin/candidates"
                element={
                    <ProtectedAdminRoute>
                        <AdminCandidates />
                    </ProtectedAdminRoute>
                }
            />
            <Route
                path="/admin/voters"
                element={
                    <ProtectedAdminRoute>
                        <AdminVoters />
                    </ProtectedAdminRoute>
                }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
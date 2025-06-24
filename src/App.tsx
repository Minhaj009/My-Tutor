import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SupabaseConnectionAlert } from './components/SupabaseConnectionAlert'
import { AuthRedirect } from './components/AuthRedirect'
import { ProtectedRoute } from './components/ProtectedRoute'

// Import screens
import { StitchDesign } from './screens/StitchDesign'
import { AboutUsPage } from './screens/AboutUsPage'
import { FeaturesPage } from './screens/FeaturesPage'
import { PricingPage } from './screens/PricingPage'
import { ContactPage } from './screens/ContactPage'
import { HelpCenterPage } from './screens/HelpCenterPage'
import { PrivacyPolicyPage } from './screens/PrivacyPolicyPage'
import { TermsOfServicePage } from './screens/TermsOfServicePage'

// Import auth screens
import { LoginPage } from './screens/AuthPage/LoginPage'
import { SignUpPage } from './screens/AuthPage/SignUpPage'
import { CompleteProfilePage } from './screens/AuthPage/CompleteProfilePage'
import { SubjectGroupPage } from './screens/AuthPage/SubjectGroupPage'

// Import dashboard
import { Dashboard } from './screens/Dashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SupabaseConnectionAlert />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<StitchDesign />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />

            {/* Auth routes */}
            <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
            <Route path="/signup" element={<AuthRedirect><SignUpPage /></AuthRedirect>} />
            
            {/* Protected auth completion routes */}
            <Route path="/complete-profile" element={
              <ProtectedRoute requiresIncompleteProfile>
                <CompleteProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/subject-group" element={
              <ProtectedRoute requiresProfile requiresNoSubjectGroup>
                <SubjectGroupPage />
              </ProtectedRoute>
            } />

            {/* Protected dashboard routes */}
            <Route path="/dashboard/*" element={
              <ProtectedRoute requiresProfile requiresSubjectGroup>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { ToastProvider } from './components/common';

// Auth Pages
import { Login, Register, ForgotPassword, ResetPassword, VerifyEmail, AuthCallback } from './pages/Auth';

// Main Pages
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Admin } from './pages/Admin';

// People Pages
import { PeopleList, AddPerson, PersonProfile, EditPerson } from './pages/People';
import { AddRelationship } from './pages/People/AddRelationship';

// =============================================================================
// QUERY CLIENT
// =============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// =============================================================================
// APP
// =============================================================================

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/people"
                element={
                  <ProtectedRoute>
                    <PeopleList />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/people/new"
                element={
                  <ProtectedRoute>
                    <AddPerson />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/people/:id"
                element={
                  <ProtectedRoute>
                    <PersonProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/people/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditPerson />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/people/:id/add-relationship"
                element={
                  <ProtectedRoute>
                    <AddRelationship />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Profile & Settings (placeholder) */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Navigate to="/people" replace />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Navigate to="/" replace />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

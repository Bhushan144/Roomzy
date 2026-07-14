import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { ErrorBoundary } from './components/ErrorBoundary'; 
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/shared/Home'; 
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Inbox from './pages/shared/Inbox';
import Chat from './pages/shared/Chat';
import NotFound from './pages/shared/NotFound';

import SearchFeed from './pages/tenant/SearchFeed';
import ProfileSetup from './pages/tenant/ProfileSetup';
import Dashboard from './pages/owner/Dashboard';
import CreateListing from './pages/owner/CreateListing';
import ManagePhotos from './pages/owner/ManagePhotos';

export default function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <BrowserRouter>
          
          {/* Global Toast Container */}
          <Toaster /> 

          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Public Routes */}
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />

              {/* Protected Route for BOTH TENANTS and OWNERS */}
              <Route element={<ProtectedRoute />}>
                 <Route path="inbox" element={<Inbox />} />
                 <Route path="chat/:interactionId" element={<Chat />} />
                 <Route path="profile-setup" element={<ProfileSetup />} />
              </Route>

              {/* Protected Routes for TENANTS only */}
              <Route element={<ProtectedRoute allowedRoles={['TENANT']} />}>
                <Route path="search" element={<SearchFeed />} />
              </Route>

              {/* Protected Routes for OWNERS only */}
              <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="dashboard/create-listing" element={<CreateListing />} />
                <Route path="dashboard/listings/:id/photos" element={<ManagePhotos />} />
              </Route>
              
              {/* CATCH-ALL ROUTE FOR 404 (Must be at the very bottom) */}
              <Route path="*" element={<NotFound />} />
              
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </ErrorBoundary>
  );
}
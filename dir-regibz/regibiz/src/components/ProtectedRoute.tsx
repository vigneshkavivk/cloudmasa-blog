import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import { UserRole } from '../types';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
        <p className="text-gray-400 text-sm">Verifying Access...</p>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
             <div className="glass-panel p-8 rounded-xl max-w-md text-center border border-red-500/20 shadow-2xl">
                 <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <ShieldAlert className="text-red-500" size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                 <p className="text-gray-400 mb-6">
                    You do not have the required permissions ({allowedRoles.join(', ')}) to view this page.
                 </p>
                 <Navigate to="/" />
             </div>
        </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
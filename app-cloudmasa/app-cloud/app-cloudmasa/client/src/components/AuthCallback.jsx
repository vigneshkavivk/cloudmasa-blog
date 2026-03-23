// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      const messages = {
        not_invited: 'You must be invited to access CloudMaSa.',
        unverified_email: 'Your GitHub email must be verified.',
        github_auth_failed: 'GitHub authorization failed.',
        missing_code: 'Authorization code missing.',
        server_error: 'Something went wrong. Please try again.',
        invite_required: 'No pending invitation found for this email.'
      };
      toast.error(messages[error] || `OAuth Error: ${error}`);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!token) {
      toast.error('No authentication token received.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // ✅ Fetch real user data from backend
    fetch('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to load profile (${response.status})`);
        }
        return response.json();
      })
      .then((userData) => {
        // Ensure permissions exist (fallback for unknown roles)
        const basePermissions = { Overall: { Read: true } };

        const rolePermissions = {
          'super-admin': {
            Overall: { Read: true, Administer: true },
            Credentials: { Create: true, View: true, Delete: true },
            Job: { Create: true, Read: true, Delete: true },
            Agent: { Configure: true, Provision: true, Read: true, Delete: true }
          },
          'support': {
            Overall: { Read: true, Administer: true },
            Credentials: { Create: true, View: true, Delete: true },
            Job: { Create: true, Read: true, Delete: true },
            Agent: { Configure: true, Provision: true, Read: true, Delete: true }
          }
        };

        const permissions = rolePermissions[userData.role] || basePermissions;

        const fullUser = {
          id: userData.id,
          name: userData.name || 'Unknown',
          email: userData.email || 'unknown@example.com',
          role: userData.role || 'user',
          token,
          permissions
        };

        localStorage.setItem('user', JSON.stringify(fullUser));
        localStorage.setItem('token', token);

        console.log('✅ Received userData:', userData);
        console.log('userData.name =', userData.name);

        toast.success(`✅ Signed in as ${fullUser.name}!`);
        setTimeout(() => navigate('/sidebar'), 1500);
      })
      .catch((err) => {
        console.error('Auth callback error:', err);
        toast.error(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-white text-lg">Processing GitHub login...</div>
    </div>
  );
}

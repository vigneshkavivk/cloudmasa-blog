// src/components/Login.jsx
import { useState, useEffect } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaGitlab, FaBitbucket } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import cloudmasaLogo from '../assets/roundmasa.webp';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL errors on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');

    if (error) {
      const messages = {
        not_invited: 'You must be invited to access CloudMaSa.',
        unverified_email: 'Your GitHub email must be verified.',
        github_auth_failed: 'GitHub authorization failed.',
        missing_code: 'Authorization code missing.',
        server_error: 'Something went wrong. Please try again.'
      };
      toast.error(messages[error] || 'Login failed. Please try again.');
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOAuthLogin = (provider) => {
    if (provider === 'github') {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23lioFD7Uy9Px7zWI0';
      const redirectUri = encodeURIComponent('http://localhost:3000/github/callback');
      // ✅ FIXED: removed extra space after client_id=
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    } else {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/${provider}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      toast.error('Email and password are required!');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!loginRes.ok) {
        const errorData = await loginRes.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const loginData = await loginRes.json();
      toast.success('Login successful!');

      const { user, token } = loginData;

      // Handle roles with permissions
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

      let fullUser;
      if (rolePermissions[user.role]) {
        fullUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token,
          permissions: rolePermissions[user.role]
        };
      } else {
        // Regular user — fetch permissions
        const basicUser = { id: user.id, name: user.name, email: user.email, role: user.role, token };
        localStorage.setItem('user', JSON.stringify(basicUser));

        const permissionsRes = await fetch(
          `/api/policies/roles/permissions?role=${encodeURIComponent(user.role)}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!permissionsRes.ok) {
          throw new Error('Failed to fetch user permissions.');
        }

        const permissionsData = await permissionsRes.json();
        fullUser = { ...basicUser, permissions: permissionsData.permissions || {} };
      }

      localStorage.setItem('user', JSON.stringify(fullUser));

      // Check dashboard access
      const canViewDashboard = fullUser.permissions?.Overall?.Read === true;
      if (!canViewDashboard) {
        setTimeout(() => navigate('/access-denied'), 1500);
        return;
      }

      setTimeout(() => navigate('/sidebar'), 1500);
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'An unexpected error occurred during login';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center bg-[#0b1421] px-4 sm:px-6 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1421] via-[#121a25] to-[#161b22] pointer-events-none"></div>

      <div className="absolute top-6 left-6 flex items-center z-10">
        <img src={cloudmasaLogo} alt="CloudMaSa Logo" className="h-9 mr-2" />
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
          CloudMaSa
        </span>
      </div>

      <div className="relative w-full max-w-md bg-gradient-to-br from-[#161b22] via-[#1e252d] to-[#24292f] rounded-2xl p-7 shadow-2xl border border-white/10 backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent rounded-t-2xl"></div>

        <h2 className="text-center text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
          Sign in
        </h2>
        <p className="text-center text-gray-400 mb-6">to your CloudMaSa workspace</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm"
            aria-label="Sign in with Google"
          >
            <FcGoogle className="text-xl" /> Google
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm"
            aria-label="Sign in with GitHub"
          >
            <FaGithub className="text-xl" /> GitHub
          </button>

          <button
            onClick={() => handleOAuthLogin('gitlab')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm"
            aria-label="Sign in with GitLab"
          >
            <span className="text-orange-500"><FaGitlab className="text-xl" /></span> GitLab
          </button>

          <button
            onClick={() => handleOAuthLogin('bitbucket')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm"
            aria-label="Sign in with Bitbucket"
          >
            <span className="text-blue-500"><FaBitbucket className="text-xl" /></span> Bitbucket
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 py-1 bg-gradient-to-b from-[#161b22] to-[#24292f] text-gray-400 rounded-full">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#121a25] border border-white/10 text-white placeholder:text-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#121a25] border border-white/10 text-white placeholder:text-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-900/20 border border-rose-500/30 text-rose-300 text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-red-600 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in to Dashboard'
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3 text-sm">
          <p className="text-gray-500">
            New to CloudMaSa?
            <br />
            <Link to="/register" className="text-cyan-400">Get invited (full access)</Link>
            &nbsp; or &nbsp;
            <Link to="/register-public" className="text-orange-400">Sign up as viewer</Link>
          </p>
          <p className="text-gray-500">
            <Link
              to="/forgot-password"
              className="inline-block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-medium hover:opacity-90 transition"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Login;

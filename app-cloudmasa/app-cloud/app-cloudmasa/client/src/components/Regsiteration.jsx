import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../interceptor/api.interceptor';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaGitlab, FaBitbucket } from 'react-icons/fa';

/**
 * ✅ FIXED: Invite Registration Flow with OAuth Support
 */
const RegisterForm = () => {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  
  // ✅ FIXED: Properly extract token from either source
  const inviteToken = queryToken || pathToken;
  
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isInviteFlow, setIsInviteFlow] = useState(!!inviteToken);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const navigate = useNavigate();

  // 🔍 Debug logging
  useEffect(() => {
    console.log('🔍 === RegisterForm Debug ===');
    console.log('🔍 Path token:', pathToken);
    console.log('🔍 Query token:', queryToken);
    console.log('🔍 Final inviteToken:', inviteToken);
    console.log('🔍 Token length:', inviteToken?.length);
    console.log('🔍 URL:', window.location.href);
  }, [pathToken, queryToken, inviteToken]);

  // ✅ Validate token on load
  useEffect(() => {
    const validateInviteToken = async () => {
      if (!inviteToken) {
        console.error('❌ No invitation token found!');
        setValidationError('No invitation token found in URL');
        toast.error('Registration requires an invitation link', { icon: '❌' });
        setIsValidating(false);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      console.log('✅ Starting token validation for:', inviteToken.substring(0, 20) + '...');
      setIsInviteFlow(true);
      setIsLoading(true);
      setIsValidating(true);
      
      try {
        // ✅ Try to validate the token
        console.log('📡 API Call: GET /api/users/validate/' + inviteToken);
        
        const res = await api.get(`/api/users/validate/${inviteToken}`, {
          timeout: 10000 // 10 second timeout
        });
        
        console.log('✅ Validation response:', res.data);
        
        if (res.data.success) {
          // ✅ Token is valid - pre-fill form
          setForm(prev => ({ 
            ...prev, 
            email: res.data.email || '',
            name: res.data.name || ''
          }));
          
          setInviteDetails({
            email: res.data.email,
            role: res.data.role,
            workspaceId: res.data.workspaceId,
            workspaceName: res.data.workspaceName || 'the workspace'
          });
          
          toast.success('Invitation validated successfully!', { icon: '✅' });
        } else {
          throw new Error(res.data.message || 'Token validation failed');
        }
      } catch (err) {
        console.error('❌ Token validation error:', err);
        console.error('❌ Error response:', err.response?.data);
        console.error('❌ Error status:', err.response?.status);
        
        let errorMsg = 'Invalid or expired invitation link';
        
        if (err.response) {
          // Backend responded with error
          errorMsg = err.response.data?.message || 
                    err.response.data?.error || 
                    `Server error (${err.response.status})`;
          
          // Specific error messages
          if (err.response.status === 404) {
            errorMsg = 'Invitation not found. The link may be incorrect or expired.';
          } else if (err.response.status === 410) {
            errorMsg = 'This invitation has expired or has already been used.';
          } else if (err.response.status === 400) {
            errorMsg = 'Invalid invitation token format.';
          }
        } else if (err.code === 'ECONNABORTED') {
          errorMsg = 'Request timeout. Please check your connection.';
        } else if (err.code === 'ERR_NETWORK') {
          errorMsg = 'Network error. Is the backend server running?';
        }
        
        setValidationError(errorMsg);
        toast.error(errorMsg, { icon: '❌', autoClose: 6000 });
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    };

    validateInviteToken();
  }, [inviteToken, navigate]);

  // 🔒 Strong password check
  const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  // 🔍 Live password feedback
  useEffect(() => {
    if (!form.password) {
      setPasswordStrength('');
      return;
    }
    if (form.password.length < 8) {
      setPasswordStrength('Too short');
    } else if (!/[A-Z]/.test(form.password)) {
      setPasswordStrength('Missing uppercase');
    } else if (!/[a-z]/.test(form.password)) {
      setPasswordStrength('Missing lowercase');
    } else if (!/\d/.test(form.password)) {
      setPasswordStrength('Missing number');
    } else if (!/[\W_]/.test(form.password)) {
      setPasswordStrength('Missing symbol');
    } else {
      setPasswordStrength('Strong ✅');
    }
  }, [form.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIXED: OAuth Login Handler - REMOVED EXTRA SPACES
  const handleOAuthLogin = (provider) => {
    if (!inviteToken) {
      toast.error('No invitation token found. Please use the invitation link.', { icon: '❌' });
      return;
    }

    console.log(`🔐 Starting OAuth login with ${provider}...`);
    console.log(`🔐 Using token: ${inviteToken.substring(0, 20)}...`);

    if (provider === 'github') {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23lioFD7Uy9Px7zWI0';
      const redirectUri = encodeURIComponent('http://localhost:3000/github/callback');
      
      // ✅ FIXED: Removed extra spaces after client_id=
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${inviteToken}`;
      
      console.log('🔐 GitHub OAuth URL:', githubUrl.substring(0, 100) + '...');
      window.location.href = githubUrl;
    } else {
      // For Google, GitLab, Bitbucket
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173';
      const oauthUrl = `${baseUrl}/api/auth/${provider}?token=${inviteToken}`;
      
      console.log(`🔐 ${provider} OAuth URL:`, oauthUrl);
      window.location.href = oauthUrl;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    console.log('📤 Submitting registration...');
    console.log('📤 inviteToken:', inviteToken?.substring(0, 20) + '...');

    if (validationError) {
      toast.error('Please fix the validation errors above', { icon: '❌' });
      return;
    }

    if (!inviteToken) {
      toast.error('No invitation token found', { icon: '❌' });
      return;
    }

    if (!isStrongPassword(form.password)) {
      toast.error(
        'Password must be ≥8 chars with uppercase, lowercase, number, and symbol.',
        { theme: 'colored', icon: '🔒' }
      );
      return;
    }

    if (!form.name || form.name.trim().length < 2) {
      toast.error('Please enter a valid name (at least 2 characters)', { icon: '❌' });
      return;
    }

    if (!form.phone || form.phone.trim().length < 10) {
      toast.error('Please enter a valid phone number', { icon: '❌' });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📤 API Endpoint: /api/users/register-via-invite');
      console.log('📤 Payload:', { 
        token: inviteToken, 
        name: form.name.trim(), 
        phone: form.phone,
        password: '[HIDDEN]' 
      });

      const res = await api.post('/api/users/register-via-invite', {
        token: inviteToken,
        name: form.name.trim(),
        password: form.password,
        phone: form.phone
      });

      console.log('✅ Registration successful:', res.data);
      toast.success(res.data.message || 'Registration successful! Welcome!', {
        icon: '🎉',
      });

      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('❌ Error response:', err.response?.data);
      
      const msg = err.response?.data?.message || 
                  err.response?.data?.error || 
                  'Registration failed. Please try again.';
      
      toast.error(msg, { icon: '❌' });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Show loading while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1421]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#F26A2E] mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Validating invitation...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // ✅ Show error if token invalid
  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1421] px-4">
        <div className="max-w-md w-full bg-[#161b22] border border-rose-500/30 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-rose-400 mb-4">Invalid Invitation</h2>
          <p className="text-gray-300 mb-2">{validationError}</p>
          <p className="text-gray-500 text-sm mb-6">
            The invitation link may be expired, already used, or incorrect.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              🔄 Retry
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#121a25] border border-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e252d] transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-12 bg-[#0b1421] flex items-center justify-center overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-300 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-cyan-300 rounded-full animate-ping"></div>
      </div>

      {/* Main Card */}
      <div
        className="relative w-full max-w-md rounded-2xl p-7 sm:p-8 border border-white/10 backdrop-blur-xl bg-gradient-to-br from-[#161b22] via-[#1e252d] to-[#24292f] shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Glitter effect */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.1)_0%,transparent_20%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_90%_80%,rgba(255,165,0,0.08)_0%,transparent_25%)]"></div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
           You're Invited!
          </h1>
          <p className="text-gray-300 mt-3 text-sm sm:text-base">
            {inviteDetails 
              ? `Complete your registration to join ${inviteDetails.workspaceName}` 
              : 'Complete your registration'}
          </p>
          
          {/* Show invite details */}
          {inviteDetails && (
            <div className="mt-4 bg-[#121a25]/50 border border-[#F26A2E]/20 rounded-lg p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">📧 Email</span>
                <span className="text-gray-200 font-medium">{inviteDetails.email}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">💼 Role</span>
                <span className="text-[#F26A2E] font-semibold">{inviteDetails.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">🏢 Workspace</span>
                <span className="text-blue-400 font-medium">{inviteDetails.workspaceName}</span>
              </div>
            </div>
          )}
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm disabled:opacity-50"
            aria-label="Register with Google"
          >
            <FcGoogle className="text-xl" /> Google
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm disabled:opacity-50"
            aria-label="Register with GitHub"
          >
            <FaGithub className="text-xl" /> GitHub
          </button>

          <button
            onClick={() => handleOAuthLogin('gitlab')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm disabled:opacity-50"
            aria-label="Register with GitLab"
          >
            <span className="text-orange-500"><FaGitlab className="text-xl" /></span> GitLab
          </button>

          <button
            onClick={() => handleOAuthLogin('bitbucket')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161b22] font-medium text-white hover:bg-gradient-to-r hover:from-teal-600 hover:via-cyan-700 hover:to-blue-800 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-[#24292f]/50 backdrop-blur-sm disabled:opacity-50"
            aria-label="Register with Bitbucket"
          >
            <span className="text-blue-500"><FaBitbucket className="text-xl" /></span> Bitbucket
          </button>
        </div>

        {/* Divider */}
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

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-gray-200 font-medium text-sm mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
              className="w-full px-5 py-4 bg-[#121a25] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26A2E]/50 focus:border-transparent transition text-base"
              placeholder="e.g., Kumar"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label htmlFor="email" className="block text-gray-200 font-medium text-sm mb-2">
              Invited Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              disabled
              className="w-full px-5 py-4 bg-[#121a25] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26A2E]/50 focus:border-transparent transition text-base opacity-75 cursor-not-allowed"
              placeholder="Pre-filled from invitation"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-gray-200 font-medium text-sm mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
              className="w-full px-5 py-4 bg-[#121a25] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26A2E]/50 focus:border-transparent transition text-base"
              placeholder="e.g., +91 9876543210"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-gray-200 font-medium text-sm mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              className="w-full px-5 py-4 bg-[#121a25] border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26A2E]/50 focus:border-transparent transition text-base"
              placeholder="••••••••"
            />
            {form.password && (
              <div className="mt-2 text-sm">
                <span
                  className={`${
                    passwordStrength === 'Strong ✅'
                      ? 'text-emerald-400 font-medium'
                      : passwordStrength.includes('Missing') || passwordStrength === 'Too short'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  🔒 {passwordStrength}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center w-full mt-4">
            <button
              type="submit"
              disabled={isLoading || !inviteToken}
              className={`w-full sm:w-1/2 py-3 px-4 rounded-lg font-medium text-white text-base transition-all duration-300 transform ${
                isLoading || !inviteToken
                  ? 'bg-gradient-to-r from-orange-500/70 via-red-500/70 to-red-600/70 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-red-600 hover:scale-[1.02] shadow-lg hover:shadow-orange-500/20 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining Workspace...
                </span>
              ) : (
                'Join Workspace'
              )}
            </button>
          </div>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-8 pt-6 border-t border-white/5">
          <p className="text-gray-300 text-base">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 font-semibold underline-offset-4 hover:underline transition"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-center"
        autoClose={4500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ width: '95%', maxWidth: '500px' }}
      />
    </div>
  );
};

export default RegisterForm;

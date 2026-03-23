import React, { useState } from 'react';
import { Mail, Phone, ArrowRight, Loader2, Shield, Lock, User, Eye, EyeOff } from 'lucide-react';
import { mockAuthService } from '../services/mockFirebase';
import { UserProfile } from '../types';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'mail' | 'otp'>('mail');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    otp: ''
  });
  
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSocialLogin = async (provider: 'google') => {
    setLoading(true);
    setError('');
    try {
      const user = await mockAuthService.loginWithGoogle();
      onLogin(user);
    } catch (err: any) {
      if (err.message !== "Login cancelled") {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (authMode === 'login') {
        const user = await mockAuthService.loginWithEmail(formData.email, formData.password);
        onLogin(user);
      } else if (authMode === 'signup') {
        // Customer Self-Registration
        if (formData.password !== formData.confirmPassword) {
            throw new Error("Passwords do not match");
        }
        await mockAuthService.registerWithEmail(formData.email, formData.password, formData.displayName);
        setSuccessMsg("Account created! Please sign in.");
        setAuthMode('login');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        if (!otpSent) {
          if (formData.phone.length < 10) throw new Error("Enter valid phone number");
          setTimeout(() => {
            setOtpSent(true);
            setLoading(false);
          }, 1000);
        } else {
            const user = await mockAuthService.loginWithPhone(formData.phone, formData.otp);
            onLogin(user);
        }
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-navy-900">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-8">
          <img 
            src="/roundmasa.webp" 
            alt="RegiBIZ Logo" 
            className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-2xl"
          />
          <h1 className="text-3xl font-bold text-gradient-heading tracking-tight">RegiBIZ</h1>
          <p className="text-gray-400 mt-2">Government Compliance & Registration</p>
        </div>

        <div className="glass-panel rounded-2xl p-1 shadow-2xl">
          <div className="grid grid-cols-2 p-1 gap-1 bg-black/40 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('mail'); setError(''); setSuccessMsg(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'mail' 
                  ? 'bg-navy-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Mail size={16} /> Email Login
            </button>
            <button
              onClick={() => { setActiveTab('otp'); setError(''); setSuccessMsg(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'otp' 
                  ? 'bg-navy-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Phone size={16} /> Phone Login
            </button>
          </div>

          <div className="px-6 pb-6 pt-2">
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2 animate-fade-in">
                <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-xs flex items-center gap-2 animate-fade-in">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                {successMsg}
              </div>
            )}

            {/* EMAIL / PASSWORD FORM */}
            {activeTab === 'mail' && (
              <form onSubmit={handleMailAuth} className="space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                    <h3 className="text-lg font-bold text-gradient-heading">
                        {authMode === 'login' ? 'Welcome Back' : 'Create Customer Account'}
                    </h3>
                    <p className="text-xs text-gray-400">
                        {authMode === 'login' 
                           ? 'Log in as Customer, Support, or Admin.' 
                           : 'Sign up to access compliance services.'}
                    </p>
                </div>

                {authMode === 'signup' && (
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><User size={16} /></span>
                      <input
                        name="displayName"
                        type="text"
                        placeholder="Full Name"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                      />
                    </div>
                )}

                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Mail size={16} /></span>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                  />
                </div>

                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={16} /></span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {authMode === 'signup' && (
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={16} /></span>
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                      />
                    </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                      {!loading && <ArrowRight size={18} />}
                    </>
                  )}
                </button>
                
                {authMode === 'login' && (
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-navy-900 text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-white group"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        Google
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center pt-2 mt-2">
                    <p className="text-xs text-gray-500">
                        {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={() => { setError(''); setAuthMode(authMode === 'login' ? 'signup' : 'login') }} className="text-orange-400 hover:text-orange-300 font-medium ml-1">
                            {authMode === 'login' ? 'Register' : 'Sign In'}
                        </button>
                    </p>
                </div>
              </form>
            )}

            {/* OTP FORM */}
            {activeTab === 'otp' && (
              <form onSubmit={handleOtpAuth} className="space-y-4 animate-fade-in">
                  <div className="text-center mb-2">
                    <h3 className="text-lg font-bold text-gradient-heading">Mobile Login</h3>
                    <p className="text-xs text-gray-400">Available for Customers only.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm">+91</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={otpSent}
                        placeholder="99999 99999"
                        className="w-full bg-navy-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-mono text-sm"
                      />
                    </div>
                  </div>
                  
                  {otpSent && (
                     <div className="animate-fade-in">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">One-Time Password</label>
                        <input
                          type="text"
                          name="otp"
                          value={formData.otp}
                          onChange={handleInputChange}
                          placeholder="1 2 3 4 5 6"
                          className="w-full bg-navy-900/50 border border-orange-500/30 rounded-xl px-4 py-3 text-center text-white tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                          autoFocus
                        />
                        <p className="text-center text-xs text-orange-500 mt-2">OTP sent to {formData.phone}</p>
                     </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !formData.phone}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        {!otpSent ? 'Send Code' : 'Verify & Login'} 
                        {!loading && <ArrowRight size={18} />}
                      </>
                    )}
                  </button>
                </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

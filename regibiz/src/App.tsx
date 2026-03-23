// \src\App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';

// Icons
import {
  Menu,
  Bell,
  Search,
  User,
  Plus,
  ExternalLink,
  Activity,
  Clock,
  FileText,
  ArrowLeft,
  Settings,
  LogOut,
  X,
  Star,
  AlertTriangle,
  File,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

// Pages
import Auth from './pages/Auth';
import AcceptInvite from './pages/AcceptInvite';
import ServiceHub from './pages/ServiceHub';
import Documents from './pages/Documents';
import AdminPanel from './pages/AdminPanel';
import Schedule from './pages/Schedule';
import StaffDashboard from './pages/StaffDashboard';
import Consultation from './pages/Consultation';
// Add this with your other page imports
import SignaturePad from './pages/SignaturePad';

// Service Landing Pages
import FssaiLicenseServicePanel from './servicepanel/fssai-license';
import GstRegistrationLanding from './servicepanel/gst-registration';
import MsmeRegistrationLanding from './servicepanel/msme-registration';
import PanRegistrationLanding from './servicepanel/pan-registration'; // 👈 ADD THIS

// Service Forms
import FssaiLicenseForm from './services/fssai-license-form';
import GstRegistrationForm from './services/gst-registration-form';
import MsmeRegistrationForm from './services/msme-registration-form';
import PanRegistrationForm from './services/pan-registration-form'; // 👈 AND THIS (you likely already have it)

// UI Components
import Sidebar from './components/Sidebar';

// Services & Types
import { mockAuthService, mockDbService } from './services/mockFirebase';
import { UserProfile, ServiceDocument, Notification, UserRole } from './types';
import { canViewAdminPanel, formatDate } from './utils/helpers';

// ─── Profile Completion Modal ───────────────────────────────────────
const ProfileCompletionModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    phoneNumber: user.phoneNumber || '',
    company: user.company || '',
    isExpert: user.isExpert || false,
  });
  const [saving, setSaving] = useState(false);
  const isInternal = user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-navy-900 rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
            <User size={20} />
          </div>
          <h3 className="text-xl font-bold text-gradient-heading">Complete Your Profile</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Full Name</label>
            <input
              required
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Company Name (Optional)</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-orange-500 focus:outline-none text-sm transition-colors"
            />
          </div>
          {isInternal && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/5 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-orange-400" />
                  <div>
                    <p className="text-sm font-medium text-white">List as Expert</p>
                    <p className="text-[10px] text-gray-400">Appear in customer consultation lists.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isExpert}
                    onChange={(e) => setFormData({ ...formData, isExpert: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
            </div>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Header Component ───────────────────────────────────────────────
const Header: React.FC<{ user: UserProfile; toggleSidebar: () => void; isCollapsed: boolean }> = ({
  user,
  toggleSidebar,
  isCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isInternal = user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT;
  const isProfileIncomplete = !user.displayName || !user.phoneNumber;

  useEffect(() => {
    const unsubscribe = mockDbService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    await mockDbService.markAllNotificationsRead(user.uid);
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      await mockDbService.markNotificationRead(user.uid, notif.id);
    }
    setIsNotifOpen(false);
    if (notif.redirectUrl) {
      navigate(notif.redirectUrl);
    }
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    await mockAuthService.updateUserProfile(user.uid, data);
  };

  const handleLogout = async () => {
    await mockAuthService.logout();
    navigate('/');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return user.role === UserRole.CUSTOMER ? 'Dashboard Overview' : 'Staff Dashboard';
      case '/services':
        return 'Service Hub';
      case '/documents':
        return 'My Documents';
      case '/calendar':
        return 'Compliance Calendar';
      case '/admin':
        return 'User Management';
      case '/consult':
        return 'Consultation';
      // Service-specific titles
      case '/services/dsc-emudhra':
        return 'DSC (e-Mudhra)';
      case '/services/dsc-emudhra/form':
        return 'DSC Application Form';
      case '/services/fssai-license':
        return 'FSSAI License (Basic)';
      case '/services/fssai-license/form':
        return 'FSSAI Application Form';
      case '/services/gst-registration':
        return 'GST Registration';
      case '/services/gst-registration/form':
        return 'GST Application Form';
      case '/services/msme-registration':
        return 'MSME Registration';
      case '/services/msme-registration/form':
        return 'MSME Application Form';
      default:
        return 'RegiBIZ';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText size={16} className="text-orange-400" />;
      case 'reminder':
        return <Clock size={16} className="text-amber-400" />;
      case 'system':
        return <Activity size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  const showBackButton = location.pathname.includes('/form');
  const handleGoBack = () => {
    if (location.pathname === '/services/fssai-license/form') {
      navigate('/services/fssai-license');
    } else if (location.pathname === '/services/dsc-emudhra/form') {
      navigate('/services/dsc-emudhra');
    } else if (location.pathname === '/services/gst-registration/form') {
      navigate('/services/gst-registration');
    } else if (location.pathname === '/services/msme-registration/form') {
      navigate('/services/msme-registration');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 glass-panel border-b border-white/5 px-4 md:px-8 flex items-center justify-between bg-[#0a192f]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSidebar();
            }}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu size={20} />
          </button>
          {showBackButton ? (
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden md:block">Back</span>
            </button>
          ) : (
            <h2 className="text-lg font-bold text-gradient-heading hidden md:block tracking-tight">
              {getPageTitle()}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center bg-navy-900/50 border border-white/10 rounded-full px-4 py-1.5 w-64 focus-within:border-orange-500/30 focus-within:bg-navy-900 transition-all">
            <Search size={14} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none text-sm text-gray-300 placeholder-gray-500 focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isNotifOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border border-navy-900 shadow-sm shadow-orange-500/20">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-navy-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-sm font-bold text-gradient-heading">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-orange-400 hover:text-orange-300 font-medium transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Bell size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-4 hover:bg-white/5 cursor-pointer transition-colors group relative ${
                              notif.read ? 'opacity-70' : 'bg-white/[0.02]'
                            }`}
                          >
                            {!notif.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500"></div>
                            )}
                            <div className="flex gap-3">
                              <div className="mt-1 p-2 rounded-lg bg-navy-950 border border-white/10 h-fit text-gray-400 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white font-medium'} truncate pr-4`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.body}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <p className="text-[10px] text-gray-600">{formatDate(notif.createdAt)}</p>
                                  {notif.serviceId && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                      <p className="text-[10px] font-mono text-gray-500">{notif.serviceId}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                              {notif.redirectUrl && (
                                <div className="flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity -ml-2">
                                  <button className="text-[10px] font-bold text-orange-400 uppercase tracking-wide px-2 py-1 rounded border border-orange-500/30 bg-orange-500/10">
                                    View
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block"></div>
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-1 group outline-none"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white leading-none group-hover:text-orange-400 transition-colors">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 capitalize tracking-wide">{user.role}</p>
                </div>
                <div className="relative">
                  <div
                    className={`w-9 h-9 rounded-full p-[1px] shadow-lg transition-all duration-300 ${
                      isProfileOpen ? 'bg-orange-500 shadow-orange-500/20' : 'bg-gradient-to-br from-orange-500 to-red-600'
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-sm">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={14} />}
                    </div>
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-navy-900 ${
                      user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  ></div>
                </div>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-navy-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
                  <div className="p-5 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-navy-950 border border-white/10 flex items-center justify-center text-xl font-bold text-orange-500">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm truncate w-40">{user.displayName || 'Guest User'}</p>
                        <p className="text-xs text-gray-400 truncate w-40">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          user.role === UserRole.SUPERADMIN
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : user.role === UserRole.ADMIN
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : user.role === UserRole.SUPPORT
                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                      <span className={`text-[10px] uppercase font-bold ${user.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    {(isProfileIncomplete || (isInternal && !user.isExpert)) && (
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 flex items-center gap-3 transition-colors mb-2"
                      >
                        <AlertTriangle size={16} />
                        <div>
                          <p className="text-xs font-bold">Complete Profile</p>
                          <p className="text-[10px] opacity-80">
                            {isInternal && !user.isExpert ? 'Enroll as Expert' : 'Add phone & company details'}
                          </p>
                        </div>
                      </button>
                    )}
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors group">
                      <Settings size={16} className="text-gray-500 group-hover:text-orange-400" />
                      <span>Account Settings</span>
                    </button>
                  </div>
                  <div className="p-2 border-t border-white/5 bg-black/20">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showProfileModal && (
        <ProfileCompletionModal user={user} onClose={() => setShowProfileModal(false)} onSave={handleUpdateProfile} />
      )}
    </>
  );
};

// ─── Customer Dashboard ─────────────────────────────────────────────
const CustomerDashboard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<ServiceDocument[]>([]);
  const [statsData, setStatsData] = useState({ active: 0, pending: 0, spent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docs = await mockDbService.getDocuments(user.uid);
        setRecentDocs(docs.sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 5));
        const active = docs.filter((d) => ['submitted', 'processing', 'paid'].includes(d.status || '')).length;
        const pending = docs.filter((d) => ['submitted', 'paid'].includes(d.status || '')).length;
        const spent = docs.reduce((acc, d) => acc + (d.amount || 0), 0);
        setStatsData({ active, pending, spent });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.uid]);

  const stats = [
    { label: 'Active Services', value: statsData.active.toString(), trend: 'Live', icon: <Activity className="text-orange-400" /> },
    { label: 'Pending Reviews', value: statsData.pending.toString(), trend: 'Wait', icon: <Clock className="text-amber-400" /> },
    { label: 'Total Spent', value: `₹${statsData.spent.toLocaleString()}`, trend: 'Invoices', icon: <FileText className="text-blue-400" /> },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden p-8 glass-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-gradient-heading">
            Hello, {user.displayName.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 max-w-xl">
            Your compliance status is {statsData.pending > 0 ? 'pending review' : 'up to date'}. Check your latest notifications for updates.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/services')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
            >
              <Plus size={16} /> New Application
            </button>
            <button
              onClick={() => navigate('/documents')}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
            >
              <ExternalLink size={16} /> View Documents
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-xl relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/5 rounded-lg text-white group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded">{stat.trend}</span>
            </div>
            <h3 className="text-2xl font-bold text-gradient-heading">{stat.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-semibold text-gradient-heading">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400 font-medium">
                <tr>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentDocs.length > 0 ? (
                  recentDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => navigate('/documents')}
                    >
                      <td className="px-5 py-3.5 text-white font-medium">{doc.title}</td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{doc.serviceId || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-gray-400">{formatDate(doc.submittedAt)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            doc.status === 'approved'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              : doc.status === 'processing'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : doc.status === 'paid'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                      No applications yet. Start a service to see it here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl border border-blue-500/20 bg-gradient-to-b from-blue-900/10 to-transparent">
            <h3 className="font-bold text-gradient-heading mb-2">Need Expert Help?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Our chartered accountants are available for a 15-min discovery call.
            </p>
            <button
              onClick={() => navigate('/consult')}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Book Consultation
            </button>
          </div>
          <div className="glass-panel p-5 rounded-xl">
            <h4 className="text-sm font-semibold text-gradient-heading mb-3 uppercase tracking-wider">
              System Status
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">GST Portal API</span>
                <span className="flex items-center text-orange-400 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div> Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment Gateway</span>
                <span className="flex items-center text-orange-400 gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div> Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ───────────────────────────────────────────────────────
const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const unsubscribe = mockAuthService.subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    mockAuthService.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020c1b] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-orange-500/80 font-medium tracking-wide">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
  <Router>
    <Routes>
      {/* 1. PUBLIC ROUTES (Login illamalume open aagum) */}
      <Route path="/register" element={<AcceptInvite />} />
      
      {/* 👇 ADD SIGNATURE ROUTE HERE (OUTSIDE PROTECTED BLOCK) 👇 */}
      <Route path="/signature" element={<SignaturePad />} />

      {/* 2. PROTECTED APP SHELL (Login avasaram) */}
      <Route
        path="*"
        element={
          !user ? (
            <Auth onLogin={handleLogin} />
          ) : (
            <div className="flex min-h-screen bg-[#020c1b] text-slate-200 font-sans selection:bg-orange-500/30">
                <Sidebar
                  userRole={user.role}
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  isCollapsed={isSidebarCollapsed}
                  toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                <div
                  className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-0 ${
                    isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
                  }`}
                >
                  <Header user={user} toggleSidebar={() => setSidebarOpen(true)} isCollapsed={isSidebarCollapsed} />
                  <main className="flex-1 overflow-y-auto scroll-smooth">
                    <Routes>
                      {/* Dashboards & Forms */}
                      <Route path="/" element={user.role === UserRole.CUSTOMER ? <CustomerDashboard user={user} /> : <StaffDashboard user={user} />} />
                      <Route path="/services" element={<ServiceHub user={user} />} />
                      <Route path="/documents" element={<Documents user={user} />} />
                      <Route path="/calendar" element={<Schedule user={user} />} />
                      <Route path="/consult" element={<Consultation user={user} />} />
                      
                      {/* Service Forms */}
                      <Route path="/services/fssai-license" element={<FssaiLicenseServicePanel />} />
                      <Route path="/services/fssai-license/form" element={<FssaiLicenseForm />} />
                      <Route path="/services/gst-registration" element={<GstRegistrationLanding />} />
                      <Route path="/services/gst-registration/form" element={<GstRegistrationForm user={user} />} />
                      <Route path="/services/msme-registration" element={<MsmeRegistrationLanding />} />
                      <Route path="/services/msme-registration/form" element={<MsmeRegistrationForm user={user} />} />
                      <Route path="/services/pan-registration" element={<PanRegistrationLanding />} />
                      <Route path="/services/pan-registration/form" element={<PanRegistrationForm user={user} />} />
                      
                      {/* Admin */}
                      <Route path="/admin" element={canViewAdminPanel(user.role) ? <AdminPanel /> : <Navigate to="/" />} />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    
                    <div className="p-6 text-center">
                      <p className="text-xs text-gray-700">RegiBIZ v2.0.1 • Secured by 256-bit Encryption</p>
                    </div>
                  </main>
                </div>
              </div>
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
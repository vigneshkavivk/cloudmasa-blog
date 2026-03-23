// src/pages/StaffDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  TrendingUp,
  Shield,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Inbox,
  User,
  Calendar,
  FileText,
  LayoutGrid,
  Briefcase,
  Star,
  Eye,
  X
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { UserProfile, UserRole, ServiceDocument } from '../types';
import { mockDbService } from '../services/mockFirebase';
import { formatDate } from '../utils/helpers';
import CustomerCard from '../components/CustomerCard';
import CustomerModal from '../components/CustomerModal';

interface StaffDashboardProps {
  user: UserProfile;
}

const COLORS = {
  pending: '#F59E0B',    // Amber
  processing: '#3B82F6', // Blue
  approved: '#10B981',   // Emerald
  rejected: '#EF4444',   // Red
  paid: '#8B5CF6',       // Violet
};

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Role flags
  const isSuperAdmin = user.role === UserRole.SUPERADMIN;
  const isAdminOrSupport = !isSuperAdmin;

  // View State
  const [activeTab, setActiveTab] = useState<'customers' | 'requests'>(
    isSuperAdmin ? 'requests' : 'requests' // 👈 Default to Service Requests list (your screenshot)
  );

  // Data States
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [applications, setApplications] = useState<ServiceDocument[]>([]);
  const [userStats, setUserStats] = useState({
    admins: 0,
    support: 0,
    experts: 0,
    customers: { active: 0, invited: 0, total: 0 },
  });

  // Modal / Interaction State
  const [inspectApp, setInspectApp] = useState<ServiceDocument | null>(null);
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Subscribe to real-time data
  useEffect(() => {
    let unsubCustomers: (() => void) | undefined;
    let unsubApps: (() => void) | undefined;

    if (isAdminOrSupport) {
      unsubCustomers = mockDbService.subscribeToCustomers((data) => {
        setCustomers(data);
        if (loading) setLoading(false);
      });
    }

    unsubApps = mockDbService.subscribeToAllApplications((data) => {
      setApplications(data);
      if (loading && !isAdminOrSupport) setLoading(false);
    });

    // One-time fetch for SuperAdmin stats
    if (isSuperAdmin) {
      mockDbService.getAllUsers().then((users) => {
        const admins = users.filter(
          (u) => u.role === UserRole.ADMIN || u.role === UserRole.SUPERADMIN
        ).length;
        const support = users.filter((u) => u.role === UserRole.SUPPORT).length;
        const experts = users.filter((u) => u.isExpert && u.status === 'active').length;
        const customerList = users.filter((u) => u.role === UserRole.CUSTOMER);
        setUserStats({
          admins,
          support,
          experts,
          customers: {
            active: customerList.filter((u) => u.status === 'active').length,
            invited: customerList.filter((u) => u.status === 'invited').length,
            total: customerList.length,
          },
        });
        setLoading(false);
      });
    }

    return () => {
      if (unsubCustomers) unsubCustomers();
      if (unsubApps) unsubApps();
    };
  }, [isSuperAdmin, isAdminOrSupport, loading]);

  // --- Derived Metrics ---
  const totalRequests = applications.length;
  const pendingRequests = applications.filter(a => ['submitted', 'paid'].includes(a.status || '')).length;
  const completedRequests = applications.filter(a => a.status === 'approved').length;
  const processingRequests = applications.filter(a => a.status === 'processing').length;
  const revenue = applications.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // --- Chart Data ---
  const statusChartData = useMemo(() => [
    { name: 'Pending', value: pendingRequests, color: COLORS.pending },
    { name: 'Processing', value: processingRequests, color: COLORS.processing },
    { name: 'Completed', value: completedRequests, color: COLORS.approved },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, color: COLORS.rejected },
  ], [applications]);

  const timelineChartData = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[key] = 0;
    }
    applications.forEach(app => {
      const d = new Date(app.submittedAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (days[key] !== undefined) days[key]++;
    });
    return Object.entries(days).map(([name, count]) => ({ name, count }));
  }, [applications]);

  // --- Filtering Logic ---
  const getFilteredCustomers = () => {
    return customers.filter(c => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        (c.displayName?.toLowerCase() || '').includes(searchLower) ||
        (c.email?.toLowerCase() || '').includes(searchLower) ||
        (c.userId?.toLowerCase() || '').includes(searchLower);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredRequests = () => {
    return applications.filter(app => {
      const searchLower = searchQuery.toLowerCase();
      const customer = customers.find(c => c.uid === app.userId);
      const customerName = customer?.displayName?.toLowerCase() || '';
      const matchesSearch =
        app.id.toLowerCase().includes(searchLower) ||
        app.title.toLowerCase().includes(searchLower) ||
        customerName.includes(searchLower);
      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = ['submitted', 'paid'].includes(app.status || '');
      else if (statusFilter === 'processing') matchesStatus = app.status === 'processing';
      else if (statusFilter === 'completed') matchesStatus = app.status === 'approved';
      else if (statusFilter === 'cancelled') matchesStatus = app.status === 'rejected';
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.submittedAt - a.submittedAt);
  };

  const handleStatusUpdate = async (status: string) => {
    if (!inspectApp) return;
    setIsUpdating(true);
    try {
      await mockDbService.updateDocumentStatus(inspectApp.id, inspectApp.userId, status);
      setInspectApp(null);
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Metric Card (Interactive)
  const MetricCard = ({
    label,
    value,
    subLabel,
    icon,
    colorClass,
    active,
    onClick,
  }: {
    label: string;
    value: string | number;
    subLabel?: string;
    icon: React.ReactNode;
    colorClass: string;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group backdrop-blur-md border ${
        active
          ? 'bg-navy-900/80 border-orange-500 shadow-[inset_0_0_8px_rgba(249,115,22,0.3)]'
          : 'bg-white/[0.03] border-white/5 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(249,115,22,0.2)] hover:border-orange-500/30'
      }`}
    >
      {/* Background Decoration */}
      <div
        className={`absolute -right-4 -top-4 transition-all duration-500 transform ${
          active ? 'opacity-10 scale-110' : 'opacity-5 group-hover:opacity-10 group-hover:scale-110'
        } ${colorClass}`}
      >
        {React.cloneElement(icon as React.ReactElement, { size: 100 })}
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
              active ? 'text-orange-400' : 'text-gray-400 group-hover:text-gray-300'
            }`}
          >
            {label}
          </p>
          <h3
            className={`text-3xl font-bold mt-1 transition-colors ${
              active ? 'text-white' : 'text-white group-hover:text-white'
            }`}
          >
            {value}
          </h3>
        </div>
        <div
          className={`p-3 rounded-lg bg-white/5 transition-all duration-300 ${
            active
              ? 'scale-110 bg-orange-500/20 text-orange-500'
              : `${colorClass} bg-opacity-10 group-hover:rotate-6`
          }`}
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: 24,
            className: active ? 'drop-shadow-sm' : '',
          })}
        </div>
      </div>
      {subLabel && (
        <div className="flex items-center gap-2 text-xs relative z-10">
          <span
            className={`font-medium flex items-center transition-colors ${
              active ? 'text-orange-400' : 'text-emerald-400'
            }`}
          >
            <TrendingUp size={12} className="mr-1" /> +12%
          </span>
          <span className="text-gray-500">{subLabel}</span>
        </div>
      )}
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    let styles = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    if (['submitted', 'paid', 'pending'].includes(status)) styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    else if (['processing', 'active'].includes(status)) styles = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    else if (['approved', 'completed'].includes(status)) styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    else if (['rejected', 'blocked', 'cancelled'].includes(status)) styles = 'bg-red-500/10 text-red-400 border-red-500/20';
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles}`}>
        {status}
      </span>
    );
  };

  // --- Handle Metric Clicks (Your Requirement)
  const handleMetricClick = (type: 'customers' | 'requests' | 'pending' | 'completed') => {
    setSearchQuery('');
    switch (type) {
      case 'customers':
        setActiveTab('customers');
        setStatusFilter('all');
        break;
      case 'requests':
        setActiveTab('requests'); // ✅ Now opens the request list (your screenshot)
        setStatusFilter('all');
        break;
      case 'pending':
        setActiveTab('requests');
        setStatusFilter('pending');
        break;
      case 'completed':
        setActiveTab('requests');
        setStatusFilter('completed');
        break;
    }
  };

  // --- SUPER ADMIN VIEW ---
  if (isSuperAdmin) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto">
        {/* Header Banner */}
        <div className="relative rounded-2xl overflow-hidden p-8 glass-card border-none">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gradient-heading mb-1">Command Center</h1>
              <p className="text-gray-400 text-sm">System Overview & High-Level Metrics</p>
            </div>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10">
              <User size={20} />
            </button>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Customers</p>
                <h3 className="text-3xl font-bold text-white">{userStats.customers.total}</h3>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-blue-400">
                <Users size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
              <span className="text-gray-500">{userStats.customers.active} Active / {userStats.customers.invited} Pending</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Internal Staff</p>
                <h3 className="text-3xl font-bold text-white">{userStats.admins + userStats.support}</h3>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-purple-400">
                <Shield size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
              <span className="text-gray-500">{userStats.admins} Admins, {userStats.support} Support</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Legal Experts</p>
                <h3 className="text-3xl font-bold text-white">{userStats.experts}</h3>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-emerald-400">
                <Star size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
              <span className="text-gray-500">Enrolled for Consultation</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl border border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-3xl font-bold text-white">₹{revenue.toLocaleString()}</h3>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-orange-400">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp size={12} className="mr-1" /> +12%
              </span>
              <span className="text-gray-500">Processed Payments</span>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid size={16} /> Global Application Pipeline
          </h3>
          <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5">
                    <th className="p-4">Application ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Service Type</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <Loader2 className="animate-spin mx-auto text-orange-500" />
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const customer = customers.find((c) => c.uid === app.userId) || {
                        displayName: 'Unknown',
                        email: 'N/A',
                      };
                      return (
                        <tr key={app.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 font-mono text-gray-400 text-xs">{app.serviceId || app.id}</td>
                          <td className="p-4">
                            <div className="font-medium text-white">{customer.displayName}</div>
                            <div className="text-xs text-gray-500">{customer.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-gray-500" />
                              <span className="capitalize">{app.title}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400">{formatDate(app.submittedAt)}</td>
                          <td className="p-4">
                            <StatusBadge status={app.status || 'unknown'} />
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setInspectApp(app)}
                              className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-all text-xs font-bold border border-orange-500/20"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Inspection Modal */}
        {inspectApp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="glass-panel rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative">
              <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Application Review</h3>
                  <p className="text-xs text-orange-400 font-mono">{inspectApp.serviceId}</p>
                </div>
                <button onClick={() => setInspectApp(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {inspectApp.formData &&
                    Object.entries(inspectApp.formData).map(([key, value]) => {
                      if (key === 'paymentId') return null;
                      return (
                        <div key={key} className="p-3 rounded-lg bg-navy-900/50 border border-white/5">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-sm text-gray-200">{value?.toString() || '-'}</p>
                        </div>
                      );
                    })}
                  {inspectApp.status === 'paid' && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                      <CheckCircle size={18} className="text-emerald-500" />
                      <div>
                        <p className="text-xs font-bold text-emerald-400">Payment Verified</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {inspectApp.formData?.paymentId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3">
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Mark Processing'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- STAFF DASHBOARD: REQUESTS LIST (YOUR SCREENSHOT)
  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in pb-20 max-w-[1600px] mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient-heading">Staff Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage customer profiles and service requests.</p>
        </div>
        {/* Account Settings Button */}
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10">
          <User size={20} />
        </button>
      </div>

      {/* Interactive Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Customers"
          value={customers.length}
          subLabel="vs last week"
          icon={<Users />}
          colorClass="text-blue-400"
          active={activeTab === 'customers' && statusFilter === 'all'}
          onClick={() => handleMetricClick('customers')}
        />
        <MetricCard
          label="Total Requests"
          value={totalRequests}
          subLabel="vs last week"
          icon={<Inbox />}
          colorClass="text-purple-400"
          active={activeTab === 'requests' && statusFilter === 'all'}
          onClick={() => handleMetricClick('requests')} // ✅ Opens request list
        />
        <MetricCard
          label="Pending Action"
          value={pendingRequests}
          subLabel="Requires attention"
          icon={<Clock />}
          colorClass="text-amber-400"
          active={activeTab === 'requests' && statusFilter === 'pending'}
          onClick={() => handleMetricClick('pending')}
        />
        <MetricCard
          label="Completed"
          value={completedRequests}
          subLabel="This month"
          icon={<CheckCircle />}
          colorClass="text-emerald-400"
          active={activeTab === 'requests' && statusFilter === 'completed'}
          onClick={() => handleMetricClick('completed')}
        />
      </div>

      {/* Tabs */}
      <div className="flex bg-navy-900/50 p-1 rounded-lg border border-white/5 w-full md:w-auto">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'customers'
              ? 'bg-navy-800 text-white shadow-lg border border-white/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'requests'
              ? 'bg-navy-800 text-white shadow-lg border border-white/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Service Requests
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-navy-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm sticky top-0 z-20">
        <div className="w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={activeTab === 'customers' ? "Search customers..." : "Search requests..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500/50 outline-none h-10"
            />
          </div>
        </div>
        <div className="relative min-w-[150px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy-950 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-300 focus:border-blue-500/50 outline-none appearance-none h-10 cursor-pointer"
          >
            <option value="all">All Status</option>
            {activeTab === 'customers' ? (
              <>
                <option value="active">Active</option>
                <option value="blocked">Inactive</option>
              </>
            ) : (
              <>
                <option value="pending">Pending</option>
                <option value="processing">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </>
            )}
          </select>
          <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Main Content — Request List (YOUR SCREENSHOT) */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : activeTab === 'requests' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredRequests().map(app => {
              const customer = customers.find(c => c.uid === app.userId);
              return (
                <div key={app.id} className="glass-card p-5 rounded-xl border border-white/5 relative group hover:bg-white/[0.02]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {app.id}
                        </span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(app.submittedAt)}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm truncate">{app.title}</h4>
                    </div>
                    <StatusBadge status={app.status || 'UNKNOWN'} />
                  </div>
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-navy-950/50 border border-white/5 cursor-pointer hover:border-blue-500/30 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-navy-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                      {customer?.displayName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs text-blue-400 hover:underline truncate">
                      {customer?.displayName || 'Unknown User'}
                    </span>
                  </div>
                  <button
                    onClick={() => setInspectApp(app)}
                    className="w-full text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-blue-600 px-3 py-2 rounded-lg transition-all"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
            {getFilteredRequests().length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                No requests found matching filters.
              </div>
            )}
          </div>
        ) : (
          // Customers tab (fallback)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getFilteredCustomers().map(cust => (
              <CustomerCard
                key={cust.uid}
                customer={cust}
                requestCount={applications.filter(a => a.userId === cust.uid).length}
                onClick={() => setSelectedCustomerForModal(cust)}
              />
            ))}
            {getFilteredCustomers().length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                No customers found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Metrics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" /> Requests by Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusChartData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-[10px] text-gray-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Calendar size={16} className="text-purple-400" /> Request Volume (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedCustomerForModal && (
        <CustomerModal
          customer={selectedCustomerForModal}
          requests={applications.filter(a => a.userId === selectedCustomerForModal.uid)}
          onClose={() => setSelectedCustomerForModal(null)}
        />
      )}

      {inspectApp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setInspectApp(null)}>
          <div className="glass-panel rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Request Details</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1.5 rounded">{inspectApp.id}</span>
                  <StatusBadge status={inspectApp.status || 'unknown'} />
                </div>
              </div>
              <button onClick={() => setInspectApp(null)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-6">
                {/* Service Info */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Service Information</h4>
                  <div className="bg-navy-950 p-4 rounded-lg border border-white/5">
                    <p className="text-white font-medium">{inspectApp.title}</p>
                    <p className="text-sm text-gray-400 mt-1">Submitted on {formatDate(inspectApp.submittedAt)}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <User size={12} />
                      <span>Customer: {customers.find(c => c.uid === inspectApp.userId)?.displayName || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                {/* Form Data */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Submission Data</h4>
                  <div className="space-y-2">
                    {inspectApp.formData && Object.entries(inspectApp.formData).map(([key, value]) => {
                      if (key === 'paymentId') return null;
                      return (
                        <div key={key} className="flex justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className="text-xs text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm text-gray-200 font-medium text-right max-w-[60%] truncate">{value?.toString() || '-'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Payment Info */}
                {inspectApp.status === 'paid' && inspectApp.formData?.paymentId && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle size={20} className="text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-emerald-400">Payment Verified</p>
                      <p className="text-xs text-gray-400 font-mono">Ref: {inspectApp.formData.paymentId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-black/20">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Actions</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  disabled={isUpdating || inspectApp.status === 'processing'}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating || inspectApp.status === 'approved'}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isUpdating || inspectApp.status === 'rejected'}
                  className="flex-1 py-2.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  X,
  Loader2,
  Shield,
  Star,
  UserCheck
} from 'lucide-react';
import { UserProfile, UserRole, ServiceDocument } from '../types';
import { mockDbService } from '../services/mockFirebase';
import { formatDate } from '../utils/helpers';

interface StaffDashboardProps {
  user: UserProfile;
}

interface EnrichedDocument {
  doc: ServiceDocument;
  customerName: string;
  customerEmail: string;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [allApplications, setAllApplications] = useState<EnrichedDocument[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<EnrichedDocument[]>([]);
  
  // Analytics State
  const [userStats, setUserStats] = useState({
    admins: 0,
    support: 0,
    experts: 0,
    customers: { active: 0, invited: 0, total: 0 }
  });
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Modal States
  const [selectedApp, setSelectedApp] = useState<EnrichedDocument | null>(null);
  const [processingStatus, setProcessingStatus] = useState(false);

  const isAdminOrSuper = user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN;
  const isSupport = user.role === UserRole.SUPPORT;

  useEffect(() => {
    fetchGlobalData();
  }, [user.role]);

  useEffect(() => {
    filterData();
  }, [searchQuery, statusFilter, serviceFilter, allApplications]);

  const fetchGlobalData = async () => {
    try {
      const allDocsData = await mockDbService.getAllDocuments();
      const users = await mockDbService.getAllUsers();
      
      // Calculate User Stats for Superadmin Dashboard
      const admins = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.SUPERADMIN).length;
      const support = users.filter(u => u.role === UserRole.SUPPORT).length;
      const experts = users.filter(u => u.isExpert && u.status === 'active').length;
      
      const customersTotal = users.filter(u => u.role === UserRole.CUSTOMER);
      const custActive = customersTotal.filter(u => u.status === 'active').length;
      const custInvited = customersTotal.filter(u => u.status === 'invited').length;

      setUserStats({
        admins,
        support,
        experts,
        customers: { active: custActive, invited: custInvited, total: customersTotal.length }
      });

      // Flatten data for table
      const enriched: EnrichedDocument[] = allDocsData.map(item => ({
        doc: item.doc,
        customerName: item.user.displayName,
        customerEmail: item.user.email || 'N/A'
      })).filter(item => 
         // Only show actual submissions for support, or all for admins
         item.doc.type !== 'note' && item.doc.type !== 'file'
      );

      // Sort by newest first
      enriched.sort((a, b) => b.doc.submittedAt - a.doc.submittedAt);
      setAllApplications(enriched);
    } catch (error) {
      console.error("Failed to load staff data", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = allApplications;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.customerName.toLowerCase().includes(q) ||
        item.customerEmail.toLowerCase().includes(q) ||
        item.doc.title.toLowerCase().includes(q) ||
        (item.doc.serviceId && item.doc.serviceId.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(item => item.doc.status === statusFilter);
    }

    if (serviceFilter !== 'all') {
      result = result.filter(item => item.doc.type === serviceFilter);
    }

    setFilteredApplications(result);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedApp) return;
    setProcessingStatus(true);
    try {
      await mockDbService.updateDocumentStatus(selectedApp.doc.id, selectedApp.doc.userId, newStatus);
      
      const updatedList = allApplications.map(app => 
         app.doc.id === selectedApp.doc.id 
           ? { ...app, doc: { ...app.doc, status: newStatus as any } } 
           : app
      );
      setAllApplications(updatedList);
      setSelectedApp(prev => prev ? { ...prev, doc: { ...prev.doc, status: newStatus as any } } : null);
      
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    } finally {
      setProcessingStatus(false);
    }
  };

  // --- Statistics Calculation ---
  const stats = {
    total: allApplications.length,
    active: allApplications.filter(a => ['paid', 'submitted', 'processing'].includes(a.doc.status || '')).length,
    processing: allApplications.filter(a => a.doc.status === 'processing').length,
    completed: allApplications.filter(a => a.doc.status === 'approved').length,
    revenue: allApplications.reduce((acc, curr) => acc + (curr.doc.amount || 0), 0)
  };

  // --- UI Components ---

  const StatCard = ({ label, value, icon, colorClass, subtext, trend }: any) => (
    <div className="glass-card p-5 rounded-xl border border-white/5 relative overflow-hidden group">
       <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
          {icon}
       </div>
       <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
             {React.cloneElement(icon, { size: 20 })}
          </div>
          {trend && (
             <span className="text-[10px] bg-white/5 px-2 py-1 rounded-full text-gray-400 font-mono">
               {trend}
             </span>
          )}
       </div>
       <h3 className="text-2xl font-bold text-white">{value}</h3>
       <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mt-1">{label}</p>
       {subtext && <p className="text-[10px] text-gray-500 mt-2">{subtext}</p>}
    </div>
  );

  const StatusBadge = ({ status }: { status?: string }) => {
    const styles = {
      submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      processing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      approved: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    const s = status as keyof typeof styles;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles[s] || 'bg-gray-500/10 text-gray-400'}`}>
        {status || 'Draft'}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 glass-card border-none">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-600/10"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <h1 className="text-3xl font-bold text-gradient-heading mb-1">
               {isAdminOrSuper ? 'Command Center' : 'Support Task Board'}
             </h1>
             <p className="text-gray-400 text-sm">
               {isAdminOrSuper 
                 ? `System overview: ${userStats.customers.total} Customers, ${userStats.experts} Experts active.`
                 : 'Prioritize tasks marked as "Paid" or "Submitted".'
               }
             </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-full border border-white/10">
             <span className={`w-2 h-2 rounded-full animate-pulse ${user.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
             <span className="text-xs font-mono text-orange-400">System Online</span>
          </div>
        </div>
      </div>

      {/* SUPERADMIN ANALYTICS SECTION */}
      {isAdminOrSuper && (
        <div className="space-y-6">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} /> Operational Metrics
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Customer Base" 
                value={userStats.customers.total} 
                icon={<Users />} 
                colorClass="text-blue-400"
                subtext={`${userStats.customers.active} Active / ${userStats.customers.invited} Pending`} 
              />
              <StatCard 
                label="Internal Staff" 
                value={userStats.admins + userStats.support} 
                icon={<Shield />} 
                colorClass="text-purple-400"
                subtext={`${userStats.admins} Admins, ${userStats.support} Support`} 
              />
              <StatCard 
                label="Legal Experts" 
                value={userStats.experts} 
                icon={<Star />} 
                colorClass="text-emerald-400"
                subtext="Enrolled for Consultation"
              />
              <StatCard 
                label="Total Revenue" 
                value={`₹${stats.revenue.toLocaleString()}`} 
                icon={<TrendingUp />} 
                colorClass="text-orange-400" 
                subtext="Processed Payments"
              />
           </div>
        </div>
      )}

      {/* TASK / APPLICATION SECTION (Visible to All Staff) */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Briefcase size={16} /> Application Pipeline
         </h3>
         
         {/* Filters & Search */}
         <div className="flex flex-col md:flex-row gap-4 bg-navy-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
            <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search by ID, Customer Name, or Service..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-orange-500/50 outline-none"
                />
            </div>
            <div className="flex gap-4">
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-navy-900 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 appearance-none focus:border-orange-500/50 outline-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <select 
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="bg-navy-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 appearance-none focus:border-orange-500/50 outline-none cursor-pointer"
                >
                  <option value="all">All Services</option>
                  <option value="gst">GST Registration</option>
                  <option value="pan">Company PAN</option>
                  <option value="trademark">Trademark</option>
                </select>
            </div>
         </div>

         {/* Applications Table */}
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
                    <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></td></tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No applications found matching your filters.</td></tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.doc.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-mono text-gray-400 text-xs">{app.doc.serviceId || app.doc.id}</td>
                        <td className="p-4">
                          <div className="font-medium text-white">{app.customerName}</div>
                          <div className="text-xs text-gray-500">{app.customerEmail}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                              <FileText size={14} className="text-gray-500" />
                              <span className="capitalize">{app.doc.type === 'gst' ? 'GST Registration' : app.doc.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400">{formatDate(app.doc.submittedAt)}</td>
                        <td className="p-4"><StatusBadge status={app.doc.status} /></td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedApp(app)}
                            className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-all text-xs font-bold border border-orange-500/20"
                          >
                            {isSupport ? 'Process' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
         </div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-navy-950/50">
                 <div>
                    <h2 className="text-xl font-bold text-gradient-heading">{selectedApp.doc.title}</h2>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                       ID: <span className="font-mono text-orange-400">{selectedApp.doc.serviceId || 'N/A'}</span>
                       <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                       Customer: <span className="text-white">{selectedApp.customerName}</span>
                    </p>
                 </div>
                 <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                 {/* Status Control */}
                 <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-navy-900 rounded-lg border border-white/10">
                          <AlertCircle size={20} className="text-blue-400" />
                       </div>
                       <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Current Status</p>
                          <StatusBadge status={selectedApp.doc.status} />
                       </div>
                    </div>
                    
                    {/* Action Buttons for Support/Admin */}
                    <div className="flex gap-2">
                       {selectedApp.doc.status !== 'processing' && selectedApp.doc.status !== 'approved' && (
                          <button 
                            disabled={processingStatus}
                            onClick={() => handleStatusUpdate('processing')}
                            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-lg text-sm font-bold transition-all"
                          >
                             Mark Processing
                          </button>
                       )}
                       {selectedApp.doc.status !== 'approved' && (
                          <button 
                            disabled={processingStatus}
                            onClick={() => handleStatusUpdate('approved')}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20"
                          >
                             {processingStatus ? <Loader2 className="animate-spin" size={16} /> : 'Mark Completed'}
                          </button>
                       )}
                    </div>
                 </div>

                 {/* Form Data Viewer */}
                 <div>
                    <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider border-b border-white/5 pb-2">Application Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {selectedApp.doc.formData ? Object.entries(selectedApp.doc.formData).map(([key, value]) => (
                          <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/5">
                             <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                             <p className="text-sm text-gray-200 truncate">{String(value)}</p>
                          </div>
                       )) : (
                          <p className="text-gray-500 italic">No form data attached.</p>
                       )}
                       <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                           <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Fee Amount</label>
                           <p className="text-sm text-gray-200">₹{selectedApp.doc.amount?.toLocaleString() || '0'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-navy-950/30 text-center text-xs text-gray-500">
                 Changes are logged. Data protected by RegiBIZ Compliance Policy.
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
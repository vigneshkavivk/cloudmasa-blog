
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Mail, FileText, CreditCard, 
  Send, CheckCircle, Clock, AlertCircle, ChevronRight, Activity, 
  Inbox, Send as SendIcon, Plus, X,  Briefcase, 
  LayoutDashboard, FolderOpen, Download, Search, MoreVertical,
  Calendar, Shield, ExternalLink, ChevronDown, MapPin, Hash,
  File, MessageSquare, CornerUpLeft, Eye
} from 'lucide-react';
import { UserProfile, ServiceDocument, AppMessage, Folder, UserRole } from '../types';
import { mockDbService } from '../services/mockFirebase';
import { formatDate } from '../utils/helpers';

interface CustomerDetailPageProps {
  staffUser: UserProfile;
}

type Section = 'overview' | 'communication' | 'services' | 'documents';
type ViewMode = 'list' | 'detail';

const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({ staffUser }) => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  
  // Navigation State
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Drill-down State
  const [selectedEmail, setSelectedEmail] = useState<AppMessage | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceDocument | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<ServiceDocument | null>(null);
  
  // Data State
  const [customer, setCustomer] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<ServiceDocument[]>([]);
  const [documents, setDocuments] = useState<ServiceDocument[]>([]);
  const [emails, setEmails] = useState<AppMessage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Email Client State
  const [emailFolder, setEmailFolder] = useState<'inbox' | 'sent'>('inbox');
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ subject: '', body: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Computed Stats
  const [stats, setStats] = useState({ revenue: 0, activeRequests: 0, lastContact: 0 });

  useEffect(() => {
    if (!uid) return;

    const fetchData = async () => {
        try {
            // 1. Fetch Profile
            const allUsers = await mockDbService.getAllUsers();
            const foundCustomer = allUsers.find(u => u.uid === uid);
            setCustomer(foundCustomer || null);

            // 2. Fetch Docs & Services
            const allDocs = await mockDbService.getDocuments(uid);
            const apps = allDocs.filter(d => (d.type !== 'file' && d.type !== 'note' && d.type !== 'legal') || d.serviceId).sort((a, b) => b.submittedAt - a.submittedAt);
            setApplications(apps);
            setDocuments(allDocs);

            // 3. Fetch Folders
            const userFolders = await mockDbService.getFolders(uid);
            setFolders(userFolders);

            // 4. Compute Stats
            const revenue = apps.reduce((acc, curr) => acc + (curr.amount || 0), 0);
            const active = apps.filter(a => ['submitted', 'processing', 'paid'].includes(a.status || '')).length;
            setStats(prev => ({ ...prev, revenue, activeRequests: active }));

            setLoading(false);
        } catch (e) {
            console.error("Failed to load customer data", e);
            setLoading(false);
        }
    };

    fetchData();

    // 5. Real-time Email Subscription
    const unsubChat = mockDbService.subscribeToUserChat(uid, (msgs) => {
        const sorted = msgs.sort((a,b) => b.timestamp - a.timestamp);
        setEmails(sorted);
        if (sorted.length > 0) {
            setStats(prev => ({ ...prev, lastContact: sorted[0].timestamp }));
        }
    });

    return () => unsubChat();
  }, [uid]);

  // --- DERIVED STATE ---
  const filteredEmails = emails.filter(email => {
      const isInbox = emailFolder === 'inbox';
      // Inbox: Messages from Customer (isStaff is false)
      // Sent: Messages from Staff (isStaff is true)
      const matchesFolder = isInbox ? !email.isStaff : email.isStaff;
      const matchesSearch = (email.subject || '').toLowerCase().includes(emailSearchQuery.toLowerCase()) || 
                            (email.text || '').toLowerCase().includes(emailSearchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
  });

  // --- ACTIONS ---

  const handleSendEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!composeData.body.trim() || !composeData.subject.trim() || !uid) return;
      
      setSendingEmail(true);
      try {
          await mockDbService.sendUserChat(uid, composeData.body, staffUser, composeData.subject);
          setComposeData({ subject: '', body: '' });
          setShowCompose(false);
          setEmailFolder('sent');
          // Navigate to sent list
          setActiveSection('communication');
          setViewMode('list');
      } catch (e) {
          console.error("Failed to send", e);
          alert("Message failed.");
      } finally {
          setSendingEmail(false);
      }
  };

  const handleStatusUpdate = async (docId: string, newStatus: string) => {
      if (!uid) return;
      try {
          await mockDbService.updateDocumentStatus(docId, uid, newStatus);
          setApplications(prev => prev.map(app => 
              app.id === docId ? { ...app, status: newStatus as any } : app
          ));
          if (selectedService?.id === docId) {
             setSelectedService(prev => prev ? { ...prev, status: newStatus as any } : null);
          }
      } catch (e) {
          console.error("Update failed", e);
      }
  };

  // --- NAVIGATION HANDLERS ---
  
  const navigateToSection = (section: Section) => {
      setActiveSection(section);
      setViewMode('list');
      setSelectedEmail(null);
      setSelectedService(null);
      setSelectedDoc(null);
      setEmailSearchQuery('');
  };

  const openEmailDetail = (email: AppMessage) => {
      setSelectedEmail(email);
      setViewMode('detail');
  };

  const openServiceDetail = (service: ServiceDocument) => {
      setSelectedService(service);
      setViewMode('detail');
  };

  const openDocDetail = (doc: ServiceDocument) => {
      setSelectedDoc(doc);
      setViewMode('detail');
  };

  const goBackToSection = () => {
      setViewMode('list');
      setSelectedEmail(null);
      setSelectedService(null);
      setSelectedDoc(null);
  };

  // --- UI COMPONENTS ---

  const StatusBadge = ({ status }: { status: string }) => {
      const styles = {
          approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          paid: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
          submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
      const style = styles[status as keyof typeof styles] || styles.pending;
      return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${style}`}>
              {status}
          </span>
      );
  };

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/')}>Staff Dashboard</span>
        <ChevronRight size={10} />
        <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigateToSection('overview')}>{customer?.displayName}</span>
        <ChevronRight size={10} />
        <span 
            className={`capitalize hover:text-white cursor-pointer transition-colors ${viewMode === 'list' ? 'text-white font-bold' : ''}`}
            onClick={goBackToSection}
        >
            {activeSection}
        </span>
        {viewMode === 'detail' && (
            <>
                <ChevronRight size={10} />
                <span className="text-orange-400 font-bold max-w-[150px] truncate">
                    {selectedEmail?.subject || selectedService?.title || selectedDoc?.title || 'Detail'}
                </span>
            </>
        )}
    </div>
  );

  const NavItem = ({ section, label, icon }: { section: Section, label: string, icon: any }) => (
      <button 
          onClick={() => navigateToSection(section)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-2 ${
              activeSection === section 
              ? 'bg-white/5 text-white border-orange-500 shadow-[inset_4px_0_0_0_rgba(249,115,22,0.5)]' 
              : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
      >
          {React.cloneElement(icon, { size: 18, className: activeSection === section ? 'text-orange-500' : 'text-gray-500' })}
          {label}
      </button>
  );

  if (loading || !customer) {
      return (
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#020c1b]">
           <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white/5"></div>
              <div className="h-4 w-32 bg-white/5 rounded"></div>
           </div>
        </div>
      );
  }

  // --- VIEWS ---

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#020c1b] animate-fade-in overflow-hidden relative">
        
        {/* === LEVEL 2: SIDEBAR === */}
        <aside className="w-64 bg-navy-900 border-r border-white/5 flex flex-col shrink-0 z-20">
            {/* Header / Brand Area */}
            <div className="p-4 border-b border-white/5 bg-black/20">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-wider mb-4 transition-colors">
                    <ArrowLeft size={10} /> Return to Staff DB
                </button>
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-[1px] shadow-lg">
                         <div className="w-full h-full rounded-lg bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
                             {customer.displayName?.charAt(0).toUpperCase()}
                         </div>
                     </div>
                     <div className="overflow-hidden">
                         <p className="text-sm font-bold text-white truncate">{customer.displayName}</p>
                         <div className="flex items-center gap-1.5 mt-0.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                             <p className="text-[10px] text-gray-400 uppercase tracking-wide">{customer.status}</p>
                         </div>
                     </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex-1 py-4 space-y-1">
                <NavItem section="overview" label="Overview" icon={<LayoutDashboard />} />
                <NavItem section="communication" label="Communication" icon={<Mail />} />
                <NavItem section="services" label="Service Apps" icon={<Briefcase />} />
                <NavItem section="documents" label="Document Vault" icon={<FolderOpen />} />
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">LTV</span>
                    <span className="text-sm font-bold text-emerald-400">₹{stats.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">User ID</span>
                    <span className="text-[10px] font-mono text-gray-400">{customer.userId}</span>
                </div>
            </div>
        </aside>

        {/* === LEVEL 3 & 4: MAIN CONTENT AREA === */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0b1121] relative transition-all">
            
            {/* Dynamic Header */}
            <header className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-navy-900/50 backdrop-blur-sm shrink-0">
                <div className="flex flex-col justify-center">
                    <Breadcrumbs />
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                        {activeSection === 'overview' && 'Customer Snapshot'}
                        {activeSection === 'communication' && (viewMode === 'list' ? 'Message Center' : 'Message Thread')}
                        {activeSection === 'services' && (viewMode === 'list' ? 'Service Applications' : 'Application Details')}
                        {activeSection === 'documents' && (viewMode === 'list' ? 'File Repository' : 'File Preview')}
                    </h1>
                </div>

                {/* Context Actions */}
                <div className="flex items-center gap-3">
                    {activeSection === 'communication' && viewMode === 'list' && (
                        <button 
                            onClick={() => setShowCompose(true)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-500/20"
                        >
                            <Plus size={14} /> Compose
                        </button>
                    )}
                    {viewMode === 'detail' && (
                        <button 
                            onClick={goBackToSection}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium px-4 py-2 rounded-lg transition-all"
                        >
                            <ArrowLeft size={14} /> Back to List
                        </button>
                    )}
                </div>
            </header>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#020c1b]">
                
                {/* --- OVERVIEW DASHBOARD --- */}
                {activeSection === 'overview' && (
                    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
                        {/* High Level Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="glass-card p-6 rounded-xl border border-white/5 relative group hover:border-emerald-500/30 transition-all">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                                         <CreditCard size={24} />
                                     </div>
                                     <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Financials</span>
                                 </div>
                                 <h3 className="text-3xl font-bold text-white mt-2">₹{stats.revenue.toLocaleString()}</h3>
                                 <p className="text-xs text-gray-500 mt-1">Total Lifetime Revenue</p>
                             </div>
                             
                             <div className="glass-card p-6 rounded-xl border border-white/5 relative group hover:border-blue-500/30 transition-all">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
                                         <Activity size={24} />
                                     </div>
                                     <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Pipeline</span>
                                 </div>
                                 <h3 className="text-3xl font-bold text-white mt-2">{stats.activeRequests}</h3>
                                 <p className="text-xs text-gray-500 mt-1">Active Service Requests</p>
                             </div>

                             <div className="glass-card p-6 rounded-xl border border-white/5 relative group hover:border-purple-500/30 transition-all">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-500">
                                         <Clock size={24} />
                                     </div>
                                     <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">Engagement</span>
                                 </div>
                                 <h3 className="text-xl font-bold text-white mt-2 truncate">
                                     {stats.lastContact ? formatDate(stats.lastContact) : 'No Activity'}
                                 </h3>
                                 <p className="text-xs text-gray-500 mt-1">Last Interaction</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             {/* Customer Profile Card */}
                             <div className="lg:col-span-1 glass-panel rounded-xl border border-white/5 overflow-hidden h-fit">
                                 <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                                     <h3 className="font-bold text-white flex items-center gap-2">
                                         <User size={18} className="text-orange-500" /> Contact Profile
                                     </h3>
                                 </div>
                                 <div className="p-6 space-y-6">
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                         <div className="flex items-center gap-3 text-sm text-gray-200">
                                             <Mail size={14} className="text-gray-500" /> {customer.email}
                                         </div>
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                         <div className="flex items-center gap-3 text-sm text-gray-200">
                                             <Phone size={14} className="text-gray-500" /> {customer.phoneNumber || 'N/A'}
                                         </div>
                                     </div>
                                     <div className="space-y-1">
                                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Account Created</label>
                                         <div className="flex items-center gap-3 text-sm text-gray-200">
                                             <Calendar size={14} className="text-gray-500" /> {formatDate(customer.createdAt)}
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Recent Activity Timeline */}
                             <div className="lg:col-span-2 glass-panel rounded-xl border border-white/5 p-6">
                                 <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                     <Activity size={18} className="text-orange-500" /> Recent Timeline
                                 </h3>
                                 <div className="space-y-6 relative pl-2">
                                     <div className="absolute left-1.5 top-2 bottom-2 w-[1px] bg-white/10"></div>
                                     {applications.slice(0, 3).map(app => (
                                         <div key={app.id} className="relative pl-8 group cursor-pointer" onClick={() => { setActiveSection('services'); openServiceDetail(app); }}>
                                             <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-navy-900 border-2 border-blue-500 group-hover:bg-blue-500 transition-colors"></div>
                                             <div className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all">
                                                 <p className="text-sm text-white font-medium">Service Application: {app.title}</p>
                                                 <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                     <span>{formatDate(app.submittedAt)}</span>
                                                     <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                     <StatusBadge status={app.status || 'pending'} />
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                     {emails.slice(0, 2).map(email => (
                                         <div key={email.id} className="relative pl-8 group cursor-pointer" onClick={() => { setActiveSection('communication'); openEmailDetail(email); }}>
                                             <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-navy-900 border-2 border-purple-500 group-hover:bg-purple-500 transition-colors"></div>
                                             <div className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all">
                                                 <p className="text-sm text-white font-medium">{email.isStaff ? 'Sent Email' : 'Received Email'}: {email.subject || 'No Subject'}</p>
                                                 <p className="text-xs text-gray-500 mt-1">{formatDate(email.timestamp)}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* --- COMMUNICATION SECTION --- */}
                {activeSection === 'communication' && (
                    <div className="flex h-full animate-fade-in">
                        {/* LIST VIEW (Level 3) */}
                        <div className={`flex h-full w-full ${viewMode === 'detail' ? 'hidden' : 'flex'}`}>
                            {/* Mail Folders */}
                            <div className="w-64 bg-navy-950/30 border-r border-white/5 pt-6 flex flex-col">
                                <div className="px-4 mb-2">
                                    <button 
                                        onClick={() => setShowCompose(true)}
                                        className="w-full mb-6 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> New Message
                                    </button>
                                    
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Folders</p>
                                    <button 
                                        onClick={() => { setEmailFolder('inbox'); setSelectedEmail(null); }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${emailFolder === 'inbox' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <span className="flex items-center gap-3"><Inbox size={16} /> Inbox</span>
                                        <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">{emails.filter(e => !e.isStaff).length}</span>
                                    </button>
                                    <button 
                                        onClick={() => { setEmailFolder('sent'); setSelectedEmail(null); }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${emailFolder === 'sent' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <span className="flex items-center gap-3"><SendIcon size={16} /> Sent</span>
                                    </button>
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 bg-[#0b1121] flex flex-col">
                                <div className="p-4 border-b border-white/5 bg-navy-900/20 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white capitalize">{emailFolder}</h3>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                          type="text" 
                                          placeholder="Search mail..." 
                                          className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 w-64"
                                          value={emailSearchQuery}
                                          onChange={(e) => setEmailSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                    {filteredEmails.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                            <Inbox size={48} className="opacity-20 mb-4" />
                                            <p className="text-sm">Folder is empty</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredEmails.map(email => (
                                                <div 
                                                    key={email.id}
                                                    onClick={() => openEmailDetail(email)}
                                                    className="group p-4 rounded-lg border border-white/5 hover:bg-white/5 hover:border-white/10 cursor-pointer transition-all flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${email.isStaff ? 'bg-purple-600' : 'bg-orange-600'}`}>
                                                            {email.senderName.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-sm font-bold text-white truncate">{email.senderName}</span>
                                                                {!email.read && emailFolder === 'inbox' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                                                            </div>
                                                            <p className="text-sm text-gray-300 font-medium truncate">{email.subject || 'No Subject'}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-md">{email.text}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-mono shrink-0">{formatDate(email.timestamp)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DETAIL VIEW (Level 4) */}
                        {viewMode === 'detail' && selectedEmail && (
                            <div className="w-full h-full flex flex-col bg-[#0b1121] animate-fade-in">
                                <div className="p-8 border-b border-white/5 bg-navy-900/20">
                                    <div className="max-w-4xl mx-auto">
                                        <h2 className="text-2xl font-bold text-white mb-6 leading-tight">{selectedEmail.subject || 'No Subject'}</h2>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${selectedEmail.isStaff ? 'bg-purple-600' : 'bg-orange-600'}`}>
                                                    {selectedEmail.senderName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {selectedEmail.senderName} 
                                                        <span className="text-gray-500 font-normal ml-2">&lt;{selectedEmail.isStaff ? 'support@regibiz.com' : customer.email}&gt;</span>
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(selectedEmail.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Reply">
                                                    <CornerUpLeft size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="max-w-4xl mx-auto text-gray-300 text-base leading-relaxed whitespace-pre-wrap font-sans">
                                        {selectedEmail.text}
                                    </div>
                                </div>
                                {emailFolder === 'inbox' && (
                                    <div className="p-6 border-t border-white/5 bg-navy-900/30">
                                        <div className="max-w-4xl mx-auto">
                                            <button 
                                                onClick={() => {
                                                    setComposeData({ 
                                                        subject: `Re: ${selectedEmail.subject || 'No Subject'}`, 
                                                        body: `\n\n--- On ${new Date(selectedEmail.timestamp).toLocaleString()}, ${selectedEmail.senderName} wrote: ---\n${selectedEmail.text}` 
                                                    });
                                                    setShowCompose(true);
                                                }}
                                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white flex items-center gap-2 transition-colors font-bold"
                                            >
                                                <CornerUpLeft size={16} /> Reply to Thread
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- SERVICES SECTION --- */}
                {activeSection === 'services' && (
                    <div className="p-6 md:p-8 animate-fade-in h-full flex flex-col">
                        
                        {/* LIST VIEW (Level 3) */}
                        {viewMode === 'list' && (
                            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden flex-1 flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-navy-950/50 text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-white/5">
                                                <th className="px-6 py-4">Service Name</th>
                                                <th className="px-6 py-4">Ref ID</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {applications.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                        No service applications found.
                                                    </td>
                                                </tr>
                                            ) : applications.map(app => (
                                                <tr key={app.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => openServiceDetail(app)}>
                                                    <td className="px-6 py-4 text-white font-medium">
                                                        {app.title}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                                        {app.serviceId || app.id}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400">
                                                        {formatDate(app.submittedAt)}
                                                    </td>
                                                    <td className="px-6 py-4 text-emerald-400 font-mono">
                                                        ₹{app.amount?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={app.status || 'pending'} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-xs text-blue-400 font-bold hover:underline">View Details</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* DETAIL VIEW (Level 4) */}
                        {viewMode === 'detail' && selectedService && (
                            <div className="max-w-5xl mx-auto w-full animate-fade-in">
                                <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
                                    {/* Service Header */}
                                    <div className="p-8 border-b border-white/5 bg-navy-900/30 flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                                                <Briefcase size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-white mb-2">{selectedService.title}</h2>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">{selectedService.serviceId || selectedService.id}</span>
                                                    <span className="text-sm text-gray-400 flex items-center gap-1"><Clock size={14} /> Submitted on {formatDate(selectedService.submittedAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <StatusBadge status={selectedService.status || 'pending'} />
                                            <div className="relative mt-2">
                                                 <select 
                                                    value={selectedService.status} 
                                                    onChange={(e) => handleStatusUpdate(selectedService.id, e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer appearance-none pr-8"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <option value="submitted">Received</option>
                                                    <option value="paid">Payment Verified</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 grid grid-cols-3 gap-8">
                                        {/* Left: Form Data */}
                                        <div className="col-span-2 space-y-6">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Application Data</h3>
                                            <div className="grid grid-cols-2 gap-6">
                                                {selectedService.formData && Object.entries(selectedService.formData).map(([key, value]) => {
                                                    if (key === 'paymentId') return null;
                                                    return (
                                                        <div key={key}>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-sm text-gray-200 break-words">
                                                                {value?.toString() || '-'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Right: Payment & Meta */}
                                        <div className="col-span-1 space-y-6 border-l border-white/5 pl-8">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Payment Details</h3>
                                            
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Fee Paid</p>
                                                <p className="text-2xl font-bold text-emerald-400 font-mono">₹{selectedService.amount?.toLocaleString()}</p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Transaction ID</p>
                                                <div className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5 text-xs font-mono text-gray-400">
                                                    <Hash size={12} />
                                                    {selectedService.formData?.paymentId || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- DOCUMENTS SECTION --- */}
                {activeSection === 'documents' && (
                    <div className="p-6 md:p-8 animate-fade-in h-full flex flex-col">
                        
                        {/* LIST VIEW (Level 3) */}
                        {viewMode === 'list' && (
                            <div className="space-y-8">
                                {/* Folders Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {folders.map(folder => (
                                        <div key={folder.id} className="p-4 rounded-xl bg-navy-900/50 border border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all cursor-pointer hover:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                                    <FolderOpen size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{folder.name}</p>
                                                    <p className="text-[10px] text-gray-500">{documents.filter(d => d.folderId === folder.id).length} files</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Files Grid */}
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <FileText size={16} className="text-blue-400" /> Recent Files
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {documents.map(doc => (
                                            <div key={doc.id} onClick={() => openDocDetail(doc)} className="glass-card rounded-xl p-4 group relative hover:border-orange-500/30 transition-all cursor-pointer">
                                                 <div className="flex justify-between items-start mb-3">
                                                    <div className={`p-2.5 rounded-lg border border-white/5 ${
                                                        doc.type === 'file' ? 'bg-purple-500/10 text-purple-400' : 
                                                        doc.type === 'note' ? 'bg-yellow-500/10 text-yellow-400' : 
                                                        doc.type === 'legal' ? 'bg-blue-500/10 text-blue-400' : 
                                                        'bg-orange-500/10 text-orange-400'
                                                    }`}>
                                                        {doc.type === 'file' ? <File size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <button className="p-1 text-gray-500 hover:text-white rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                                <h3 className="text-sm font-semibold text-white mb-1 truncate" title={doc.title}>{doc.title}</h3>
                                                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-white/5">
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(doc.submittedAt)}</span>
                                                    <span className="bg-white/5 px-1.5 rounded text-[10px] uppercase">{doc.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DETAIL VIEW (Level 4) */}
                        {viewMode === 'detail' && selectedDoc && (
                             <div className="max-w-4xl mx-auto w-full animate-fade-in h-full flex flex-col">
                                 <div className="glass-panel rounded-xl border border-white/5 overflow-hidden flex-1 flex flex-col">
                                     <div className="p-6 border-b border-white/5 bg-navy-900/30 flex justify-between items-center shrink-0">
                                         <div>
                                             <h2 className="text-xl font-bold text-white">{selectedDoc.title}</h2>
                                             <p className="text-xs text-gray-500 mt-1 font-mono">{selectedDoc.id}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-orange-500/20">
                                                 <Download size={14} /> Download
                                             </button>
                                         </div>
                                     </div>
                                     
                                     <div className="flex-1 p-8 overflow-y-auto bg-navy-900/20 flex flex-col items-center justify-center">
                                         {selectedDoc.type === 'file' ? (
                                             <div className="text-center">
                                                 <FileText size={64} className="text-gray-600 mb-4 mx-auto" />
                                                 <p className="text-gray-400">Preview not available for this file type.</p>
                                             </div>
                                         ) : (
                                             <div className="w-full max-w-2xl bg-white text-black p-8 shadow-2xl min-h-[500px]">
                                                 <h1 className="text-2xl font-bold mb-4 border-b pb-2">{selectedDoc.title}</h1>
                                                 <div className="prose max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedDoc.content || '<p>No content available.</p>' }} />
                                                 
                                                 {selectedDoc.formData && (
                                                     <div className="mt-8 pt-8 border-t grid grid-cols-2 gap-4 text-xs">
                                                         {Object.entries(selectedDoc.formData).map(([k,v]) => (
                                                             <div key={k}>
                                                                 <strong className="block uppercase text-gray-500 mb-1">{k}</strong>
                                                                 <span>{v?.toString()}</span>
                                                             </div>
                                                         ))}
                                                     </div>
                                                 )}
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>
                        )}
                    </div>
                )}

            </div>
        </main>

        {/* Compose Modal */}
        {showCompose && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-navy-900 w-full max-w-lg rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-5 py-4 bg-navy-950/50 border-b border-white/10 flex justify-between items-center">
                        <span className="text-sm font-bold text-white">New Message</span>
                        <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSendEmail}>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-medium ml-1">Recipient</label>
                                <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                                    <User size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-300">{customer.email}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-medium ml-1">Subject</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500/50 outline-none transition-colors"
                                    placeholder="Enter subject..."
                                    value={composeData.subject}
                                    onChange={e => setComposeData({...composeData, subject: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-medium ml-1">Message Body</label>
                                <textarea 
                                    rows={5}
                                    className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500/50 outline-none resize-none transition-colors"
                                    placeholder="Type your message here..."
                                    value={composeData.body}
                                    onChange={e => setComposeData({...composeData, body: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-4 bg-navy-950/50 border-t border-white/10 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setShowCompose(false)}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={sendingEmail || !composeData.subject || !composeData.body}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {sendingEmail ? 'Sending...' : <><SendIcon size={14} /> Send Message</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default CustomerDetailPage;

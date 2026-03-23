import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Folder,
  FolderPlus,
  Search,
  MoreVertical,
  Loader2,
  CornerUpRight,
  Copy,
  Trash,
  Plus,
  CheckCircle,
  Clock,
  File,
  Menu,
  Shield,
  Edit2,
  FileSignature,
  Building,
  Users,
  AlertTriangle,
  Mail,
  Briefcase,
  Home,
  Gavel,
  ArrowLeft,
  PieChart,
  Eye,
} from 'lucide-react';
import { ServiceDocument, UserProfile, Folder as FolderType, UserRole } from '../types';
import { mockDbService } from '../services/mockFirebase';
import { formatDate } from '../utils/helpers';

interface DocumentsProps {
  user: UserProfile;
}

// Template Definitions
interface LegalTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Agreement' | 'Notice' | 'HR' | 'Letter' | 'Invoice';
  icon: any;
}

const LEGAL_TEMPLATES: LegalTemplate[] = [
  { id: 'nda', title: 'Non-Disclosure Agreement', description: 'Protect confidential business information.', category: 'Agreement', icon: Shield },
  { id: 'msa', title: 'Master Service Agreement', description: 'Create a flexible contract for services.', category: 'Agreement', icon: Briefcase },
  { id: 'franchise', title: 'Franchise Agreement', description: 'Formalize a franchise relationship.', category: 'Agreement', icon: Building },
  { id: 'commercial-rent', title: 'Commercial Rental Agreement', description: 'Draft precise commercial lease terms.', category: 'Agreement', icon: Building },
  { id: 'recovery-notice', title: 'Legal Notice - Recovery', description: 'Send a formal notice for money recovery.', category: 'Notice', icon: Gavel },
  { id: 'residential-rent', title: 'Residential Rental Agreement', description: 'Create a legally sound rental contract.', category: 'Agreement', icon: Home },
  { id: 'agm-notice', title: 'Notice - AGM', description: 'Generate formal Annual General Meeting notice.', category: 'Notice', icon: Users },
  { id: 'exp-letter', title: 'Experience Letter', description: 'Confirm an employee\'s tenure and role.', category: 'HR', icon: FileText },
  { id: 'cheque-bounce', title: 'Cheque Bounce Notice', description: 'Formal legal notice for dishonored cheque.', category: 'Notice', icon: AlertTriangle },
  { id: 'employment', title: 'Employment Contract', description: 'Standard appointment letter for new hires.', category: 'HR', icon: Users },
  { id: 'noc', title: 'Consent Letter / NOC', description: 'Ensure GST or property compliance.', category: 'Letter', icon: CheckCircle },
  { id: 'offer-letter', title: 'Offer of Employment', description: 'Formally extend a job offer with terms.', category: 'HR', icon: Mail },
];

const Documents: React.FC<DocumentsProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');

  // Data State
  const [docs, setDocs] = useState<ServiceDocument[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedFolderId, setSelectedFolderId] = useState<string>('regibiz');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminReportData, setAdminReportData] = useState<any[]>([]);
  const [viewingCustomerName, setViewingCustomerName] = useState<string | null>(null);

  // Modal States
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [showDeleteFolder, setShowDeleteFolder] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderType | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  // Legal Doc States
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalStep, setLegalStep] = useState<'catalog' | 'form'>('catalog');
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);
  const [legalForm, setLegalForm] = useState({
    recipient: '',
    date: new Date().toISOString().split('T')[0],
    clause: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document Action States
  const [showMoveCopy, setShowMoveCopy] = useState(false);
  const [actionDoc, setActionDoc] = useState<ServiceDocument | null>(null);
  const [actionType, setActionType] = useState<'move' | 'copy'>('move');
  const [viewDoc, setViewDoc] = useState<ServiceDocument | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const isStaff = user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT;
  const effectiveUid = isStaff && targetUid ? targetUid : user.uid;
  const isViewingOther = isStaff && targetUid && targetUid !== user.uid;

  // Initialize Data
  useEffect(() => {
    fetchData();
  }, [effectiveUid, isAdminView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdminView) {
        const allDocsData = await mockDbService.getAllDocuments();
        const report = LEGAL_TEMPLATES.map((template) => {
          const matches = allDocsData.filter((d) => d.doc.subtype === template.id);
          return {
            ...template,
            generatedCount: matches.length,
            recipients: matches.map((m) => m.user.displayName).slice(0, 5),
          };
        });
        setAdminReportData(report);
      } else {
        if (isViewingOther) {
          const allUsers = await mockDbService.getAllUsers();
          const targetUser = allUsers.find((u) => u.uid === targetUid);
          setViewingCustomerName(targetUser ? targetUser.displayName : 'Unknown User');
        } else {
          setViewingCustomerName(null);
        }

        const [fetchedDocs, fetchedFolders] = await Promise.all([
          mockDbService.getDocuments(effectiveUid),
          mockDbService.getFolders(effectiveUid),
        ]);
        setDocs(fetchedDocs);
        setFolders(fetchedFolders);
      }
    } catch (error) {
      console.error('Failed to fetch vault data', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsSubmitting(true);
    try {
      const newFolder = await mockDbService.createFolder(newFolderName, effectiveUid);
      setFolders([...folders, newFolder]);
      setSelectedFolderId(newFolder.id);
      setShowCreateFolder(false);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !folderToEdit) return;
    setIsSubmitting(true);
    try {
      await mockDbService.renameFolder(folderToEdit.id, newFolderName);
      setFolders(folders.map((f) => (f.id === folderToEdit.id ? { ...f, name: newFolderName } : f)));
      setShowRenameFolder(false);
      setFolderToEdit(null);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
      alert('Failed to rename folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!folderToEdit) return;
    setIsSubmitting(true);
    try {
      await mockDbService.deleteFolder(folderToEdit.id);
      setFolders(folders.filter((f) => f.id !== folderToEdit.id));
      if (selectedFolderId === folderToEdit.id) {
        setSelectedFolderId('personal');
      }
      const updatedDocs = await mockDbService.getDocuments(effectiveUid);
      setDocs(updatedDocs);
      setShowDeleteFolder(false);
      setFolderToEdit(null);
    } catch (err) {
      console.error('Failed to delete folder', err);
      alert('Failed to delete folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateLegalContent = (template: LegalTemplate, data: typeof legalForm) => {
    const header = `<div class="text-center mb-8 border-b border-gray-700 pb-4">
<h1 class="text-2xl font-bold uppercase tracking-wide text-orange-400">${template.title}</h1>
<p class="text-sm text-gray-400 mt-1">Generated on ${new Date().toLocaleDateString()}</p>
</div>`;
    let body = '';
    switch (template.id) {
      case 'nda':
        body = `
<p class="mb-4">This Non-Disclosure Agreement (the "Agreement") is entered into as of <strong>${data.date}</strong> by and between <strong>${user.displayName}</strong> ("Disclosing Party") and <strong>${data.recipient}</strong> ("Receiving Party").</p>
<h3 class="font-bold mt-4 mb-2 text-white">1. Confidential Information</h3>
<p class="mb-2 text-gray-300">The Receiving Party understands that the Disclosing Party has disclosed or may disclose information relating to business, technical or financial affairs of the Disclosing Party.</p>
<h3 class="font-bold mt-4 mb-2 text-white">2. Obligations</h3>
<p class="mb-2 text-gray-300">The Receiving Party agrees to hold all Confidential Information in strict confidence and not to disclose it to others or use it in any way, commercially or otherwise, except for use in the business relationship.</p>
`;
        break;
      case 'employment':
      case 'offer-letter':
        body = `
<p class="mb-4"><strong>Date:</strong> ${data.date}</p>
<p class="mb-4"><strong>To:</strong> ${data.recipient}</p>
<p class="mb-4">Subject: Offer of Employment</p>
<p class="mb-4 text-gray-300">Dear ${data.recipient},</p>
<p class="mb-4 text-gray-300">We are pleased to offer you the position at <strong>${user.displayName || 'Our Company'}</strong>. We believe your skills and experience are an excellent match for our company.</p>
<p class="mb-4 text-gray-300">The annual cost to company (CTC) for this position is [Amount]. Your start date will be ${data.date}.</p>
`;
        break;
      case 'commercial-rent':
      case 'residential-rent':
        body = `
<p class="mb-4">This RENTAL AGREEMENT is made on <strong>${data.date}</strong> between <strong>${user.displayName}</strong> (Landlord) and <strong>${data.recipient}</strong> (Tenant).</p>
<h3 class="font-bold mt-4 mb-2 text-white">1. Property Details</h3>
<p class="mb-2 text-gray-300">The Landlord agrees to let out the property located at [Address] to the Tenant for a period of 11 months.</p>
<h3 class="font-bold mt-4 mb-2 text-white">2. Rent Payment</h3>
<p class="mb-2 text-gray-300">The Tenant agrees to pay a monthly rent of [Amount] on or before the 5th of every month.</p>
`;
        break;
      default:
        body = `
<p class="mb-4"><strong>Effective Date:</strong> ${data.date}</p>
<p class="mb-4">This document constitutes a formal ${template.title} between <strong>${user.displayName}</strong> and <strong>${data.recipient}</strong>.</p>
<p class="mb-4 text-gray-300">Whereas the parties desire to enter into this agreement to define their respective rights and duties.</p>
<p class="mb-4 text-gray-300">Now, therefore, in consideration of the mutual covenants contained herein, the parties agree as follows:</p>
<ul class="list-disc pl-5 space-y-2 text-gray-300">
<li>Clause 1: Scope of Agreement</li>
<li>Clause 2: Term and Termination</li>
<li>Clause 3: Governing Law</li>
</ul>
`;
    }
    const custom = data.clause
      ? `<div class="mt-6 p-4 bg-gray-800/50 rounded border border-gray-700"><h3 class="font-bold text-sm mb-2 text-orange-400">Additional Clauses</h3><p class="text-sm italic text-gray-300">${data.clause}</p></div>`
      : '';
    const footer = `<div class="mt-12 pt-8 border-t border-gray-700 flex justify-between">
<div class="text-center"><p class="mb-4 border-b border-gray-600 w-40"></p><p class="text-xs uppercase text-gray-500">Signature of ${user.displayName}</p></div>
<div class="text-center"><p class="mb-4 border-b border-gray-600 w-40"></p><p class="text-xs uppercase text-gray-500">Signature of ${data.recipient}</p></div>
</div>`;
    return `${header}${body}${custom}${footer}`;
  };

  const handleSelectTemplate = (template: LegalTemplate) => {
    setSelectedTemplate(template);
    setLegalStep('form');
  };

  const handleGenerateLegalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      const content = generateLegalContent(selectedTemplate, legalForm);
      const title = `${selectedTemplate.title} - ${legalForm.recipient}`;
      const newDoc: ServiceDocument = {
        id: `DOC-${Date.now()}`,
        type: 'legal',
        subtype: selectedTemplate.id,
        title: title,
        content: content,
        submittedAt: Date.now(),
        formData: { ...legalForm },
        userId: user.uid,
        folderId: 'personal',
      };
      await mockDbService.createDocument(newDoc);
      setDocs([...docs, newDoc]);
      setShowLegalModal(false);
      setLegalStep('catalog');
      setSelectedTemplate(null);
      setLegalForm({ recipient: '', date: new Date().toISOString().split('T')[0], clause: '' });
      setSelectedFolderId('personal');
      alert('✅ Legal document saved to Personal folder!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveCopy = async (targetFolderId: string) => {
    if (!actionDoc) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'move') {
        await mockDbService.moveDocument(actionDoc.id, targetFolderId);
        setDocs(docs.map((d) => (d.id === actionDoc.id ? { ...d, folderId: targetFolderId } : d)));
      } else {
        await mockDbService.copyDocument(actionDoc.id, targetFolderId);
        const updatedDocs = await mockDbService.getDocuments(user.uid);
        setDocs(updatedDocs);
      }
      setShowMoveCopy(false);
      setActionDoc(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await mockDbService.deleteDocument(docId);
      setDocs(docs.filter((d) => d.id !== docId));
    }
  };

  // Helper UI
  const filteredDocs = docs.filter((doc) => {
    const matchesFolder = doc.folderId === selectedFolderId;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.serviceId && doc.serviceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const currentFolder = folders.find((f) => f.id === selectedFolderId);

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText size={20} />;
      case 'file':
        return <File size={20} />;
      case 'legal':
        return <FileSignature size={20} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  // --- ADMIN REPORT VIEW ---
  if (isAdminView) {
    return (
      <div className="p-6 md:p-8 animate-fade-in pb-20 overflow-y-auto h-full bg-[#020c1b]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gradient-heading">Document Generation Report</h2>
            <p className="text-gray-400 text-sm">Track usage of legal templates across the platform.</p>
          </div>
          <button
            onClick={() => setIsAdminView(false)}
            className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Back to My Vault
          </button>
        </div>
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/5">
                <th className="p-4">Document Template</th>
                <th className="p-4">Category</th>
                <th className="p-4">Total Generated</th>
                <th className="p-4">Recent Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {adminReportData.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg text-orange-400">
                      <item.icon size={16} />
                    </div>
                    <span className="font-medium text-white">{item.title}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/5">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white">{item.generatedCount}</td>
                  <td className="p-4 text-xs text-gray-400">
                    {item.recipients.length > 0 ? item.recipients.join(', ') : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- NORMAL VAULT VIEW ---
  return (
    <div
      className="flex h-[calc(100vh-64px)] overflow-hidden animate-fade-in relative"
      onClick={() => {
        setOpenDropdownId(null);
        setOpenFolderMenuId(null);
      }}
    >
      {/* Staff Override Banner */}
      {viewingCustomerName && (
        <div className="absolute top-0 left-0 right-0 z-40 bg-orange-500 text-white text-xs font-bold px-4 py-1 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Eye size={12} />
            Viewing Vault: {viewingCustomerName}
          </div>
          <button onClick={() => window.history.back()} className="underline hover:text-black transition-colors">
            Back to Dashboard
          </button>
        </div>
      )}

      {/* --- Left Rail (Folders) --- */}
      <aside
        className={`absolute md:relative z-20 w-64 h-full glass-panel border-r border-white/5 flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 bg-navy-900 md:bg-transparent ${viewingCustomerName ? 'pt-6' : ''}`}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider">
            {viewingCustomerName ? 'Customer Vault' : 'My Vault'}
          </h3>
          {!viewingCustomerName && (
            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-orange-500 transition-colors"
              title="New Folder"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {folders.map((folder) => (
            <div key={folder.id} className="relative group">
              <button
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedFolderId === folder.id
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Folder
                    size={16}
                    className={`flex-shrink-0 ${selectedFolderId === folder.id ? 'fill-orange-500/20' : ''}`}
                  />
                  <span className="truncate max-w-[100px]">{folder.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full text-gray-500 mr-1">
                    {docs.filter((d) => d.folderId === folder.id).length}
                  </span>
                  {!viewingCustomerName && folder.type !== 'system' && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFolderMenuId(openFolderMenuId === folder.id ? null : folder.id);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreVertical size={12} />
                    </div>
                  )}
                </div>
              </button>
              {!viewingCustomerName && openFolderMenuId === folder.id && (
                <div className="absolute right-0 top-full z-30 mt-1 w-32 bg-navy-900 border border-white/10 rounded-lg shadow-xl py-1 animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToEdit(folder);
                      setNewFolderName(folder.name);
                      setShowRenameFolder(true);
                      setOpenFolderMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                  >
                    <Edit2 size={12} /> Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToEdit(folder);
                      setShowDeleteFolder(true);
                      setOpenFolderMenuId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {isStaff && !viewingCustomerName && (
          <div className="p-4 border-t border-white/5 bg-white/5">
            <button
              onClick={() => setIsAdminView(true)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-navy-900 hover:bg-navy-800 border border-white/10 rounded-lg text-xs text-gray-300 transition-colors"
            >
              <PieChart size={14} /> Global Reports
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* --- Main Content --- */}
      <main className={`flex-1 flex flex-col min-w-0 bg-[#020c1b] ${viewingCustomerName ? 'pt-6' : ''}`}>
        {/* Toolbar */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-gradient-heading flex items-center gap-2">
              <Folder size={20} className="text-orange-500" />
              {currentFolder?.name || 'Loading...'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-navy-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 w-48 transition-all"
              />
            </div>
            {!viewingCustomerName && (
              <button
                onClick={() => {
                  setShowLegalModal(true);
                  setLegalStep('catalog');
                }}
                className="hidden sm:flex items-center gap-2 bg-orange-500/10 border border-orange-500/50 hover:bg-orange-500/20 text-orange-400 text-sm font-medium px-4 py-2 rounded-lg transition-all"
              >
                <FileSignature size={16} /> Generate Legal Doc
              </button>
            )}
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <FolderPlus size={32} strokeWidth={1.5} />
              </div>
              <p className="text-lg font-medium text-gray-400">This folder is empty</p>
              <p className="text-sm">Submissions, legal docs, and notes will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="glass-card rounded-xl p-4 group relative hover:border-orange-500/30 transition-all"
                >
                  {openDropdownId === doc.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                      <div className="absolute top-10 right-2 z-20 w-40 bg-navy-900 border border-white/10 rounded-lg shadow-xl py-1 animate-fade-in">
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <Trash size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={`p-2.5 rounded-lg border border-white/5 ${
                        doc.type === 'file'
                          ? 'bg-purple-500/10 text-purple-400'
                          : doc.type === 'note'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : doc.type === 'legal'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-orange-500/10 text-orange-400'
                      }`}
                    >
                      {getDocIcon(doc.type)}
                    </div>
                    {(effectiveUid === user.uid || isStaff) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === doc.id ? null : doc.id);
                        }}
                        className="p-1 text-gray-500 hover:text-white rounded hover:bg-white/10"
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 truncate" title={doc.title}>
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    {doc.serviceId ? (
                      <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                        {doc.serviceId}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded capitalize">
                        {doc.subtype || doc.type}
                      </span>
                    )}
                    {doc.status && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          doc.status === 'submitted'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : doc.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-400'
                            : doc.status === 'approved'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {formatDate(doc.submittedAt)}
                    </span>
                    {doc.size && <span>{doc.size}</span>}
                  </div>
                  <button onClick={() => setViewDoc(doc)} className="absolute inset-0 z-0 cursor-pointer"></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- Modals --- */}
      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6 border border-white/10">
            <h3 className="text-lg font-bold text-gradient-heading mb-4">Create New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input
                autoFocus
                type="text"
                placeholder="Folder Name (e.g. Tax Docs)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-navy-900 border border-white/20 rounded-lg px-4 py-2.5 text-white mb-6 focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolder && folderToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6 border border-white/10">
            <h3 className="text-lg font-bold text-gradient-heading mb-4">Rename Folder</h3>
            <form onSubmit={handleRenameFolder}>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-navy-900 border border-white/20 rounded-lg px-4 py-2.5 text-white mb-6 focus:outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRenameFolder(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {showDeleteFolder && folderToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-2xl w-full max-w-sm p-6 border border-white/10">
            <h3 className="text-lg font-bold text-gradient-heading mb-2">Delete "{folderToEdit.name}"?</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              This will <strong>move all documents</strong> inside this folder to your <strong>Personal</strong> folder. The
              folder itself will be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteFolder(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFolderConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Delete & Move Docs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Legal Doc Modal */}
      {showLegalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`glass-panel rounded-2xl w-full border border-white/10 transition-all ${
              legalStep === 'catalog' ? 'max-w-4xl h-[80vh] flex flex-col' : 'max-w-lg'
            }`}
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-navy-950/50">
              <div>
                <h3 className="text-xl font-bold text-gradient-heading">
                  {legalStep === 'catalog' ? 'Legal Document Catalog' : selectedTemplate?.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {legalStep === 'catalog'
                    ? 'Select a professionally drafted template to get started.'
                    : 'Fill in the details to generate your document.'}
                </p>
              </div>
              <button
                onClick={() => setShowLegalModal(false)}
                className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded"
              >
                ✕
              </button>
            </div>
            {legalStep === 'catalog' && (
              <div className="flex-1 overflow-y-auto p-6 bg-navy-900/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {LEGAL_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className="glass-card p-5 rounded-xl border border-white/5 hover:border-orange-500/30 group transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <template.icon size={20} />
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                            template.category === 'Agreement'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : template.category === 'Notice'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              : template.category === 'HR'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}
                        >
                          {template.category}
                        </span>
                      </div>
                      <h4 className="text-white font-bold mb-2">{template.title}</h4>
                      <p className="text-sm text-gray-400 mb-6 flex-1">{template.description}</p>
                      <button
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full py-2 bg-white/5 hover:bg-orange-500/10 text-gray-300 hover:text-orange-400 border border-white/10 hover:border-orange-500/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                      >
                        <Plus size={14} /> Create Document
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {legalStep === 'form' && selectedTemplate && (
              <div className="p-6">
                <button
                  onClick={() => setLegalStep('catalog')}
                  className="flex items-center text-xs text-gray-400 hover:text-white mb-4 transition-colors"
                >
                  <ArrowLeft size={12} className="mr-1" /> Back to Catalog
                </button>
                <form onSubmit={handleGenerateLegalDoc} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Effective Date</label>
                    <input
                      type="date"
                      value={legalForm.date}
                      onChange={(e) => setLegalForm({ ...legalForm, date: e.target.value })}
                      className="w-full bg-navy-900 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Recipient Name / Company</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe OR Acme Corp Pvt Ltd"
                      value={legalForm.recipient}
                      onChange={(e) => setLegalForm({ ...legalForm, recipient: e.target.value })}
                      className="w-full bg-navy-900 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Custom Clauses (Optional)</label>
                    <textarea
                      rows={4}
                      placeholder="Add specific terms, conditions, or salary details..."
                      value={legalForm.clause}
                      onChange={(e) => setLegalForm({ ...legalForm, clause: e.target.value })}
                      className="w-full bg-navy-900 border border-white/20 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowLegalModal(false)}
                      className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Generating...' : 'Generate Document'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move/Copy Modal */}
      {showMoveCopy && actionDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-2xl w-full max-w-sm p-0 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-bold text-gradient-heading capitalize">{actionType} Document</h3>
              <p className="text-xs text-gray-400 truncate mt-1">Select destination for "{actionDoc.title}"</p>
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              {folders
                .filter((f) => actionType === 'copy' || f.id !== actionDoc.folderId)
                .map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveCopy(f.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left text-gray-300 hover:text-orange-400 rounded-lg transition-colors"
                  >
                    <Folder size={18} />
                    <span className="text-sm font-medium">{f.name}</span>
                  </button>
                ))}
            </div>
            <div className="p-3 bg-black/20 border-t border-white/5 text-center">
              <button onClick={() => setShowMoveCopy(false)} className="text-xs text-gray-500 hover:text-gray-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-bold text-gradient-heading">{viewDoc.title}</h3>
                <div className="flex gap-2 mt-1">
                  {viewDoc.serviceId && <span className="text-xs font-mono text-orange-500">{viewDoc.serviceId}</span>}
                  {viewDoc.type === 'legal' && (
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1 rounded uppercase">
                      {viewDoc.subtype}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    in {folders.find((f) => f.id === viewDoc.folderId)?.name}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-6">
              {(viewDoc.type === 'note' || viewDoc.type === 'legal') && (
                <div className="prose prose-invert max-w-none text-gray-300">
                  <div dangerouslySetInnerHTML={{ __html: viewDoc.content || 'No content.' }} />
                </div>
              )}
              {viewDoc.type === 'legal' && viewDoc.formData && (
                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Recipient
                    </label>
                    <p className="text-sm text-gray-200">{viewDoc.formData.recipient}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Effective Date
                    </label>
                    <p className="text-sm text-gray-200">{viewDoc.formData.date}</p>
                  </div>
                </div>
              )}
              {viewDoc.type !== 'note' &&
                viewDoc.type !== 'file' &&
                viewDoc.type !== 'legal' &&
                viewDoc.formData && (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(viewDoc.formData).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm text-gray-200 truncate">{value?.toString() || '-'}</p>
                      </div>
                    ))}
                  </div>
                )}
              {viewDoc.type === 'file' && (
                <div className="flex items-center justify-center py-10 border-2 border-dashed border-white/10 rounded-xl bg-black/20">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400">File Preview Not Available</p>
                    <button className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-orange-400">
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
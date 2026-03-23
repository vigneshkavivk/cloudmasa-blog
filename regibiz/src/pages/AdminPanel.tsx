import React, { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Trash, 
  AlertTriangle, 
  X, 
  Mail,
  Shield,
  Clock,
  UserX,
  Edit2,
  CheckCircle,
  Loader2,
  Check,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { mockDbService, mockAuthService } from '../services/mockFirebase';

const AdminPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.SUPPORT);
  const [inviteError, setInviteError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Helper
  const isSuperAdmin = currentUser?.role === UserRole.SUPERADMIN;

  useEffect(() => {
    const unsubscribe = mockAuthService.subscribeToAuth((u) => {
        if (u) {
            setCurrentUser(u);
            fetchUsers();
        }
    });
    return () => unsubscribe();
  }, []);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await mockDbService.getAllUsers();
      const nonCustomers = data.filter(u => u.role !== UserRole.CUSTOMER);
      const pending = nonCustomers.filter(u => u.status === 'invited');
      const team = nonCustomers.filter(u => u.status !== 'invited');
      setPendingInvites(pending);
      setTeamMembers(team);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Shared Email Sending Logic
  const sendInviteEmail = async (email: string, role: string, token: string) => {
      const inviteLink = `${window.location.origin}/#/register?token=${token}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background-color: #f4f7fa; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #0a192f; padding: 24px; text-align: center;">
              <h1 style="color: #f97316; margin: 0;">RegiBIZ</h1>
            </div>
            <div style="padding: 32px; color: #334155;">
              <h2 style="margin-top: 0; color: #0f172a;">You've been invited!</h2>
              <p>You have been assigned the role: <strong style="color: #ea580c;">${role.toUpperCase()}</strong></p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" style="background: #f97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
              </div>
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                Link: <a href="${inviteLink}" style="color: #f97316;">${inviteLink}</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Use CORS Proxy to bypass browser restrictions
      const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://api.resend.com/emails');

      const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
              'Authorization': 'Bearer re_ZdESSSfe_GcZa1rjAzGGdANbwDDFBxE2T',
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              from: 'RegiBIZ Team <onboarding@resend.dev>', // Using Resend's default sender for testing
              to: [email],
              subject: "You've been invited to join RegiBIZ",
              html: emailHtml
          })
      });

      if (!response.ok) {
          const text = await response.text();
          console.error("Resend API Error:", text);
          
          let errorMessage = "Email service failed to send.";
          try {
             const json = JSON.parse(text);
             if (json.message) errorMessage = json.message;
          } catch (e) {
             errorMessage += " " + response.statusText;
          }
          
          throw new Error(errorMessage);
      }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setIsSending(true);
    let createdToken: string | null = null;

    try {
        if (!currentUser) throw new Error("You must be logged in to send invites.");

        // 1. Generate Token & Save to Firestore
        createdToken = await mockDbService.inviteUser(inviteEmail, inviteRole, currentUser.uid);
        
        // 2. Send Email
        await sendInviteEmail(inviteEmail, inviteRole, createdToken);
        
        // Success
        setToastMessage(`Invite sent to ${inviteEmail} successfully!`);
        setShowInviteModal(false);
        resetInviteModal();
        fetchUsers();

    } catch (err: any) {
        console.error("Invite Error:", err);
        
        // ROLLBACK: If email failed but token was created, delete the token so user can try again immediately
        if (createdToken && (err.message.includes("Email service") || err.message.includes("Resend"))) {
            try {
                await mockDbService.deactivateUser('pending_' + createdToken);
            } catch (cleanupErr) {
                console.error("Failed to cleanup after failed email", cleanupErr);
            }
        }

        const msg = err.message || "Failed to send invite.";
        if (msg.includes("already exists")) {
            setInviteError("User already exists. Check the list below to Renew.");
        } else if (msg.includes("Failed to fetch")) {
            setInviteError("Network error. Please check your connection.");
        } else {
            setInviteError(msg);
        }
    } finally {
        setIsSending(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!isSuperAdmin) return;
    try {
      await mockDbService.updateUserRole(uid, newRole);
      fetchUsers();
    } catch (e) {
      console.error("Role update failed", e);
      alert("Failed to update role");
    }
  };

  const confirmDeleteUser = (user: UserProfile) => {
    setUserToAction(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToAction || !isSuperAdmin) return;
    setIsProcessingAction(true);
    try {
        await mockDbService.deleteSystemUser(userToAction.uid);
        setShowDeleteModal(false);
        setUserToAction(null);
        setToastMessage("User deleted successfully.");
        fetchUsers();
    } catch (e: any) {
        console.error("Delete failed:", e);
        alert("Failed to delete user: " + e.message);
    } finally {
        setIsProcessingAction(false);
    }
  };

  const handleCancelInvite = async (user: UserProfile) => {
     if (!confirm(`Revoke invitation for ${user.email}?`)) return;
     setActionLoadingId(user.uid);
     try {
        await mockDbService.deactivateUser(user.uid); 
        setToastMessage("Invitation revoked.");
        await fetchUsers();
     } catch (e) {
        console.error("Cancel invite failed", e);
        alert("Failed to cancel invitation.");
     } finally {
        setActionLoadingId(null);
     }
  };

  const handleResendInvite = async (user: UserProfile) => {
      setActionLoadingId(user.uid);
      try {
          // 1. Regenerate token in DB
          const oldToken = user.uid.replace('pending_', '');
          
          await mockDbService.deactivateUser(user.uid); // Delete old
          const newToken = await mockDbService.inviteUser(user.email!, user.role, currentUser?.uid || 'admin'); // Create new
          
          // 2. Send Email
          await sendInviteEmail(user.email!, user.role, newToken);

          await fetchUsers();
          setToastMessage(`Invite renewed and email sent to ${user.email}.`);
      } catch (e: any) {
          console.error("Resend failed", e);
          alert("Failed to resend: " + e.message);
      } finally {
          setActionLoadingId(null);
      }
  };

  const resetInviteModal = () => {
      setInviteEmail('');
      setInviteRole(UserRole.SUPPORT);
      setInviteError('');
  };

  const StatusBadge = ({ status }: { status: string }) => {
     const styles = {
        invited: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        accepted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        blocked: 'bg-red-500/10 text-red-500 border-red-500/20'
     };
     const label = status === 'blocked' ? 'Deactivated' : status;
     return (
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${styles[status as keyof typeof styles] || 'bg-gray-500/10 text-gray-500'}`}>
           {label}
        </span>
     );
  };

  return (
    <div className="p-6 md:p-8 animate-fade-in pb-20 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 animate-fade-in">
           <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">{toastMessage}</span>
           </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gradient-heading">Team Management</h2>
          <p className="text-gray-400 text-sm mt-1">Manage internal access levels and invitations.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transform hover:-translate-y-0.5"
        >
          <UserPlus size={18} /> Invite Team
        </button>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* SECTION A: PENDING INVITATIONS */}
        {pendingInvites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
              <Clock size={20} /> Pending Invitations
            </h3>
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-navy-950/50 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                       <th className="p-4 pl-6">User Email</th>
                       <th className="p-4">Assigned Role</th>
                       <th className="p-4">Invited By</th>
                       <th className="p-4">Status</th>
                       <th className="p-4 text-right pr-6">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 text-sm">
                     {pendingInvites.map((u) => (
                       <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                         <td className="p-4 pl-6 text-white font-medium">{u.email}</td>
                         <td className="p-4">
                            <span className="bg-white/5 px-2 py-1 rounded text-xs text-gray-300 border border-white/10 uppercase font-bold tracking-wide">
                               {u.role}
                            </span>
                         </td>
                         <td className="p-4 text-gray-500 text-xs">Admin</td>
                         <td className="p-4"><StatusBadge status="invited" /></td>
                         <td className="p-4 pr-6 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => handleResendInvite(u)}
                                 disabled={actionLoadingId === u.uid}
                                 className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-500/20 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                               >
                                 <RefreshCw size={12} className={actionLoadingId === u.uid ? "animate-spin" : ""} />
                                 {actionLoadingId === u.uid ? 'Renewing...' : 'Renew'}
                               </button>
                               <button 
                                 onClick={() => handleCancelInvite(u)}
                                 disabled={actionLoadingId === u.uid}
                                 className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                               >
                                 {actionLoadingId === u.uid ? 'Canceling...' : 'Cancel'}
                               </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* SECTION B: TEAM MEMBERS */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
             <Shield size={20} /> Team Members
          </h3>
          <div className="glass-panel rounded-xl border border-white/5 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy-950/50 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5">
                    <th className="p-4 pl-6">User Profile</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Invited By</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {teamMembers.map((u) => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner ${
                               u.role === UserRole.SUPERADMIN ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30' :
                               u.role === UserRole.ADMIN ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' :
                               'bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/30'
                           }`}>
                               {u.displayName ? u.displayName.charAt(0).toUpperCase() : '?'}
                           </div>
                           <div>
                               <p className="text-white font-bold text-sm">{u.displayName || 'Unnamed User'}</p>
                               <p className="text-gray-500 text-xs">{u.email}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {isSuperAdmin && u.role !== UserRole.SUPERADMIN ? (
                           <div className="relative group inline-block">
                             <select 
                               value={u.role} 
                               onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                               className="appearance-none bg-black/20 border border-white/10 rounded px-3 py-1.5 text-xs text-gray-300 focus:border-orange-500 outline-none pr-8 cursor-pointer hover:bg-white/5 transition-colors"
                             >
                                <option value={UserRole.ADMIN}>Admin</option>
                                <option value={UserRole.SUPPORT}>Support</option>
                             </select>
                             <Edit2 size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                           </div>
                        ) : (
                           <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                              u.role === UserRole.SUPERADMIN ? 'text-purple-400 bg-purple-500/5' : 'text-gray-300 bg-white/5'
                           }`}>
                              {u.role}
                           </span>
                        )}
                      </td>
                      <td className="p-4">
                         <StatusBadge status={u.status} />
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                         {u.invitedBy ? (
                            <span className="flex items-center gap-1"><Check size={12} className="text-green-500" /> Admin</span>
                         ) : 'System'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {isSuperAdmin && u.role !== UserRole.SUPERADMIN ? (
                           <button 
                               onClick={() => confirmDeleteUser(u)}
                               className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                               title="Permanently Delete User"
                           >
                               <Trash size={16} />
                           </button>
                        ) : (
                           <span className="text-gray-600 text-xs italic">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {teamMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">No active team members found. Invite someone to get started.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
            <h3 className="text-xl font-bold text-gradient-heading mb-4">Invite Team Member</h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@regibiz.com"
                  className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Assign Role</label>
                <div className="relative">
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-orange-500 text-sm appearance-none">
                    {isSuperAdmin && <option value={UserRole.ADMIN}>Admin</option>}
                    <option value={UserRole.SUPPORT}>Support</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      <Shield size={14} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  {inviteRole === UserRole.ADMIN ? 'Can view all analytics and manage support staff.' : 'Can manage assigned applications only.'}
                </p>
              </div>

              {inviteError && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {inviteError}</p>}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                <button type="submit" disabled={isSending} className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg py-2 hover:from-orange-400 hover:to-red-500 text-sm shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                    {isSending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {showDeleteModal && userToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-800 rounded-2xl border border-white/10 w-full max-w-sm p-6 shadow-2xl relative animate-fade-in border-t-4 border-t-red-500">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/20">
                  <UserX className="text-red-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete User?</h3>
              <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
                  You are about to permanently delete <strong>{userToAction.displayName || userToAction.email}</strong>.
                  <br/><br/>
                  <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded">
                     Warning: This action cannot be undone.
                  </span>
              </p>
              
              <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteModal(false)} 
                    className="flex-1 py-2.5 text-gray-400 hover:text-white text-sm font-medium hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    disabled={isProcessingAction}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg py-2.5 text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessingAction ? 'Deleting...' : 'Confirm Delete'}
                  </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
import React, { useEffect, useState } from 'react';
import {
  Trash,
  AlertTriangle,
  X,
  Shield,
  UserX,
  Edit2,
  CheckCircle,
  Loader2,
  Check,
  User
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { mockDbService, mockAuthService } from '../services/mockFirebase';

const AdminPanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Create User Modal States Only
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    displayName: '',
    email: '',
    password: '',
    role: UserRole.SUPPORT,
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null);

  // Action States
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToAction, setUserToAction] = useState<UserProfile | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

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
      // ✅ Removed pending invites filter
      setTeamMembers(nonCustomers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  // Generate temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Auto-fill password
  const autoFillPassword = () => {
    setNewUserData({ ...newUserData, password: generateTempPassword() });
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserLoading(true);
    try {
      if (!currentUser) throw new Error("You must be logged in");
      await mockDbService.createUser({
        email: newUserData.email,
        password: newUserData.password,
        displayName: newUserData.displayName,
        role: newUserData.role,
        invitedBy: currentUser.uid,
      });
      setCreatedCredentials({
        email: newUserData.email,
        password: newUserData.password,
      });
      setToastMessage(`User created successfully!`);
      setShowCreateUserModal(false);
      resetCreateUserForm();
      fetchUsers();
    } catch (err: any) {
      console.error("Create user error:", err);
      setCreateUserError(err.message || "Failed to create user");
    } finally {
      setCreateUserLoading(false);
    }
  };

  const resetCreateUserForm = () => {
    setNewUserData({
      displayName: '',
      email: '',
      password: '',
      role: UserRole.SUPPORT,
    });
    setCreatedCredentials(null);
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
          <p className="text-gray-400 text-sm mt-1">Manage internal access levels and team members.</p>
        </div>
        {/* ✅ Only Create User Button - Invite Removed */}
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transform hover:-translate-y-0.5"
        >
          <User size={18} /> Create User
        </button>
      </div>

      {/* Team Members Section Only */}
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
                  <th className="p-4">Created By</th>
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
                    <td colSpan={5} className="p-8 text-center text-gray-500">No team members found. Create a user to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ✅ Create User Modal Only */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => { setShowCreateUserModal(false); resetCreateUserForm(); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-bold text-gradient-heading mb-4">Create New User</h3>
            
            {!createdCredentials ? (
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newUserData.displayName}
                    onChange={e => setNewUserData({...newUserData, displayName: e.target.value})}
                    placeholder="John Doe"
                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                  <input
                    required
                    type="email"
                    value={newUserData.email}
                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="user@regibiz.com"
                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-orange-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Temporary Password</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={newUserData.password}
                      onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                      placeholder="Enter or generate password"
                      className="flex-1 bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-orange-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={autoFillPassword}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-orange-400 text-xs font-medium transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    * User must change password on first login
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Assign Role</label>
                  <select
                    value={newUserData.role}
                    onChange={e => setNewUserData({...newUserData, role: e.target.value as UserRole})}
                    className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-orange-500 text-sm"
                  >
                    {isSuperAdmin && <option value={UserRole.ADMIN}>Admin</option>}
                    <option value={UserRole.SUPPORT}>Support</option>
                  </select>
                </div>
                
                {createUserError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} /> {createUserError}
                  </p>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowCreateUserModal(false); resetCreateUserForm(); }}
                    className="flex-1 py-2 text-gray-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserLoading}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold rounded-lg py-2 hover:from-teal-400 hover:to-blue-500 text-sm shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createUserLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create User'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-4">User Created Successfully!</h4>
                
                <div className="bg-navy-800 rounded-lg p-4 mb-4 text-left">
                  <p className="text-xs text-gray-400 mb-1">Email:</p>
                  <p className="text-white font-mono text-sm mb-3">{createdCredentials.email}</p>
                  
                  <p className="text-xs text-gray-400 mb-1">Temporary Password:</p>
                  <p className="text-orange-400 font-mono text-sm bg-orange-500/10 px-2 py-1 rounded">{createdCredentials.password}</p>
                </div>
                
                <p className="text-xs text-gray-500 mb-4">
                  Share these credentials with the user.
                </p>
                
                <button
                  onClick={() => { setShowCreateUserModal(false); resetCreateUserForm(); }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-lg py-2 text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
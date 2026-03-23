import React, { useEffect, useState } from 'react';
import { MessageSquare, Users, Star, Check, BadgeCheck, Loader2 } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { mockDbService } from '../services/mockFirebase';

interface ConsultationProps {
  user: UserProfile;
}

const Consultation: React.FC<ConsultationProps> = ({ user }) => {
  const [experts, setExperts] = useState<UserProfile[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdminOrSuper = user.role === UserRole.SUPERADMIN || user.role === UserRole.ADMIN;

  useEffect(() => {
    fetchData();
  }, [user.role]);

  const fetchData = async () => {
    try {
      const allUsers = await mockDbService.getAllUsers();
      
      // Experts visible to everyone
      const expertList = allUsers.filter(u => u.isExpert && u.status === 'active');
      setExperts(expertList);

      // Staff list for Admin/Superadmin to manage
      if (isAdminOrSuper) {
          const potentialExperts = allUsers.filter(u => 
             (u.role === UserRole.ADMIN || u.role === UserRole.SUPPORT || u.role === UserRole.SUPERADMIN) && 
             u.status === 'active'
          );
          setStaff(potentialExperts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpert = async (targetUid: string, currentStatus: boolean) => {
    setActionLoading(targetUid);
    try {
        await mockDbService.toggleExpertStatus(targetUid, !currentStatus);
        // Refresh local state
        const updatedStaff = staff.map(s => s.uid === targetUid ? { ...s, isExpert: !currentStatus } : s);
        setStaff(updatedStaff);
        
        // Re-calculate experts list based on new state
        const updatedExperts = updatedStaff.filter(s => s.isExpert);
        setExperts(updatedExperts);
        
    } catch (e) {
        console.error("Failed to toggle expert", e);
        alert("Action failed.");
    } finally {
        setActionLoading(null);
    }
  };

  if (loading) return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
  );

  return (
    <div className="p-6 md:p-8 animate-fade-in pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gradient-heading">Expert Consultation</h2>
          <p className="text-gray-400 text-sm mt-1">Connect with our compliance specialists.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* --- Public Expert List (Visible to All) --- */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-orange-400" />
                <h3 className="text-lg font-bold text-white">Available Experts</h3>
            </div>
            
            {experts.length === 0 ? (
                <div className="glass-panel p-8 text-center text-gray-500">
                    <Star size={32} className="mx-auto mb-2 opacity-20" />
                    <p>No experts are currently listed. Please check back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {experts.map(expert => (
                        <div key={expert.uid} className="glass-card p-5 rounded-xl flex items-start gap-4 hover:border-orange-500/30 transition-all group">
                             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 p-[1px]">
                                 <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-white font-bold">
                                     {expert.displayName.charAt(0).toUpperCase()}
                                 </div>
                             </div>
                             <div className="flex-1">
                                 <div className="flex items-center gap-2">
                                     <h4 className="font-bold text-white">{expert.displayName}</h4>
                                     <BadgeCheck size={16} className="text-blue-400" fill="currentColor" fillOpacity={0.2} />
                                 </div>
                                 <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">{expert.role}</p>
                                 <button className="text-xs bg-white/5 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                                     Request Call
                                 </button>
                             </div>
                        </div>
                    ))}
                </div>
            )}
         </div>

         {/* --- Admin/Internal Management Section --- */}
         {isAdminOrSuper && (
             <div className="glass-panel rounded-xl p-5 h-fit border border-white/5">
                 <h3 className="text-sm font-bold text-gradient-heading uppercase tracking-wider mb-4 flex items-center gap-2">
                     <BadgeCheck size={16} /> Manage Experts
                 </h3>
                 <p className="text-xs text-gray-400 mb-4">
                     Promote internal staff to be listed as experts for customers.
                 </p>
                 
                 <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                     {staff.map(member => (
                         <div key={member.uid} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                             <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                     member.role === UserRole.SUPERADMIN ? 'bg-purple-500/20 text-purple-400' :
                                     member.role === UserRole.ADMIN ? 'bg-orange-500/20 text-orange-400' :
                                     'bg-blue-500/20 text-blue-400'
                                 }`}>
                                     {member.displayName.charAt(0)}
                                 </div>
                                 <div>
                                     <p className="text-sm font-medium text-white truncate max-w-[100px]">{member.displayName}</p>
                                     <p className="text-[10px] text-gray-500 uppercase">{member.role}</p>
                                 </div>
                             </div>
                             
                             <button 
                               onClick={() => toggleExpert(member.uid, !!member.isExpert)}
                               disabled={actionLoading === member.uid}
                               className={`p-1.5 rounded-lg transition-all ${
                                   member.isExpert 
                                   ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                   : 'bg-gray-700/50 text-gray-500 hover:text-white hover:bg-gray-600'
                               }`}
                               title={member.isExpert ? "Remove Expert Status" : "Enroll as Expert"}
                             >
                                 {actionLoading === member.uid ? <Loader2 size={16} className="animate-spin" /> : (
                                     member.isExpert ? <Check size={16} /> : <Star size={16} />
                                 )}
                             </button>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default Consultation;
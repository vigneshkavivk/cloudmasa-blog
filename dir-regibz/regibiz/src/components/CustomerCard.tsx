import React from 'react';
import { Mail, Phone, Inbox, User } from 'lucide-react';
import { UserProfile } from '../types';

interface CustomerCardProps {
  customer: UserProfile;
  requestCount: number;
  onClick: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    case 'blocked': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
};

const getAvatarColor = (uid: string) => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500'
  ];
  const index = uid.charCodeAt(0) % colors.length;
  return colors[index];
};

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, requestCount, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="glass-card p-5 rounded-xl border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer group hover:-translate-y-0.5 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(customer.uid)} p-[1px] shadow-lg`}>
            <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-lg font-bold text-white">
              {customer.displayName ? customer.displayName.charAt(0).toUpperCase() : <User size={20} />}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-base truncate max-w-[150px]">{customer.displayName || 'Unknown User'}</h4>
            <p className="text-xs font-mono text-gray-500">{customer.userId}</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(customer.status)}`}>
          {customer.status}
        </span>
      </div>

      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          <Mail size={14} className="text-gray-600 group-hover:text-teal-400 transition-colors" />
          <span className="truncate">{customer.email}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          <Phone size={14} className="text-gray-600 group-hover:text-teal-400 transition-colors" />
          <span className="truncate">{customer.phoneNumber || 'No phone number'}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Inbox size={14} className={requestCount > 0 ? "text-teal-400" : "text-gray-600"} />
          <span>{requestCount} requests</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all">
          <span className="text-xs">→</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;
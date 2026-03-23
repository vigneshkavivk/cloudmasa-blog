
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { LogOut, User, Shield, Bell, AlertCircle } from 'lucide-react';

interface AccountDropdownProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenProfile: () => void;
  isProfileIncomplete?: boolean;
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({ user, onLogout, onOpenProfile, isProfileIncomplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 p-[1.5px] shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform relative"
      >
        <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={16} />}
        </div>
        {isProfileIncomplete && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border-2 border-navy-900 rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-navy-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
          <div className="p-4 border-b border-white/10 bg-white/5">
             <p className="text-sm font-bold text-white truncate">{user.displayName || 'User'}</p>
             <p className="text-xs text-gray-400 truncate">{user.email}</p>
             {isProfileIncomplete && (
                 <p className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
                     <AlertCircle size={10} /> Profile Incomplete
                 </p>
             )}
          </div>
          
          <div className="p-2 space-y-1">
            <button 
              onClick={() => { onOpenProfile(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors justify-between"
            >
              <div className="flex items-center gap-3">
                  <User size={16} className="text-teal-500" />
                  <span>Profile</span>
              </div>
              {isProfileIncomplete && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Shield size={16} className="text-teal-500" />
              <span>Security</span>
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Bell size={16} className="text-teal-500" />
              <span>Notifications</span>
            </button>
          </div>

          <div className="p-2 border-t border-white/5">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDropdown;

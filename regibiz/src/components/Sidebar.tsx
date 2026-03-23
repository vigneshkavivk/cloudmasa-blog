import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Briefcase, 
  FileText, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  userRole: UserRole;
  onLogout: () => void;
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userRole, 
  onLogout, 
  isOpen, 
  onClose,
  isCollapsed,
  toggleCollapse
}) => {
  const location = useLocation();

  // Define nav items with allowed roles
  // KEY RULE: Support role does NOT see Services tab
  const navItems = [
    { label: 'Dashboard', path: '/', icon: <Home size={18} />, allowed: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.CUSTOMER] },
    { label: 'Services', path: '/services', icon: <Briefcase size={18} />, allowed: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.CUSTOMER] },
    { label: 'Documents', path: '/documents', icon: <FileText size={18} />, allowed: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.CUSTOMER] },
    { label: 'Schedule', path: '/calendar', icon: <Calendar size={18} />, allowed: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT] }, 
    { label: 'Consultation', path: '/consult', icon: <MessageSquare size={18} />, allowed: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.CUSTOMER] },
    { label: 'User Management', path: '/admin', icon: <ShieldCheck size={18} />, allowed: [UserRole.SUPERADMIN, UserRole.ADMIN] }, 
  ];

  const filteredNavItems = navItems.filter(item => item.allowed.includes(userRole));

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div 
        className={`fixed top-0 left-0 h-full glass-panel border-r border-white/5 flex flex-col z-40 transition-all duration-300 transform 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Brand + Toggle Header */}
        <div className={`h-16 flex items-center border-b border-white/5 bg-navy-950/30 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}>
          <div className={`flex items-center w-full transition-all duration-300 ${isCollapsed ? 'justify-center gap-1' : 'gap-2'}`}>
            {/* Logo Image */}
            <img 
              src="/logo-transparent.png" 
              alt="RegiBIZ" 
              className="w-8 h-8 rounded-lg object-contain shrink-0 z-20"
            />
            
            {/* Logo Text - Hidden when collapsed */}
            {!isCollapsed && (
              <span className="text-xl font-bold text-gradient-heading tracking-tight animate-fade-in whitespace-nowrap overflow-hidden">
                RegiBIZ
              </span>
            )}

            {/* Toggle Button */}
            <button
                onClick={toggleCollapse}
                className={`w-6 h-6 rounded-full bg-navy-800 border border-white/10 items-center justify-center hover:bg-navy-700 hover:text-white transition-all z-20 text-gray-400 hidden md:flex shrink-0 ${isCollapsed ? '' : 'ml-1'}`}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 animate-fade-in">Menu</p>
          )}
          
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose} // Close on mobile when clicked
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                ${isActive(item.path)
                  ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-400 border border-orange-500/20 shadow-sm'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <span className={`shrink-0 ${isActive(item.path) ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {item.icon}
              </span>
              
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && isActive(item.path) && <ChevronRight size={14} className="ml-auto opacity-50" />}

              {/* Tooltip for Collapsed State */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-navy-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 relative">
          <button
            onClick={onLogout}
            className={`flex items-center gap-3 w-full px-2 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm group relative ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
            
            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-navy-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-lg">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
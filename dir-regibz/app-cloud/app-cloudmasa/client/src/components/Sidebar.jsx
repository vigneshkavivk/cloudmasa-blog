// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  ChevronLeft,
  Server,
  Cloud,
  Database,
  Settings,
  Layout,
  Zap,
  BarChart,
  Shield,
  LifeBuoy,
  Bot,
  LogOut,
  Grid,
  Users,
  ChevronDown,
  User,
  Mail,
  LogOut as LogOutIcon,
} from "lucide-react";
import { TbBrain, TbRobot } from "react-icons/tb";
import { Link, Outlet, useLocation } from "react-router-dom";
import CloudMasaLogo from "../assets/roundmasa.webp";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer open
  const [isCollapsed, setIsCollapsed] = useState(true); // DEFAULT: true (Closed)
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const toggleSidebar = () => setIsOpen(!isOpen);
  
  const handleClose = () => setIsCollapsed(true);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.name || "");
        setUserRole(user.role || "User");
        setUserEmail(user.email || "");
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return;
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".sidebar-toggle-button")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const sidebarWidth = isCollapsed ? 64 : 256;

  return (
    <div className="flex h-screen font-sans text-gray-800 dark:text-white bg-gray-900 overflow-hidden">
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden absolute top-4 left-4 z-50 bg-white dark:bg-slate-800 p-2 rounded-md shadow-md sidebar-toggle-button"
      >
        <Menu size={20} className="text-black dark:text-white" />
      </button>

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        onMouseEnter={() => setIsCollapsed(false)} 
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block h-screen bg-[#0f172a] text-white transition-all duration-300 relative overflow-y-auto no-scrollbar`}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex flex-col h-full pt-5 pb-2 px-2 sm:px-1 ">
          
          {/* --- HEADER SECTION --- */}
          <div className="flex items-center justify-between mb-6 md:mb-8 pr-2 relative">
            <div 
              className={`flex items-center gap-3 transition-all duration-300 ${
                isCollapsed ? 'w-12 justify-center' : 'w-auto'
              }`}
              style={{ overflow: 'hidden' }}
            >
              <img
                src={CloudMasaLogo}
                alt="CloudMaSa Logo"
                className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg object-cover flex-shrink-0"
                style={{ minWidth: '48px', minHeight: '48px' }}
              />
              {!isCollapsed && (
                <span className="font-bold tracking-tight text-xl md:text-2xl whitespace-nowrap opacity-100 transition-opacity duration-300">
                  <span className="text-blue-400">Cloud</span>
                  <span className="text-orange-500">MaSa</span>
                </span>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleClose}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 transition-all duration-300 flex items-center justify-center rounded-full hover:bg-slate-800 z-10"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={24} className="text-blue-400" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5 md:gap-2 flex-grow">
            <GradientButtonLink
              to="/sidebar"
              icon={<Layout size={20} />}
              title="Dashboard"
              isActive={location.pathname === "/sidebar"}
              collapsed={isCollapsed}
            />
            <GradientButtonLink
              to="/sidebar/work-space"
              icon={<Grid size={20} />}
              title="Workspace"
              isActive={location.pathname === "/sidebar/work-space"}
              collapsed={isCollapsed}
            />
            <GradientButtonLink
              to="/sidebar/cloud-connector"
              icon={<Cloud size={20} />}
              title="Cloud Connector"
              isActive={location.pathname === "/sidebar/cloud-connector"}
              collapsed={isCollapsed}
            />
            <GradientButtonLink
              to="/sidebar/clusters"
              icon={<Server size={20} />}
              title="Clusters"
              isActive={location.pathname === "/sidebar/clusters"}
              collapsed={isCollapsed}
            />
            <GradientButtonLink
              to="/sidebar/work-flow"
              icon={<BarChart size={20} />}
              title="Work Flow"
              isActive={location.pathname.startsWith("/sidebar/work-flow")}
              collapsed={isCollapsed}
            />
            <GradientButtonLink
              to="/sidebar/scm-connector"
              icon={<Zap size={20} />}
              title="SCM Connector"
              isActive={location.pathname === "/sidebar/scm-connector"}
              collapsed={isCollapsed}
            />
            <GradientButtonLink
              to="/sidebar/toolsUI"
              icon={<Settings size={20} />}
              title="Tools"
              isActive={location.pathname === "/sidebar/toolsUI"}
              collapsed={isCollapsed}
            />
            
            <GradientButtonLink
              to="/sidebar/database"
              icon={<Database size={20} />}
              title="Database"
              isActive={location.pathname === "/sidebar/database"}
              collapsed={isCollapsed}
            />

            {userRole === "super-admin" && (
              <GradientButtonLink
                to="/sidebar/policies"
                icon={<Shield size={20} />}
                title="Policies"
                isActive={location.pathname === "/sidebar/policies"}
                collapsed={isCollapsed}
              />
            )}

           <GradientButtonLink
            to="/sidebar/mcp-bot"
            icon={<TbRobot className="text-base" />}
            title="MaSa Bot"
            isActive={location.pathname === '/sidebar/mcp-bot'}
            collapsed={isCollapsed}
          />
            <GradientButtonLink
                        to="/sidebar/ai-engines"
                        icon={<TbBrain className="text-base" />}
                        title="AI Engines"
                        isActive={location.pathname === '/sidebar/ai-engines'}
                        collapsed={isCollapsed}
                      />

            {userName && (
              <GradientButtonLink
                to="/sidebar/support"
                icon={<Users size={20} />}
                title="Support"
                isActive={location.pathname === "/sidebar/support"}
                collapsed={isCollapsed}
              />
            )}

            {userRole === "support" && (
              <GradientButtonLink
                to="/sidebar/support/dashboard"
                icon={<LifeBuoy size={20} />}
                title="Support Dashboard"
                isActive={location.pathname === "/sidebar/support/dashboard"}
                collapsed={isCollapsed}
              />
            )}
          </nav>

          {/* Profile Section with Dropdown */}
          {!isCollapsed && (
            <div className="mt-auto relative" ref={profileDropdownRef}>
              {/* Profile Button */}
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-700"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {getUserInitials(userName)}
                </div>
                
                {/* User Info */}
                <div className="flex-1 text-left overflow-hidden">
                  <div className="font-semibold text-sm text-white truncate">
                    {userName || "User"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {userEmail || "user@example.com"}
                  </div>
                </div>
                
                {/* Dropdown Arrow */}
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-200 ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {/* User Header in Dropdown */}
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                        {getUserInitials(userName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">
                          {userName || "User"}
                        </div>
                        <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                          <Mail size={12} />
                          {userEmail || "user@example.com"}
                        </div>
                        {userRole && (
                          <div className="text-xs text-blue-400 mt-0.5">
                            {userRole}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Menu Items */}
                  <div className="py-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <LogOutIcon size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collapsed Mode - Simple Logout */}
          {isCollapsed && (
            <div className="mt-auto pt-3 text-center">
              <button
                onClick={handleLogout}
                className="gradient-logout-button w-full py-2.5 text-sm font-bold px-0"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
          
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 h-screen overflow-y-auto bg-gray-900 p-3 sm:p-4 md:p-2 no-scrollbar"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Outlet context={{ username: userName }} />
      </div>

      {/* Global Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }

            .gradient-button {
              position: relative;
              padding: 12px 16px;
              font-size: 15px;
              font-weight: 600;
              color: white;
              background: transparent;
              border: 1px solid transparent;
              cursor: pointer;
              border-radius: 12px;
              overflow: hidden;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              width: 100%;
              text-decoration: none;
              box-sizing: border-box;
              text-align: left;
              gap: 12px;
              z-index: 1;
            }

            .gradient-button:hover {
              background: rgba(255, 255, 255, 0.05);
              border-color: rgba(96, 165, 250, 0.3);
            }

            .gradient-button.active {
              background: rgba(59, 130, 246, 0.1);
              border-color: #3b82f6;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
              color: #fff;
            }

            .gradient-button .gradient-text {
              color: #cbd5e1;
              transition: color 0.3s ease;
            }
            
            .gradient-button:hover .gradient-text,
            .gradient-button.active .gradient-text {
              color: transparent;
              background: linear-gradient(to right, #60a5fa, #2dd4bf, #3b82f6);
              background-clip: text;
              -webkit-background-clip: text;
            }

            .gradient-button.collapsed {
              padding: 14px 0;
              width: 64px;
              height: 64px;
              min-height: 64px;
              justify-content: center;
              border-radius: 12px;
            }
            .gradient-button.collapsed span.gradient-text {
              display: none;
            }
            .gradient-button.collapsed svg {
              width: 24px !important;
              height: 24px !important;
              margin: 0 auto;
            }
            
            .gradient-button.collapsed.active svg {
               filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.8));
            }

            .gradient-logout-button {
              position: relative;
              padding: 12px 20px;
              font-size: 15px;
              font-weight: 600;
              color: #cbd5e1;
              background: transparent;
              border: 1px solid transparent;
              cursor: pointer;
              border-radius: 12px;
              overflow: hidden;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              text-decoration: none;
              box-sizing: border-box;
            }

            .gradient-logout-button:hover {
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.3);
              color: #fff;
            }

            .gradient-logout-button .gradient-text {
              transition: color 0.3s ease;
            }
            
            .gradient-logout-button:hover .gradient-text {
               color: transparent;
               background: linear-gradient(to right, #ef4444, #f59e0b);
               background-clip: text;
               -webkit-background-clip: text;
            }
          `,
        }}
      />
    </div>
  );
};

const GradientButtonLink = ({ to, icon, title, isActive, collapsed }) => {
  const iconWithClass = React.cloneElement(icon, {
    className: "text-white " + (icon.props.className || ""),
  });

  return (
    <Link
      to={to}
      className={`gradient-button ${isActive ? "active" : ""} ${
        collapsed ? "collapsed" : ""
      }`}
    >
      {iconWithClass}
      <span className="gradient-text">{title}</span>
    </Link>
  );
};

export default Sidebar;

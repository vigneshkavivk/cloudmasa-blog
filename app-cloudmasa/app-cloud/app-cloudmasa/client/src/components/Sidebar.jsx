// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Server,
  Cloud,
  Database,
  Settings,
  Layout,
  Zap,
  BarChart,
  Shield,
  LifeBuoy,
  LogOut,
  Grid,
  Users,
  User,
} from "lucide-react";
import { TbRobot } from "react-icons/tb";
import { Link, Outlet, useLocation } from "react-router-dom";
import CloudMasaLogo from "../assets/roundmasa.webp";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const location = useLocation();
  const sidebarRef = useRef(null);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

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
      } catch (err) {
        console.error("Error parsing user from localStorage", err);
      }
    }
  }, []);

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

  const sidebarWidth = isCollapsed ? 64 : 256;

  const getUserInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

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
        className={`${
          isOpen ? "block" : "hidden"
        } lg:block h-screen bg-[#0f172a] text-white transition-all duration-300 relative overflow-y-auto no-scrollbar`}
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="flex flex-col h-full pt-5 pb-4 px-2 sm:px-3">
          {/* Logo & Title */}
          <div className="flex items-center mb-6 md:mb-8 px-1">
            <img
              src={CloudMasaLogo}
              alt="CloudMaSa Logo"
              className="w-12 h-12 rounded-full shadow-lg"
            />
            {!isCollapsed && (
              <span className="font-bold tracking-tight text-2xl md:text-[28px] ml-2">
                <span className="text-blue-400">Cloud</span>
                <span className="text-orange-500">MaSa</span>
              </span>
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

          {/* Professional User Profile & Logout Section */}
          {!isCollapsed && (
            <div className="mt-auto pt-4">
              {/* User Profile Card */}
              {userName && (
                <div className="mb-3 px-2">
                  <div className="user-card flex items-center gap-3 p-3 rounded-xl mb-2">
                    <div className="user-avatar w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg">
                      {getUserInitials(userName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="user-name font-semibold text-sm truncate">
                        {userName}
                      </div>
                      <div className="user-role text-xs truncate opacity-70">
                        {userRole}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button - Professional Style */}
              <div className="px-2">
                <button
                  onClick={handleLogout}
                  className="logout-button w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <LogOut size={18} className="flex-shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {/* Collapsed State - Minimal */}
          {isCollapsed && (
            <div className="mt-auto pb-4 flex flex-col items-center gap-3 px-2">
              {userName && (
                <div 
                  className="user-avatar w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg cursor-pointer"
                  title={`${userName} - ${userRole}`}
                >
                  {getUserInitials(userName)}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="logout-button-collapsed w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          {/* Collapse Button */}
          <button
            onClick={toggleCollapse}
            className="absolute right-0 top-6 z-10 w-6 h-8 shadow-lg text-white transition-colors hover:bg-white/10 rounded"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={22} />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 h-screen overflow-y-auto bg-gray-900 p-3 sm:p-4 md:p-2 no-scrollbar"
        style={{ 
          width: `calc(100% - ${sidebarWidth}px)`, 
          borderLeft: '1px solid rgba(255,255,255,0.08)' 
        }}
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

            /* User Card Styling */
            .user-card {
              background: rgba(59, 130, 246, 0.1);
              border: 1px solid rgba(59, 130, 246, 0.2);
              transition: all 0.3s ease;
            }

            .user-card:hover {
              background: rgba(59, 130, 246, 0.15);
              border-color: rgba(59, 130, 246, 0.4);
              transform: translateY(-1px);
            }

            /* User Avatar - Using App's Blue Gradient */
            .user-avatar {
              background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            }

            /* User Name - Blue Gradient Text */
            .user-name {
              background: linear-gradient(to right, #60a5fa, #2dd4bf);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }

            /* User Role - Subtle Gray */
            .user-role {
              color: #94a3b8;
            }

            /* Logout Button - Professional Dark Style */
            .logout-button {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #e2e8f0;
              transition: all 0.2s ease;
            }

            .logout-button:hover {
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.3);
              color: #ef4444;
              transform: translateX(2px);
            }

            .logout-button svg {
              color: #94a3b8;
              transition: color 0.2s ease;
            }

            .logout-button:hover svg {
              color: #ef4444;
            }

            /* Collapsed Logout Button */
            .logout-button-collapsed {
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #94a3b8;
              transition: all 0.2s ease;
            }

            .logout-button-collapsed:hover {
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.3);
              color: #ef4444;
            }

            /* Navigation Buttons */
            .gradient-button {
              position: relative;
              padding: 12px 16px;
              font-size: 15px;
              font-weight: 600;
              color: white;
              background: transparent;
              border: none;
              cursor: pointer;
              border-radius: 50px;
              overflow: hidden;
              transition: transform 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              width: 100%;
              text-decoration: none;
              box-sizing: border-box;
              text-align: left;
              gap: 12px;
            }

            .gradient-button:hover { transform: scale(1.02); }

            .gradient-button::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(to right, #60a5fa, #2dd4bf, #3b82f6);
              z-index: -2;
              filter: blur(8px);
              transition: transform 1.5s ease-in-out;
            }

            .gradient-button:hover::before { transform: scale(1.05); }

            .gradient-button::after {
              content: "";
              position: absolute;
              inset: 2px;
              background: #0f172a;
              border-radius: 48px;
              z-index: -1;
            }

            .gradient-button .gradient-text {
              color: transparent;
              background: linear-gradient(to right, #60a5fa, #2dd4bf, #3b82f6);
              background-clip: text;
              -webkit-background-clip: text;
            }

            .gradient-button:hover .gradient-text {
              animation: hue-rotating 2s linear infinite;
            }

            .gradient-button:active { transform: scale(0.99); }

            .gradient-button.active {
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
              transform: scale(1.03);
              border: 2px solid rgba(59, 130, 246, 0.4);
            }

            .gradient-button.collapsed {
              padding: 10px 0;
              width: 64px;
              height: 56px;
              min-height: 56px;
              justify-content: center;
              border-radius: 0;
            }
            .gradient-button.collapsed span.gradient-text {
              display: none;
            }
            .gradient-button.collapsed svg {
              width: 20px !important;
              height: 20px !important;
              margin: 0 auto;
            }

            @keyframes hue-rotating {
              to { filter: hue-rotate(360deg); }
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

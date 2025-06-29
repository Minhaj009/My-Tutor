import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Get current page from URL
  const currentPath = window.location.pathname;

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsedState));
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default to dark mode
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentPath]);

  const navigationItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: "📊",
      active: currentPath === "/dashboard"
    },
    { 
      name: "AI Tutor", 
      href: "/dashboard/ai-tutor", 
      icon: "🤖",
      active: currentPath === "/dashboard/ai-tutor"
    },
    { 
      name: "Progress", 
      href: "/dashboard/progress", 
      icon: "📈",
      active: currentPath === "/dashboard/progress"
    },
    { 
      name: "Study Materials", 
      href: "/dashboard/materials", 
      icon: "📚",
      active: currentPath === "/dashboard/materials"
    },
    { 
      name: "Tests & Quizzes", 
      href: "/dashboard/tests", 
      icon: "📝",
      active: currentPath === "/dashboard/tests"
    }
  ];

  // Settings menu items
  const settingsMenuItems = [
    {
      name: "Profile Information",
      href: "/dashboard/settings/profile",
      icon: "👤",
      description: "Edit your personal details and profile picture",
      active: currentPath === "/dashboard/settings/profile"
    },
    {
      name: "Plan & Billing",
      href: "/dashboard/settings/billing",
      icon: "💳",
      description: "Manage subscription and billing details",
      active: currentPath === "/dashboard/settings/billing"
    },
    {
      name: "Notifications",
      href: "/dashboard/settings/notifications",
      icon: "🔔",
      description: "Configure your notification preferences",
      active: currentPath === "/dashboard/settings/notifications"
    },
    {
      name: "Account Actions",
      href: "/dashboard/settings/account",
      icon: "⚙️",
      description: "Security settings and account management",
      active: currentPath === "/dashboard/settings/account"
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Get page title based on current path
  const getPageTitle = () => {
    const item = navigationItems.find(item => item.active);
    if (currentPath.startsWith("/dashboard/settings")) {
      if (currentPath === "/dashboard/settings/profile") return "Profile Information";
      if (currentPath === "/dashboard/settings/billing") return "Plan & Billing";
      if (currentPath === "/dashboard/settings/notifications") return "Notifications";
      if (currentPath === "/dashboard/settings/account") return "Account Actions";
      return "Settings";
    }
    return item ? item.name : "Dashboard";
  };

  // Close dropdown when clicking outside
  const handleDropdownToggle = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  // Handle navigation click - don't expand sidebar
  const handleNavigationClick = (href: string) => {
    // Navigate to the page without changing sidebar state
    window.location.href = href;
  };

  // Handle sidebar collapse toggle
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Calculate sidebar width based on state
  const getSidebarWidth = () => {
    if (isMobile) return 'w-64'; // Always full width on mobile
    return sidebarCollapsed ? 'w-16' : 'w-64';
  };

  // Check if we're on a settings page
  const isSettingsPage = currentPath.startsWith("/dashboard/settings");

  return (
    <div className="min-h-screen theme-bg-primary flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        inset-y-0 left-0 z-50 
        ${getSidebarWidth()} 
        theme-bg-secondary theme-border border-r 
        transform transition-all duration-300 ease-in-out
        ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        flex flex-col
      `}>
        
        {/* Logo and Collapse Button */}
        <div className="flex items-center justify-between px-4 py-4 theme-border border-b min-h-[73px]">
          {/* Logo */}
          <div 
            className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${
              !isMobile && sidebarCollapsed ? 'opacity-0 pointer-events-none w-0 overflow-hidden' : 'opacity-100 w-auto'
            }`}
            onClick={() => window.location.href = '/'}
          >
            <div className="w-6 h-6 bg-[#3f8cbf] rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <h1 className="[font-family:'Lexend',Helvetica] font-bold theme-text-primary text-lg whitespace-nowrap">
              MyEduPro
            </h1>
          </div>
          
          {/* Collapse Button - Only show on desktop */}
          {!isMobile && (
            <button
              onClick={handleSidebarToggle}
              className="flex items-center justify-center w-8 h-8 theme-text-secondary hover:theme-text-primary hover:theme-bg-tertiary rounded-lg transition-colors flex-shrink-0"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="text-lg">
                {sidebarCollapsed ? '→' : '←'}
              </span>
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center w-8 h-8 theme-text-secondary hover:theme-text-primary hover:theme-bg-tertiary rounded-lg transition-colors"
            >
              <span className="text-lg">✕</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => handleNavigationClick(item.href)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-[#3f8cbf] text-white'
                      : 'theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
                  } ${!isMobile && sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
                  title={!isMobile && sidebarCollapsed ? item.name : undefined}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span className={`[font-family:'Lexend',Helvetica] font-medium text-sm transition-all duration-300 ${
                    !isMobile && sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                  }`}>
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section: Settings, User Profile, and Sign Out */}
        <div className="theme-border border-t">
          {/* Settings */}
          <div className="px-4 py-2">
            <button
              onClick={() => handleNavigationClick('/dashboard/settings')}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                currentPath.startsWith("/dashboard/settings")
                  ? 'bg-[#3f8cbf] text-white'
                  : 'theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
              } ${!isMobile && sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
              title={!isMobile && sidebarCollapsed ? 'Settings' : undefined}
            >
              <span className="text-lg flex-shrink-0">⚙️</span>
              <span className={`[font-family:'Lexend',Helvetica] font-medium text-sm transition-all duration-300 ${
                !isMobile && sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
              }`}>
                Settings
              </span>
            </button>
          </div>

          {/* User Profile */}
          <div className={`px-4 py-4 theme-border border-t transition-all duration-300`}>
            <div className={`flex items-center ${!isMobile && sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 bg-[#3f8cbf] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile?.profile_picture_url ? (
                  <img 
                    src={profile.profile_picture_url} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm [font-family:'Lexend',Helvetica]">
                    {profile?.first_name?.[0] || 'U'}{profile?.last_name?.[0] || ''}
                  </span>
                )}
              </div>
              <div className={`flex-1 min-w-0 transition-all duration-300 ${
                !isMobile && sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
              }`}>
                <p className="theme-text-primary font-medium text-sm [font-family:'Lexend',Helvetica] truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="theme-text-muted text-xs [font-family:'Lexend',Helvetica] truncate">
                  {profile?.grade || 'Complete your profile'}
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="p-4">
            <Button
              onClick={handleSignOut}
              className={`w-full bg-transparent theme-border border theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary rounded-lg [font-family:'Lexend',Helvetica] font-medium text-sm transition-all duration-300 flex items-center ${
                !isMobile && sidebarCollapsed ? 'px-2 justify-center' : 'px-4 justify-center gap-2'
              }`}
              title={!isMobile && sidebarCollapsed ? 'Sign Out' : undefined}
            >
              <span className={`w-4 h-4 flex items-center justify-center ${!isMobile && sidebarCollapsed ? 'text-base' : 'text-sm'}`}>
                🚪
              </span>
              <span className={`transition-all duration-300 ${
                !isMobile && sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
              }`}>
                Sign Out
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="theme-bg-secondary theme-border border-b px-4 lg:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 theme-text-primary hover:theme-bg-tertiary rounded-lg transition-colors"
            >
              <div className="space-y-1">
                <span className="block w-5 h-0.5 theme-text-primary"></span>
                <span className="block w-5 h-0.5 theme-text-primary"></span>
                <span className="block w-5 h-0.5 theme-text-primary"></span>
              </div>
            </button>

            {/* Page Title */}
            <div className="flex items-center gap-4">
              <h1 className="[font-family:'Lexend',Helvetica] font-bold theme-text-primary text-xl lg:text-2xl truncate">
                {getPageTitle()}
              </h1>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={handleThemeToggle}
                className="w-8 h-8 flex items-center justify-center theme-text-secondary hover:theme-text-primary hover:theme-bg-tertiary rounded-lg transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="text-lg">
                  {isDarkMode ? '☀️' : '🌙'}
                </span>
              </button>

              <Button 
                className="hidden sm:flex bg-[#3f8cbf] hover:bg-[#2d6a94] text-white rounded-lg px-4 py-2 [font-family:'Lexend',Helvetica] font-medium text-sm whitespace-nowrap"
                onClick={() => window.location.href = '/dashboard/ai-tutor'}
              >
                Ask AI Tutor
              </Button>
              
              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={handleDropdownToggle}
                  className="w-8 h-8 bg-[#3f8cbf] rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-[#3f8cbf] hover:ring-opacity-50 transition-all flex-shrink-0"
                >
                  {profile?.profile_picture_url ? (
                    <img 
                      src={profile.profile_picture_url} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {profile?.first_name?.[0] || 'U'}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 theme-bg-secondary theme-border border rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {/* User Info */}
                      <div className="px-4 py-2 theme-border border-b">
                        <p className="theme-text-primary font-medium text-sm [font-family:'Lexend',Helvetica] truncate">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="theme-text-muted text-xs [font-family:'Lexend',Helvetica] truncate">
                          {user?.email}
                        </p>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleNavigationClick('/dashboard/settings');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary transition-colors [font-family:'Lexend',Helvetica] text-sm text-left"
                        >
                          <span className="text-base">⚙️</span>
                          Settings
                        </button>
                        
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary transition-colors [font-family:'Lexend',Helvetica] text-sm text-left"
                        >
                          <span className="text-base">🚪</span>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings Menu - Only show on settings pages */}
          {isSettingsPage && (
            <div className="mt-4 theme-border border-t pt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {settingsMenuItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigationClick(item.href)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      item.active
                        ? 'bg-[#3f8cbf] text-white'
                        : 'theme-bg-primary theme-border border theme-text-secondary hover:theme-bg-tertiary hover:theme-text-primary'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="[font-family:'Lexend',Helvetica] font-medium text-sm">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
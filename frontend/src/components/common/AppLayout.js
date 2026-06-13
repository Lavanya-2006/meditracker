import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../utils/helpers';
import toast from 'react-hot-toast';

const doctorNav = [
  { path: '/doctor/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/doctor/patients', label: 'My Patients', icon: '👥' },
  { path: '/doctor/medicines', label: 'Medicines', icon: '💊' },
  { path: '/doctor/profile', label: 'Profile', icon: '👤' }
];

const patientNav = [
  { path: '/patient/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/patient/medicines', label: 'My Medicines', icon: '💊' },
  { path: '/patient/reminders', label: 'Reminders', icon: '🔔' },
  { path: '/patient/adherence', label: 'Adherence', icon: '📈' },
  { path: '/patient/profile', label: 'Profile', icon: '👤' }
];

const AppLayout = () => {
  const { user, logout, updateTheme } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = user?.preferences?.theme === 'dark';

  const navItems = user?.role === 'doctor' ? doctorNav : patientNav;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleTheme = () => {
    updateTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏥</div>
          <div className="sidebar-logo-text">
            <h1>MediTracker</h1>
            <span>{user?.role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate(user?.role === 'doctor' ? '/doctor/profile' : '/patient/profile')}>
            <div className="avatar">
              {user?.profileImage
                ? <img src={user.profileImage} alt="avatar" />
                : getInitials(user?.firstName, user?.lastName)
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Navbar */}
        <nav className="navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              ☰
            </button>
            <style>{`@media(max-width:768px){#mobile-menu-btn{display:flex!important}}`}</style>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme Toggle */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ fontSize: 18 }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* User Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar sm">
                {user?.profileImage
                  ? <img src={user.profileImage} alt="avatar" />
                  : getInitials(user?.firstName, user?.lastName)
                }
              </div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Dr. {user?.lastName || user?.firstName}
              </span>
            </div>

            {/* Logout */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </nav>

        {/* Page */}
        <main className="page-content animate-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

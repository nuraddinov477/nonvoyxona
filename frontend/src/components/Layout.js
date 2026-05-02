import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdShoppingCart, MdStorefront,
  MdAccountBalance, MdLogout, MdPeople, MdChevronRight,
} from 'react-icons/md';

const menuItems = [
  { path: '/', label: 'Boshqaruv', icon: MdDashboard, color: 'text-emerald-400' },
  { path: '/trade', label: 'Savdo', icon: MdShoppingCart, color: 'text-blue-400' },
  { path: '/points', label: 'Nuqtalar', icon: MdStorefront, color: 'text-yellow-400' },
  { path: '/accounting', label: 'Moliya', icon: MdAccountBalance, color: 'text-purple-400' },
  { path: '/hr', label: 'Xodimlar (HR)', icon: MdPeople, color: 'text-pink-400' },
];

function UserAvatar({ user, size = 'md' }) {
  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-bread-400 to-bread-600 flex items-center justify-center font-bold text-white shadow-md flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white transition-all duration-300 flex flex-col flex-shrink-0 shadow-xl`}>

        {/* Brand */}
        <div className={`flex items-center border-b border-gray-700/60 ${sidebarOpen ? 'px-4 py-4 gap-3' : 'px-3 py-4 justify-center'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-bread-500 to-bread-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white font-black text-base">N</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-white leading-tight">Nonvoyxona</h1>
              <p className="text-xs text-gray-400">ERP tizimi</p>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-full ml-2 top-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full p-1 shadow-lg border border-gray-600 transition-colors z-10"
          style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
        >
          <MdChevronRight size={16} />
        </button>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all relative ${
                  isActive
                    ? 'bg-bread-600/90 text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-bread-400 rounded-r-full" />
                )}
                <item.icon size={20} className={isActive ? 'text-white' : item.color} />
                {sidebarOpen && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {!sidebarOpen && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-lg border border-gray-600 z-50 transition-opacity">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-700/60 p-3">
          <div className={`flex items-center gap-3 mb-2 ${!sidebarOpen && 'justify-center'}`}>
            <UserAvatar user={user} />
            {sidebarOpen && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.role_display}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? "Chiqish" : undefined}
            className={`flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors text-sm ${!sidebarOpen && 'justify-center'}`}
          >
            <MdLogout size={18} />
            {sidebarOpen && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top header bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            {menuItems.find(m =>
              m.path === location.pathname ||
              (m.path !== '/' && location.pathname.startsWith(m.path))
            )?.icon && (() => {
              const active = menuItems.find(m =>
                m.path === location.pathname ||
                (m.path !== '/' && location.pathname.startsWith(m.path))
              );
              return active ? (
                <div className="flex items-center gap-2">
                  <active.icon size={20} className={active.color} />
                  <span className="font-semibold text-gray-700">{active.label}</span>
                </div>
              ) : null;
            })()}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <UserAvatar user={user} size="sm" />
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

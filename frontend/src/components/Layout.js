import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdShoppingCart, MdStorefront,
  MdAccountBalance, MdMenu, MdClose, MdLogout, MdPerson, MdPeople
} from 'react-icons/md';

const menuItems = [
  { path: '/', label: 'Boshqaruv', icon: MdDashboard },
  { path: '/trade', label: 'Savdo', icon: MdShoppingCart },
  { path: '/points', label: 'Nuqtalar', icon: MdStorefront },
  { path: '/accounting', label: 'Moliya', icon: MdAccountBalance },
  { path: '/hr', label: 'Xodimlar (HR)', icon: MdPeople },
];

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-bread-800 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-bread-700">
          {sidebarOpen && <h1 className="text-xl font-bold">Nonvoyxona</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-bread-700 rounded">
            {sidebarOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
          </button>
        </div>
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive ? 'bg-bread-600 text-white' : 'text-bread-200 hover:bg-bread-700'
                }`}
              >
                <item.icon size={22} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-bread-700">
          <div className="flex items-center gap-3 mb-3">
            <MdPerson size={22} />
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-bread-300">{user?.role_display}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-bread-200 hover:bg-bread-700 rounded-lg">
            <MdLogout size={20} />
            {sidebarOpen && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

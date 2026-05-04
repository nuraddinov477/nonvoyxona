import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenuForRole } from '../components/Layout';
import toast from 'react-hot-toast';
import { MdLock, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(username, password);
      toast.success('Tizimga xush kelibsiz!');
      const menu = getMenuForRole(data.user?.role);
      navigate(menu[0]?.path || '/');
    } catch {
      toast.error("Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-bread-700 via-bread-600 to-bread-800 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
                top: `${10 + i * 12}%`, left: `${-10 + i * 15}%`,
                opacity: 0.3 - i * 0.04,
              }}
            />
          ))}
        </div>
        <div className="relative text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30">
            <span className="text-5xl">🍞</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-3">Nonvoyxona</h2>
          <p className="text-bread-200 text-lg">ERP Boshqaruv Tizimi</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: '📦', text: 'Ishlab chiqarish' },
              { icon: '💰', text: 'Moliyaviy hisobot' },
              { icon: '🏪', text: 'Sotuv nuqtalari' },
              { icon: '👥', text: "Xodimlar boshqaruvi" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3 border border-white/20">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-white text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-bread-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-3xl">🍞</span>
            </div>
            <h1 className="text-2xl font-bold text-bread-800">Nonvoyxona</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-800">Xush kelibsiz!</h2>
              <p className="text-gray-500 mt-1 text-sm">Davom etish uchun tizimga kiring</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Login</label>
                <div className="relative">
                  <MdPerson size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bread-400 focus:border-bread-400 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="Loginni kiriting" required autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parol</label>
                <div className="relative">
                  <MdLock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bread-400 focus:border-bread-400 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="Parolni kiriting" required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-bread-600 hover:bg-bread-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-60 shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kirish...
                  </>
                ) : 'Kirish'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Nonvoyxona ERP &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

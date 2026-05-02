import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MdAdd, MdDelete, MdReceipt, MdPeople, MdAttachMoney,
  MdClose, MdEdit, MdSave, MdSettings,
} from 'react-icons/md';
import { formatMoney, todayStr, currentMonth, getErrorMessage } from '../../utils/helpers';

// ─────────────────────────────────────────
// MAHSULOTLAR
// ─────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '' });
  const [editForm, setEditForm] = useState({ name: '', price: '' });

  const load = useCallback(() => {
    api.get('/production/products/').then(r => setProducts(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/products/', form);
      toast.success("Mahsulot qo'shildi");
      setShowAdd(false);
      setForm({ name: '', price: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleEdit = async (id) => {
    try {
      await api.patch('/production/products/' + id + '/', editForm);
      toast.success('Saqlandi');
      setEditId(null);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`"${p.name}" mahsulotini o'chirishni xohlaysizmi?`)) return;
    try {
      await api.delete('/production/products/' + p.id + '/');
      toast.success("O'chirildi");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Mahsulotlar</h2>
          <p className="text-sm text-gray-500 mt-0.5">Sotuv uchun mahsulotlarni boshqaring</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setForm({ name: '', price: '' }); }}
          className="flex items-center gap-2 bg-bread-600 hover:bg-bread-700 text-white px-4 py-2 rounded-lg transition-colors">
          <MdAdd size={20} /> Mahsulot qo'shish
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd}
          className="bg-bread-50 border border-bread-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Mahsulot nomi *</label>
            <input placeholder="Masalan: Non, Somsa..." value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-bread-400 outline-none" required />
          </div>
          <div className="w-48">
            <label className="text-xs font-semibold text-gray-600 block mb-1">Sotuv narxi (so'm) *</label>
            <input type="number" placeholder="Masalan: 3500" value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-bread-400 outline-none" required />
          </div>
          <div className="flex gap-2">
            <button type="submit"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-5 py-2 font-medium transition-colors">
              Saqlash
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 transition-colors">
              Bekor
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nomi</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Narxi</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ombor</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-sm">{i + 1}</td>
                <td className="px-4 py-3">
                  {editId === p.id ? (
                    <input value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="border rounded-lg px-2 py-1 text-sm w-full focus:ring-2 focus:ring-bread-400 outline-none" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-bread-100 rounded-lg flex items-center justify-center">
                        <MdReceipt className="text-bread-600" size={16} />
                      </div>
                      <span className="font-medium text-gray-800">{p.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editId === p.id ? (
                    <input type="number" value={editForm.price}
                      onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                      className="border rounded-lg px-2 py-1 text-sm w-28 text-right focus:ring-2 focus:ring-bread-400 outline-none" />
                  ) : (
                    <span className="font-semibold text-bread-700">{formatMoney(p.price)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium ${(p.stock_quantity || 0) < 20 ? 'text-red-600' : 'text-green-600'}`}>
                    {p.stock_quantity || 0} dona
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {editId === p.id ? (
                      <>
                        <button onClick={() => handleEdit(p.id)}
                          className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors" title="Saqlash">
                          <MdSave size={16} />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors" title="Bekor">
                          <MdClose size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditId(p.id); setEditForm({ name: p.name, price: p.price }); }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Tahrirlash">
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="O'chirish">
                          <MdDelete size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MdReceipt size={40} className="mx-auto mb-2 opacity-30" />
            <p>Mahsulotlar yo'q</p>
            <p className="text-sm">"Mahsulot qo'shish" tugmasini bosing</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// XODIMLAR
// ─────────────────────────────────────────
function EmployeesTab() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', phone: '',
    role: 'baker', position: '', hire_date: todayStr(),
    fixed_salary: 0, address: '', password: 'pass123',
  });

  const EMPTY_FORM = {
    username: '', first_name: '', last_name: '', phone: '',
    role: 'baker', position: '', hire_date: todayStr(),
    fixed_salary: 0, address: '', password: 'pass123',
  };

  const STATUS = {
    active:    { label: 'Aktiv',        color: 'bg-green-100 text-green-700' },
    vacation:  { label: 'Tatilda',      color: 'bg-blue-100 text-blue-700' },
    sick:      { label: 'Kasal',        color: 'bg-yellow-100 text-yellow-700' },
    dismissed: { label: 'Ishdan ketgan', color: 'bg-red-100 text-red-700' },
  };

  const load = useCallback(() => {
    api.get('/hr/employees/').then(r => setEmployees(r.data.results || r.data)).catch(() => {});
    api.get('/hr/positions/').then(r => setPositions(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/employees/', form);
      toast.success("Xodim qo'shildi");
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(err.response?.data?.username?.[0] || getErrorMessage(err));
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`"${emp.full_name}" xodimini o'chirishni xohlaysizmi?`)) return;
    try {
      await api.delete('/hr/employees/' + emp.id + '/');
      toast.success("Xodim o'chirildi");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleStatusChange = async (emp, newStatus) => {
    try {
      await api.patch('/hr/employees/' + emp.id + '/', { status: newStatus });
      toast.success('Holat yangilandi');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const filtered = filter ? employees.filter(e => e.status === filter) : employees;

  return (
    <div>
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Xodimlar bazasi</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Jami: {employees.length} xodim · Aktiv: {employees.filter(e => e.status === 'active').length}
          </p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-bread-400 outline-none">
            <option value="">Barchasi</option>
            <option value="active">✅ Aktiv</option>
            <option value="vacation">🏖 Tatilda</option>
            <option value="sick">🤒 Kasal</option>
            <option value="dismissed">❌ Ishdan ketgan</option>
          </select>
          <button onClick={() => { setShowAdd(!showAdd); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-bread-600 hover:bg-bread-700 text-white px-4 py-2 rounded-lg transition-colors">
            <MdAdd size={20} /> Xodim qo'shish
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd}
          className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MdPeople className="text-blue-600" /> Yangi xodim ma'lumotlari
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Login (username) *</label>
              <input placeholder="login123" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Ism *</label>
              <input placeholder="Ism" value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Familiya</label>
              <input placeholder="Familiya" value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Telefon</label>
              <input placeholder="+998 90 123 45 67" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Lavozim</label>
              <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none">
                <option value="">Lavozim tanlang</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Rol *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none">
                <option value="baker">Novvoy</option>
                <option value="seller">Sotuvchi</option>
                <option value="point_seller">Nuqta sotuvchisi</option>
                <option value="manager">Menejer</option>
                <option value="accountant">Hisobchi</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Ishga kirgan sana</label>
              <input type="date" value={form.hire_date}
                onChange={e => setForm({ ...form, hire_date: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Fiksirlangan oylik (so'm)</label>
              <input type="number" placeholder="0" value={form.fixed_salary}
                onChange={e => setForm({ ...form, fixed_salary: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Parol</label>
              <input placeholder="pass123" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Manzil</label>
              <input placeholder="Xodim manzili" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit"
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-2 font-medium transition-colors">
              Saqlash
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 transition-colors">
              Bekor
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => {
          const st = STATUS[emp.status] || STATUS.active;
          const initials = ((emp.first_name || emp.username || '?')[0]).toUpperCase();
          return (
            <div key={emp.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 leading-tight">{emp.full_name}</h3>
                    <p className="text-xs text-gray-500">{emp.position_name || emp.role_display}</p>
                  </div>
                </div>
                <select value={emp.status}
                  onChange={e => handleStatusChange(emp, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${st.color}`}>
                  <option value="active">✅ Aktiv</option>
                  <option value="vacation">🏖 Tatilda</option>
                  <option value="sick">🤒 Kasal</option>
                  <option value="dismissed">❌ Ketgan</option>
                </select>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                {emp.phone && <p>📞 {emp.phone}</p>}
                <p>📅 Kiritilgan: {emp.hire_date}</p>
                {parseFloat(emp.fixed_salary) > 0 && (
                  <p className="font-semibold text-bread-700">💰 {formatMoney(emp.fixed_salary)}/oy</p>
                )}
              </div>

              <button onClick={() => handleDelete(emp)}
                className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-100">
                <MdDelete size={14} /> O'chirish
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MdPeople size={40} className="mx-auto mb-2 opacity-30" />
          <p>Xodimlar yo'q</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// BONUS / SHTRAF
// ─────────────────────────────────────────
function BonusTab() {
  const [bonuses, setBonuses] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('bonus');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employee: '', amount: '', reason: '', month: currentMonth() });

  const load = useCallback(() => {
    api.get('/hr/bonuses/').then(r => setBonuses(r.data.results || r.data)).catch(() => {});
    api.get('/hr/penalties/').then(r => setPenalties(r.data.results || r.data)).catch(() => {});
    api.get('/hr/employees/?status=active').then(r => setEmployees(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const url = activeTab === 'bonus' ? '/hr/bonuses/' : '/hr/penalties/';
      await api.post(url, form);
      toast.success(activeTab === 'bonus' ? "Mukofot qo'shildi" : "Shtraf qo'shildi");
      setShowAdd(false);
      setForm({ employee: '', amount: '', reason: '', month: currentMonth() });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("O'chirishni xohlaysizmi?")) return;
    try {
      const url = type === 'bonus' ? '/hr/bonuses/' : '/hr/penalties/';
      await api.delete(url + id + '/');
      toast.success("O'chirildi");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const items = activeTab === 'bonus' ? bonuses : penalties;
  const total = items.reduce((s, x) => s + parseFloat(x.amount), 0);
  const isBonus = activeTab === 'bonus';

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Mukofot va Shtraflar</h2>
          <p className="text-sm text-gray-500 mt-0.5">Xodimlar uchun bonus va jarima boshqaruvi</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setForm({ employee: '', amount: '', reason: '', month: currentMonth() }); }}
          className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors ${isBonus ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
          <MdAdd size={20} /> {isBonus ? 'Mukofot qo\'shish' : 'Shtraf qo\'shish'}
        </button>
      </div>

      {/* Tablar */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => { setActiveTab('bonus'); setShowAdd(false); }}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${isBonus ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
          🎁 Mukofotlar
          <span className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{bonuses.length}</span>
        </button>
        <button onClick={() => { setActiveTab('penalty'); setShowAdd(false); }}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${!isBonus ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}>
          ⚠️ Shtraflar
          <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{penalties.length}</span>
        </button>
      </div>

      {/* Umumiy summa */}
      <div className={`p-4 rounded-xl mb-5 flex items-center justify-between ${isBonus ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div>
          <p className="text-sm text-gray-600">{isBonus ? '🎁 Jami mukofotlar' : '⚠️ Jami shtraflar'}</p>
          <p className={`text-2xl font-bold ${isBonus ? 'text-green-700' : 'text-red-700'}`}>{formatMoney(total)}</p>
        </div>
        <MdAttachMoney size={40} className={`opacity-20 ${isBonus ? 'text-green-700' : 'text-red-700'}`} />
      </div>

      {/* Form */}
      {showAdd && (
        <form onSubmit={handleAdd}
          className={`rounded-xl border p-4 mb-5 ${isBonus ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Xodim *</label>
              <select value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 outline-none" required>
                <option value="">Xodim tanlang</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Summa (so'm) *</label>
              <input type="number" placeholder="0" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 outline-none" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Oy</label>
              <input type="month" value={form.month}
                onChange={e => setForm({ ...form, month: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Sabab *</label>
              <input placeholder="Sabab kiriting..." value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                className="border rounded-lg px-3 py-2 w-full focus:ring-2 outline-none" required />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit"
              className={`text-white rounded-lg px-6 py-2 font-medium transition-colors ${isBonus ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
              Saqlash
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 transition-colors">
              Bekor
            </button>
          </div>
        </form>
      )}

      {/* Jadval */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sana</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Xodim</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sabab</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Oy</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Summa</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(it => (
              <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-600">{it.date}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{it.employee_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{it.reason}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{it.month}</td>
                <td className={`px-4 py-3 text-right font-semibold ${isBonus ? 'text-green-700' : 'text-red-700'}`}>
                  {isBonus ? '+' : '-'}{formatMoney(it.amount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(it.id, activeTab)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors" title="O'chirish">
                    <MdDelete size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <MdAttachMoney size={40} className="mx-auto mb-2 opacity-30" />
            <p>{isBonus ? 'Mukofotlar' : 'Shtraflar'} yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// ASOSIY KOMPONENT
// ─────────────────────────────────────────
export default function Setup() {
  const [tab, setTab] = useState('products');

  const tabs = [
    { id: 'products',   label: 'Mahsulotlar',    icon: MdReceipt,     color: 'text-bread-600' },
    { id: 'employees',  label: 'Xodimlar',        icon: MdPeople,      color: 'text-purple-600' },
    { id: 'bonus',      label: 'Bonus / Shtraf',  icon: MdAttachMoney, color: 'text-green-600' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <MdSettings size={22} className="text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ma'lumotlar boshqaruvi</h1>
          <p className="text-sm text-gray-500">Mahsulotlar, xodimlar va bonuslarni bir joyda boshqaring</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={18} className={tab === t.id ? t.color : ''} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products'  && <ProductsTab />}
      {tab === 'employees' && <EmployeesTab />}
      {tab === 'bonus'     && <BonusTab />}
    </div>
  );
}

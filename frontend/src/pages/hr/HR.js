import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MdPeople, MdAccessTime, MdAttachMoney, MdPayment, MdCalculate,
  MdAdd, MdClose, MdCheck, MdSick, MdBeachAccess, MdCancel, MdLogin,
  MdSearch, MdFileDownload
} from 'react-icons/md';

import { formatMoney, todayStr, currentMonth, getErrorMessage } from '../../utils/helpers';
import { downloadExcel } from '../../utils/exports';

const STATUS_LABELS = {
  active: { label: '✅ Aktiv', color: 'bg-green-100 text-green-700' },
  vacation: { label: '🏖 Tatilda', color: 'bg-blue-100 text-blue-700' },
  sick: { label: '🤒 Kasal', color: 'bg-yellow-100 text-yellow-700' },
  dismissed: { label: '❌ Ishdan ketgan', color: 'bg-red-100 text-red-700' },
};

const ATT_STATUS = {
  present: { label: 'Keldi', color: 'bg-green-100 text-green-700', icon: MdCheck },
  absent: { label: 'Kelmadi', color: 'bg-red-100 text-red-700', icon: MdCancel },
  late: { label: 'Kech qoldi', color: 'bg-yellow-100 text-yellow-700', icon: MdAccessTime },
  sick: { label: 'Kasal', color: 'bg-orange-100 text-orange-700', icon: MdSick },
  vacation: { label: "Ta'til", color: 'bg-blue-100 text-blue-700', icon: MdBeachAccess },
};

// === Xodimlar tab ===
function Employees() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    username: '', first_name: '', last_name: '', phone: '',
    role: 'baker', position: '', hire_date: todayStr(),
    fixed_salary: 0, address: '', password: 'pass123',
  });

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
      setForm({
        username: '', first_name: '', last_name: '', phone: '',
        role: 'baker', position: '', hire_date: todayStr(),
        fixed_salary: 0, address: '', password: 'pass123',
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.username?.[0] || 'Xatolik');
    }
  };

  const [search, setSearch] = useState('');
  const filtered = employees.filter(e => {
    if (filter && e.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = ((e.user?.first_name || '') + ' ' + (e.user?.last_name || '')).toLowerCase();
      const username = (e.user?.username || '').toLowerCase();
      const phone = (e.user?.phone || '').toLowerCase();
      const position = (e.position_name || '').toLowerCase();
      if (!name.includes(q) && !username.includes(q) && !phone.includes(q) && !position.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Xodimlar bazasi ({filtered.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Barchasi</option>
            <option value="active">✅ Aktiv</option>
            <option value="vacation">🏖 Tatilda</option>
            <option value="sick">🤒 Kasal</option>
            <option value="dismissed">❌ Ishdan ketgan</option>
          </select>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
            <MdAdd /> Yangi xodim
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <MdSearch className="absolute left-3 top-3 text-gray-400" />
        <input placeholder="Ism, login, telefon yoki lavozim bo'yicha qidirish..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-lg pl-10 pr-3 py-2 w-full text-sm" />
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Login (username)" value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <input placeholder="Ism" value={form.first_name}
            onChange={e => setForm({...form, first_name: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <input placeholder="Familiya" value={form.last_name}
            onChange={e => setForm({...form, last_name: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <input placeholder="Telefon" value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <select value={form.position} onChange={e => setForm({...form, position: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="">Lavozim tanlang</option>
            {positions.map(p => <option key={p.id} value={p.id}>{p.name} ({p.salary_type_display})</option>)}
          </select>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="baker">Novvoy</option>
            <option value="seller">Sotuvchi</option>
            <option value="point_seller">Nuqta sotuvchisi</option>
            <option value="manager">Menejer</option>
            <option value="accountant">Hisobchi</option>
          </select>
          <input type="date" value={form.hire_date}
            onChange={e => setForm({...form, hire_date: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <input type="number" placeholder="Fiksirlangan oylik (so'm)" value={form.fixed_salary}
            onChange={e => setForm({...form, fixed_salary: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <input placeholder="Parol (default: pass123)" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <input placeholder="Manzil" value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-2" />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">Saqlash</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => {
          const st = STATUS_LABELS[emp.status] || STATUS_LABELS.active;
          return (
            <div key={emp.id} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg">
                    {(emp.first_name || emp.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{emp.full_name}</h3>
                    <p className="text-xs text-gray-500">{emp.position_name || emp.role_display}</p>
                  </div>
                </div>
                <span className={'text-xs px-2 py-1 rounded-full ' + st.color}>{st.label}</span>
              </div>
              {emp.phone && <p className="text-sm text-gray-600">📞 {emp.phone}</p>}
              <p className="text-sm text-gray-500 mt-1">📅 {emp.hire_date}</p>
              {parseFloat(emp.fixed_salary) > 0 && (
                <p className="text-sm font-semibold text-bread-700 mt-2">
                  💰 Fiksirlangan: {formatMoney(emp.fixed_salary)}/oy
                </p>
              )}
              {emp.position_salary_type === 'piecework' && (
                <p className="text-xs text-blue-600 mt-1">⚙️ Ishbay (sdelniy)</p>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">Xodimlar yo'q</p>
      )}
    </div>
  );
}

// === Davomat tab ===
function AttendanceTab() {
  const [employees, setEmployees] = useState([]);
  const [todayAtt, setTodayAtt] = useState([]);
  const [date, setDate] = useState(todayStr());
  const [history, setHistory] = useState([]);

  const load = useCallback(() => {
    api.get('/hr/employees/?status=active').then(r => setEmployees(r.data.results || r.data)).catch(() => {});
    api.get('/hr/attendance/?date=' + date).then(r => {
      const data = r.data.results || r.data;
      if (date === todayStr()) setTodayAtt(data);
      setHistory(data);
    }).catch(() => {});
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const getEmpAtt = (empId) => {
    return todayAtt.find(a => a.employee === empId) || null;
  };

  const markStatus = async (empId, attStatus) => {
    try {
      await api.post('/hr/attendance/mark_today/', {
        records: [{ employee: empId, shift: 'day', status: attStatus }]
      });
      toast.success('Belgilandi');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4 flex items-center gap-3 flex-wrap">
        <span className="font-medium">📅 Sana:</span>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border rounded-lg px-3 py-2" max={todayStr()} />
        {date === todayStr() && (
          <span className="text-sm text-green-600 ml-2">⚡ Bugungi davomat — tugmalar bilan belgilang</span>
        )}
      </div>

      {date === todayStr() ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Bugungi davomat ({todayStr()})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map(emp => {
              const att = getEmpAtt(emp.id);
              return (
                <div key={emp.id} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                      {(emp.first_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{emp.full_name}</p>
                      <p className="text-xs text-gray-500">{emp.position_name}</p>
                    </div>
                  </div>
                  {att ? (
                    <div className={'text-center p-2 rounded-lg ' + ATT_STATUS[att.status].color}>
                      <p className="font-semibold">{ATT_STATUS[att.status].label}</p>
                      {att.check_in && <p className="text-xs">⏰ {new Date(att.check_in).toLocaleTimeString('uz-UZ').slice(0, 5)}</p>}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-2">Belgilanmagan</p>
                  )}
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <button onClick={() => markStatus(emp.id, 'present')}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                      ✓ Keldi
                    </button>
                    <button onClick={() => markStatus(emp.id, 'absent')}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                      ✗ Kelmadi
                    </button>
                    <button onClick={() => markStatus(emp.id, 'sick')}
                      className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200">
                      🤒 Kasal
                    </button>
                    <button onClick={() => markStatus(emp.id, 'vacation')}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                      🏖 Tatil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-3">Davomat ({date})</h2>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Xodim</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-600">Smena</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-600">Holat</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-600">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {history.map(att => {
                  const st = ATT_STATUS[att.status];
                  return (
                    <tr key={att.id} className="border-t">
                      <td className="p-3 font-medium">{att.employee_name}</td>
                      <td className="p-3 text-center">{att.shift_display}</td>
                      <td className="p-3 text-center">
                        <span className={'px-2 py-1 text-xs rounded-full ' + st.color}>{st.label}</span>
                      </td>
                      <td className="p-3 text-center text-sm text-gray-500">
                        {att.check_in ? new Date(att.check_in).toLocaleTimeString('uz-UZ').slice(0, 5) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {history.length === 0 && <p className="text-center text-gray-400 py-8">Yozuvlar yo'q</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// === Bonus / Penalty tab ===
function BonusPenalty() {
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
      toast.success("Qo'shildi");
      setShowAdd(false);
      setForm({ employee: '', amount: '', reason: '', month: currentMonth() });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const items = activeTab === 'bonus' ? bonuses : penalties;
  const total = items.reduce((s, x) => s + parseFloat(x.amount), 0);

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b">
        <button onClick={() => setActiveTab('bonus')}
          className={'px-4 py-2 font-medium ' +
            (activeTab === 'bonus' ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-500')}>
          🎁 Mukofotlar ({bonuses.length})
        </button>
        <button onClick={() => setActiveTab('penalty')}
          className={'px-4 py-2 font-medium ' +
            (activeTab === 'penalty' ? 'text-red-700 border-b-2 border-red-600' : 'text-gray-500')}>
          ⚠️ Shtraflar ({penalties.length})
        </button>
      </div>

      <div className={'p-4 rounded-xl mb-4 ' + (activeTab === 'bonus' ? 'bg-green-50' : 'bg-red-50')}>
        <p className="text-sm text-gray-600">
          {activeTab === 'bonus' ? '🎁 Jami mukofotlar' : '⚠️ Jami shtraflar'}
        </p>
        <p className={'text-2xl font-bold ' + (activeTab === 'bonus' ? 'text-green-700' : 'text-red-700')}>
          {formatMoney(total)}
        </p>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowAdd(!showAdd)}
          className={'flex items-center gap-2 text-white px-4 py-2 rounded-lg ' +
            (activeTab === 'bonus' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}>
          <MdAdd /> Yangi {activeTab === 'bonus' ? 'mukofot' : 'shtraf'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Xodim tanlang</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <input type="number" placeholder="Summa" value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <input type="month" value={form.month}
            onChange={e => setForm({...form, month: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <button type="submit" className={'text-white rounded-lg px-4 py-2 ' +
            (activeTab === 'bonus' ? 'bg-green-600' : 'bg-red-600')}>Saqlash</button>
          <input placeholder="Sabab" value={form.reason}
            onChange={e => setForm({...form, reason: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-4" required />
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Xodim</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sabab</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Oy</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Summa</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{it.date}</td>
                <td className="p-3 font-medium">{it.employee_name}</td>
                <td className="p-3 text-gray-600 text-sm">{it.reason}</td>
                <td className="p-3 text-sm">{it.month}</td>
                <td className={'p-3 text-right font-semibold ' +
                  (activeTab === 'bonus' ? 'text-green-700' : 'text-red-700')}>
                  {activeTab === 'bonus' ? '+' : '-'}{formatMoney(it.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center text-gray-400 py-8">Yozuvlar yo'q</p>}
      </div>
    </div>
  );
}

// === Avanslar tab ===
function Advances() {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    employee: '', amount: '', month: currentMonth(),
    cash_register: '', description: '',
  });

  const load = useCallback(() => {
    api.get('/hr/advances/').then(r => setAdvances(r.data.results || r.data)).catch(() => {});
    api.get('/hr/employees/?status=active').then(r => setEmployees(r.data.results || r.data)).catch(() => {});
    api.get('/accounting/cash-registers/').then(r => setRegisters(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/advances/', form);
      toast.success('Avans berildi (kassadan ayirildi)');
      setShowAdd(false);
      setForm({ employee: '', amount: '', month: currentMonth(), cash_register: '', description: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const total = advances.reduce((s, a) => s + parseFloat(a.amount), 0);

  return (
    <div>
      <div className="bg-orange-50 p-4 rounded-xl mb-4">
        <p className="text-sm text-gray-600">💸 Jami avanslar</p>
        <p className="text-2xl font-bold text-orange-700">{formatMoney(total)}</p>
        <p className="text-xs text-gray-500 mt-1">Avtomatik kassadan ayiriladi va maoshdan chegiriladi</p>
      </div>

      <div className="flex justify-end mb-3">
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <MdAdd /> Yangi avans
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-orange-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.employee} onChange={e => setForm({...form, employee: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Xodim</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
          <input type="number" placeholder="Summa" value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <select value={form.cash_register} onChange={e => setForm({...form, cash_register: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Kassa</option>
            {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input type="month" value={form.month}
            onChange={e => setForm({...form, month: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <input placeholder="Izoh" value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-3" />
          <button type="submit" className="bg-orange-600 text-white rounded-lg px-4 py-2">Saqlash</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Xodim</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Kassa</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Oy</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Izoh</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Summa</th>
            </tr>
          </thead>
          <tbody>
            {advances.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{a.date}</td>
                <td className="p-3 font-medium">{a.employee_name}</td>
                <td className="p-3 text-sm">{a.cash_register_name || '-'}</td>
                <td className="p-3 text-sm">{a.month}</td>
                <td className="p-3 text-gray-600 text-sm">{a.description}</td>
                <td className="p-3 text-right font-semibold text-orange-700">{formatMoney(a.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {advances.length === 0 && <p className="text-center text-gray-400 py-8">Avanslar yo'q</p>}
      </div>
    </div>
  );
}

// === Maosh hisoblash tab ===
function Salaries() {
  const [payments, setPayments] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [calculating, setCalculating] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ cash_register: '', amount: '' });

  const load = useCallback(() => {
    api.get('/hr/salary-payments/?month=' + month).then(r => setPayments(r.data.results || r.data)).catch(() => {});
    api.get('/accounting/cash-registers/').then(r => setRegisters(r.data.results || r.data)).catch(() => {});
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/hr/salary-payments/calculate/', { month });
      toast.success(res.data.count + " ta xodim uchun maosh hisoblandi");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCalculating(false); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hr/salary-payments/' + payModal.id + '/pay/', payForm);
      toast.success("Maosh to'landi");
      setPayModal(null);
      setPayForm({ cash_register: '', amount: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const totalPending = payments.filter(p => p.status === 'draft').reduce((s, p) => s + parseFloat(p.total_to_pay), 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.paid_amount), 0);

  return (
    <div>
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-4 flex items-center gap-3 flex-wrap">
        <span className="font-medium">📅 Oy:</span>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2" />
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={() => downloadExcel('/hr/export/salaries/', `maoshlar_${month}.xlsx`, { month })}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm">
            <MdFileDownload /> Excel
          </button>
          <button onClick={handleCalculate} disabled={calculating}
            className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700 disabled:opacity-50">
            <MdCalculate /> {calculating ? 'Hisoblanmoqda...' : 'Maosh hisoblash'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Hisoblangan xodimlar</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-sm text-gray-500">⏳ To'lanishi kerak</p>
          <p className="text-2xl font-bold text-yellow-700">{formatMoney(totalPending)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-sm text-gray-500">✅ To'langan</p>
          <p className="text-2xl font-bold text-green-700">{formatMoney(totalPaid)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium text-gray-600">Xodim</th>
              <th className="text-left p-3 font-medium text-gray-600">Lavozim</th>
              <th className="text-right p-3 font-medium text-gray-600">Asosiy</th>
              <th className="text-right p-3 font-medium text-gray-600">Ishbay</th>
              <th className="text-right p-3 font-medium text-gray-600">+Mukofot</th>
              <th className="text-right p-3 font-medium text-gray-600">-Shtraf</th>
              <th className="text-right p-3 font-medium text-gray-600">-Avans</th>
              <th className="text-right p-3 font-medium text-gray-600 bg-bread-50">= Qoldiq</th>
              <th className="text-center p-3 font-medium text-gray-600">Holat</th>
              <th className="text-center p-3 font-medium text-gray-600">Amal</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{p.employee_name}</td>
                <td className="p-3 text-gray-600 text-xs">{p.position_name || '-'}</td>
                <td className="p-3 text-right">{formatMoney(p.base_salary)}</td>
                <td className="p-3 text-right text-blue-700">
                  {parseFloat(p.piecework_amount) > 0 ? '+' + formatMoney(p.piecework_amount) : '-'}
                  {p.units_produced > 0 && <p className="text-xs text-gray-400">{p.units_produced} dona</p>}
                </td>
                <td className="p-3 text-right text-green-700">+{formatMoney(p.bonus_total)}</td>
                <td className="p-3 text-right text-red-700">-{formatMoney(p.penalty_total)}</td>
                <td className="p-3 text-right text-orange-700">-{formatMoney(p.advance_total)}</td>
                <td className="p-3 text-right font-bold text-bread-700 bg-bread-50">{formatMoney(p.total_to_pay)}</td>
                <td className="p-3 text-center">
                  {p.status === 'paid' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✓ To'langan</span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">⏳ Kutmoqda</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {p.status === 'draft' && parseFloat(p.total_to_pay) > 0 && (
                    <button onClick={() => { setPayModal(p); setPayForm({ cash_register: '', amount: p.total_to_pay }); }}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700">
                      💳 To'lash
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            Maosh hisoblanmagan. Yuqorida "Maosh hisoblash" tugmasini bosing.
          </p>
        )}
      </div>

      {/* To'lov modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Maosh to'lash</h3>
              <button onClick={() => setPayModal(null)}><MdClose /></button>
            </div>
            <p className="text-sm text-gray-500 mb-2">Xodim: <strong>{payModal.employee_name}</strong></p>
            <p className="text-sm text-gray-500 mb-3">Hisoblangan: <strong>{formatMoney(payModal.total_to_pay)}</strong></p>
            <form onSubmit={handlePay} className="space-y-3">
              <select value={payForm.cash_register}
                onChange={e => setPayForm({...payForm, cash_register: e.target.value})}
                className="border rounded-lg px-3 py-2 w-full" required>
                <option value="">Qaysi kassadan to'lash</option>
                {registers.map(r => <option key={r.id} value={r.id}>{r.name} ({formatMoney(r.balance)})</option>)}
              </select>
              <input type="number" placeholder="Summa" value={payForm.amount}
                onChange={e => setPayForm({...payForm, amount: e.target.value})}
                className="border rounded-lg px-3 py-2 w-full" required />
              <button type="submit" className="w-full bg-green-600 text-white rounded-lg py-2 hover:bg-green-700">
                💳 To'lashni tasdiqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// === Asosiy komponent ===
export default function HR() {
  const [tab, setTab] = useState('employees');
  const tabs = [
    { id: 'employees', label: 'Xodimlar', icon: MdPeople },
    { id: 'attendance', label: 'Davomat', icon: MdAccessTime },
    { id: 'bonus', label: 'Mukofot/Shtraf', icon: MdAttachMoney },
    { id: 'advances', label: 'Avanslar', icon: MdLogin },
    { id: 'salaries', label: 'Maosh hisob-kitobi', icon: MdPayment },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👥 Xodimlar (HR)</h1>
      <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ' +
              (tab === t.id ? 'bg-bread-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'employees' && <Employees />}
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'bonus' && <BonusPenalty />}
      {tab === 'advances' && <Advances />}
      {tab === 'salaries' && <Salaries />}
    </div>
  );
}

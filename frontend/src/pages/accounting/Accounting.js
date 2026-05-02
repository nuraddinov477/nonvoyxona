import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MdAccountBalanceWallet, MdSwapHoriz, MdPeople, MdAdd,
  MdAssessment, MdCategory, MdClose, MdPayment
} from 'react-icons/md';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

import { formatMoney, todayStr, firstDayOfMonth, CHART_COLORS as COLORS, getErrorMessage } from '../../utils/helpers';

// === Kassalar ===
function CashRegisters() {
  const [registers, setRegisters] = useState([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [transferForm, setTransferForm] = useState({ source: '', target_id: '', amount: '', description: '' });
  const [form, setForm] = useState({ name: '', type: 'main', balance: 0 });

  const load = useCallback(() => {
    api.get('/accounting/cash-registers/').then(r => setRegisters(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting/cash-registers/' + transferForm.source + '/transfer/', {
        target_id: transferForm.target_id,
        amount: transferForm.amount,
        description: transferForm.description,
      });
      toast.success("O'tkazma amalga oshirildi");
      setShowTransfer(false);
      setTransferForm({ source: '', target_id: '', amount: '', description: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Xatolik'); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting/cash-registers/', form);
      toast.success("Kassa qo'shildi");
      setShowAdd(false);
      setForm({ name: '', type: 'main', balance: 0 });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const totalBalance = registers.reduce((s, r) => s + parseFloat(r.balance), 0);

  return (
    <div>
      <div className="bg-gradient-to-r from-bread-600 to-bread-800 text-white p-5 rounded-xl mb-6">
        <p className="text-sm opacity-90">💰 Jami kassa balansi (boshqaruvchi hamyoni)</p>
        <p className="text-3xl font-bold mt-2">{formatMoney(totalBalance)}</p>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Kassalar</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300">
            <MdAdd /> Yangi kassa
          </button>
          <button onClick={() => setShowTransfer(!showTransfer)}
            className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
            <MdSwapHoriz /> Kassalararo o'tkazma
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input placeholder="Kassa nomi" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="main">Asosiy (naqd)</option>
            <option value="terminal">Terminal</option>
            <option value="electronic">Click/Payme</option>
            <option value="expense">Xarajat kassasi</option>
          </select>
          <input type="number" placeholder="Boshlang'ich balans" value={form.balance}
            onChange={e => setForm({...form, balance: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-4 py-2">Saqlash</button>
        </form>
      )}

      {showTransfer && (
        <form onSubmit={handleTransfer} className="bg-blue-50 p-4 rounded-lg mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={transferForm.source} onChange={e => setTransferForm({...transferForm, source: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Qayerdan</option>
            {registers.map(r => <option key={r.id} value={r.id}>{r.name} ({formatMoney(r.balance)})</option>)}
          </select>
          <select value={transferForm.target_id} onChange={e => setTransferForm({...transferForm, target_id: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Qayerga</option>
            {registers.filter(r => String(r.id) !== transferForm.source).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input type="number" placeholder="Summa" value={transferForm.amount}
            onChange={e => setTransferForm({...transferForm, amount: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2">O'tkazish</button>
          <input placeholder="Izoh" value={transferForm.description}
            onChange={e => setTransferForm({...transferForm, description: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-4" />
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {registers.map(r => {
          const colors = {
            main: 'border-emerald-500 bg-emerald-50 text-emerald-700',
            terminal: 'border-blue-500 bg-blue-50 text-blue-700',
            electronic: 'border-purple-500 bg-purple-50 text-purple-700',
            expense: 'border-orange-500 bg-orange-50 text-orange-700',
          };
          return (
            <div key={r.id} className={'bg-white rounded-xl p-5 shadow-sm border-l-4 ' + (colors[r.type] || colors.main)}>
              <p className="text-sm text-gray-500">{r.type_display}</p>
              <h3 className="text-lg font-semibold mt-1">{r.name}</h3>
              <p className="text-2xl font-bold mt-2 text-gray-800">{formatMoney(r.balance)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Tranzaksiyalar (kategoriya bilan) ===
function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ cash_register: '', type: 'expense', amount: '', description: '', category: '' });

  const load = useCallback(() => {
    let url = '/accounting/transactions/';
    if (filterType) url += '?type=' + filterType;
    api.get(url).then(r => setTransactions(r.data.results || r.data)).catch(() => {});
    api.get('/accounting/cash-registers/').then(r => setRegisters(r.data.results || r.data)).catch(() => {});
    api.get('/accounting/transaction-categories/').then(r => setCategories(r.data.results || r.data)).catch(() => {});
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.category) delete data.category;
      await api.post('/accounting/transactions/', data);
      toast.success("Tranzaksiya qo'shildi");
      setShowAdd(false);
      setForm({ cash_register: '', type: 'expense', amount: '', description: '', category: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const filteredCats = categories.filter(c => c.type === form.type);

  // Itogoviy hisoblash
  const totals = transactions.reduce((acc, t) => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') acc.income += amt;
    else if (t.type === 'expense') acc.expense += amt;
    else if (t.type === 'transfer') acc.transfer += amt;
    return acc;
  }, { income: 0, expense: 0, transfer: 0 });
  const balance = totals.income - totals.expense;

  return (
    <div>
      {/* Itogoviy kartalar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">📋 Jami yozuvlar</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{transactions.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm">
          <p className="text-sm text-gray-600">↑ Jami KIRIM</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">+{formatMoney(totals.income)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500 shadow-sm">
          <p className="text-sm text-gray-600">↓ Jami CHIQIM</p>
          <p className="text-2xl font-bold mt-1 text-red-700">-{formatMoney(totals.expense)}</p>
        </div>
        <div className={'p-4 rounded-xl border-l-4 shadow-sm ' +
          (balance >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500')
        }>
          <p className="text-sm text-gray-600">⚖️ BALANS (Kirim − Chiqim)</p>
          <p className={'text-2xl font-bold mt-1 ' + (balance >= 0 ? 'text-blue-700' : 'text-orange-700')}>
            {balance >= 0 ? '+' : ''}{formatMoney(balance)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Tranzaksiyalar</h2>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Barchasi</option>
            <option value="income">Faqat kirim</option>
            <option value="expense">Faqat chiqim</option>
            <option value="transfer">Faqat o'tkazma</option>
          </select>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
            <MdAdd /> Yangi
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={form.cash_register} onChange={e => setForm({...form, cash_register: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Kassa tanlang</option>
            {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value, category: ''})}
            className="border rounded-lg px-3 py-2">
            <option value="income">↑ Kirim</option>
            <option value="expense">↓ Chiqim</option>
          </select>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="">Kategoriya (ixtiyoriy)</option>
            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="number" placeholder="Summa" value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <input placeholder="Izoh" value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-2" required />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-4 py-2 col-span-1 md:col-span-3">
            Saqlash
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Turi</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Kategoriya</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Kassa</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Izoh</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Summa</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{new Date(t.date).toLocaleString('uz-UZ')}</td>
                <td className="p-3">
                  <span className={'px-2 py-1 text-xs rounded-full ' +
                    (t.type === 'income' ? 'bg-green-100 text-green-700' :
                     t.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')
                  }>{t.type_display}</span>
                </td>
                <td className="p-3 text-sm text-gray-600">{t.category_name || '-'}</td>
                <td className="p-3">{t.cash_register_name}</td>
                <td className="p-3 text-gray-600 text-sm">{t.description}</td>
                <td className={'p-3 text-right font-semibold ' +
                  (t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : '')}>
                  {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          {transactions.length > 0 && (
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr className="font-bold">
                <td className="p-3" colSpan="5">📊 ITOGO ({transactions.length} ta yozuv)</td>
                <td className="p-3 text-right">
                  <div className="text-sm text-emerald-700">↑ Kirim: +{formatMoney(totals.income)}</div>
                  <div className="text-sm text-red-700">↓ Chiqim: -{formatMoney(totals.expense)}</div>
                  <div className={'text-base mt-1 pt-1 border-t ' + (balance >= 0 ? 'text-blue-700' : 'text-orange-700')}>
                    ⚖️ Balans: {balance >= 0 ? '+' : ''}{formatMoney(balance)}
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {transactions.length === 0 && (
          <p className="text-center text-gray-400 py-8">Tranzaksiyalar yo'q</p>
        )}
      </div>
    </div>
  );
}

// === Xarajat kategoriyalari boshqaruvi ===
function Categories() {
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'expense' });

  const load = useCallback(() => {
    api.get('/accounting/transaction-categories/').then(r => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounting/transaction-categories/', form);
      toast.success("Kategoriya qo'shildi");
      setShowAdd(false);
      setForm({ name: '', type: 'expense' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("O'chirilsinmi?")) return;
    try {
      await api.delete('/accounting/transaction-categories/' + id + '/');
      toast.success("O'chirildi");
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const expenseCats = categories.filter(c => c.type === 'expense');
  const incomeCats = categories.filter(c => c.type === 'income');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Tranzaksiya kategoriyalari</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
          <MdAdd /> Yangi kategoriya
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-3 flex-wrap">
          <input placeholder="Kategoriya nomi" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" required />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="expense">Chiqim</option>
            <option value="income">Kirim</option>
          </select>
          <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">Saqlash</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h3 className="text-lg font-semibold text-red-700 mb-3">↓ Chiqim kategoriyalari</h3>
          <div className="space-y-2">
            {expenseCats.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium">{c.name}</span>
                <button onClick={() => handleDelete(c.id)}
                  className="text-red-500 hover:bg-red-100 px-2 py-1 rounded text-sm">O'chirish</button>
              </div>
            ))}
            {expenseCats.length === 0 && <p className="text-gray-400 text-sm">Yo'q</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border shadow-sm">
          <h3 className="text-lg font-semibold text-green-700 mb-3">↑ Kirim kategoriyalari</h3>
          <div className="space-y-2">
            {incomeCats.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">{c.name}</span>
                <button onClick={() => handleDelete(c.id)}
                  className="text-red-500 hover:bg-red-100 px-2 py-1 rounded text-sm">O'chirish</button>
              </div>
            ))}
            {incomeCats.length === 0 && <p className="text-gray-400 text-sm">Yo'q</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        💡 <strong>Misollar:</strong> Xom ashyo xaridi (un, yog'), Kommunal (gaz, suv, elektr), Ish haqi, Ijara, Maishiy xarajatlar (idishlar, tozalik)
      </div>
    </div>
  );
}

// === Yetkazib beruvchilar (Kreditorlar) - to'lov tarixi bilan ===
function Suppliers() {
  const [creditors, setCreditors] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [activeTab, setActiveTab] = useState('creditors');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', description: '', is_payment: true });

  const load = useCallback(() => {
    api.get('/accounting/creditors/').then(r => setCreditors(r.data.results || r.data)).catch(() => {});
    api.get('/accounting/debtors/').then(r => setDebtors(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const url = activeTab === 'creditors' ? '/accounting/creditors/' : '/accounting/debtors/';
      await api.post(url, form);
      toast.success("Qo'shildi");
      setShowAdd(false);
      setForm({ name: '', phone: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const url = activeTab === 'creditors'
        ? '/accounting/creditors/' + paymentModal.id + '/add_record/'
        : '/accounting/debtors/' + paymentModal.id + '/add_record/';
      await api.post(url, paymentForm);
      toast.success(paymentForm.is_payment ? "To'lov qayd qilindi" : 'Yangi qarz qo\'shildi');
      setPaymentModal(null);
      setPaymentForm({ amount: '', description: '', is_payment: true });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const items = activeTab === 'creditors' ? creditors : debtors;
  const total = items.reduce((s, x) => s + parseFloat(x.total_debt), 0);
  const themeColor = activeTab === 'creditors' ? 'orange' : 'red';

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b">
        <button onClick={() => setActiveTab('creditors')}
          className={'px-4 py-2 font-medium ' +
            (activeTab === 'creditors' ? 'text-orange-700 border-b-2 border-orange-600' : 'text-gray-500')}>
          🏭 Yetkazib beruvchilar (biz qarz)
        </button>
        <button onClick={() => setActiveTab('debtors')}
          className={'px-4 py-2 font-medium ' +
            (activeTab === 'debtors' ? 'text-red-700 border-b-2 border-red-600' : 'text-gray-500')}>
          🏪 Mijozlar (bizga qarz)
        </button>
      </div>

      <div className={'p-4 rounded-xl mb-4 ' + (themeColor === 'orange' ? 'bg-orange-50' : 'bg-red-50')}>
        <p className="text-sm text-gray-600">
          {activeTab === 'creditors' ? '💰 Biz to\'lashimiz kerak' : '💸 Bizga to\'lashlari kerak'}
        </p>
        <p className={'text-2xl font-bold ' + (themeColor === 'orange' ? 'text-orange-700' : 'text-red-700')}>
          {formatMoney(total)}
        </p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {activeTab === 'creditors' ? 'Yetkazib beruvchilar' : 'Qarzdorlar (mijozlar)'}
        </h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className={'flex items-center gap-2 text-white px-4 py-2 rounded-lg ' +
            (themeColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700')}>
          <MdAdd /> Yangi {activeTab === 'creditors' ? 'yetkazib beruvchi' : 'qarzdor'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-3 flex-wrap">
          <input placeholder="Ism / Kompaniya" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" required />
          <input placeholder="Telefon" value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className="border rounded-lg px-3 py-2 w-48" />
          <button type="submit" className={'text-white rounded-lg px-6 py-2 ' +
            (themeColor === 'orange' ? 'bg-orange-600' : 'bg-red-600')}>
            Saqlash
          </button>
        </form>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {item.phone && <p className="text-sm text-gray-500">📞 {item.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Joriy qarz</p>
                <p className={'text-xl font-bold ' + (themeColor === 'orange' ? 'text-orange-700' : 'text-red-700')}>
                  {formatMoney(item.total_debt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPaymentModal(item); setPaymentForm({ amount: '', description: '', is_payment: true }); }}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm">
                <MdPayment /> {activeTab === 'creditors' ? "To'lash" : 'To\'lov qabul qilish'}
              </button>
              <button onClick={() => { setPaymentModal(item); setPaymentForm({ amount: '', description: '', is_payment: false }); }}
                className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 text-sm">
                <MdAdd /> Yangi qarz qo'shish
              </button>
            </div>

            {item.records && item.records.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-bread-600 hover:underline">
                  📋 To'lov tarixi ({item.records.length})
                </summary>
                <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
                  {item.records.slice(0, 10).map(r => (
                    <div key={r.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">
                        {new Date(r.date).toLocaleDateString('uz-UZ')} -
                        {r.is_payment ? ' To\'lov' : ' Yangi qarz'}
                        {r.description && ': ' + r.description}
                      </span>
                      <span className={r.is_payment ? 'text-green-600' : 'text-red-600'}>
                        {r.is_payment ? '-' : '+'}{formatMoney(r.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-gray-400 py-8">Yo'q</p>
        )}
      </div>

      {/* To'lov modali */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {paymentForm.is_payment ? "To'lov" : "Yangi qarz"} - {paymentModal.name}
              </h3>
              <button onClick={() => setPaymentModal(null)}><MdClose /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Joriy qarz: {formatMoney(paymentModal.total_debt)}</p>
            <form onSubmit={handlePayment} className="space-y-3">
              <input type="number" placeholder="Summa" value={paymentForm.amount}
                onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                className="border rounded-lg px-3 py-2 w-full" required />
              <input placeholder="Izoh (ixtiyoriy)" value={paymentForm.description}
                onChange={e => setPaymentForm({...paymentForm, description: e.target.value})}
                className="border rounded-lg px-3 py-2 w-full" />
              <button type="submit" className={'text-white rounded-lg px-4 py-2 w-full ' +
                (paymentForm.is_payment ? 'bg-green-600' : 'bg-yellow-600')}>
                {paymentForm.is_payment ? "To'lovni saqlash" : "Yangi qarzni saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// === P&L (Foyda-Zarar) ===
function ProfitLoss() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(todayStr());
  const [infoCard, setInfoCard] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadDetail = (type) => {
    setDetailLoading(true);
    setDetailModal({ type, data: null });
    api.get('/accounting/profit-loss-detail/?type=' + type + '&date_from=' + dateFrom + '&date_to=' + dateTo)
      .then(r => setDetailModal({ type, data: r.data }))
      .catch(() => setDetailModal({ type, data: { error: true } }))
      .finally(() => setDetailLoading(false));
  };

  const load = useCallback(() => {
    setLoading(true);
    api.get('/accounting/profit-loss/?date_from=' + dateFrom + '&date_to=' + dateTo)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const setQuickRange = (type) => {
    const now = new Date();
    let from;
    if (type === 'today') {
      from = now;
    } else if (type === 'week') {
      from = new Date(); from.setDate(from.getDate() - 6);
    } else if (type === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === '3months') {
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (type === 'year') {
      from = new Date(now.getFullYear(), 0, 1);
    }
    setDateFrom(from.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const cardInfo = {
    revenue: {
      title: '📈 Tovar aylanmasi (Turnover / Sales Revenue)',
      desc: "Bu — tanlangan davrda barcha sotilgan mahsulotlar uchun tushgan jami pul. Hech qanday xarajat hisobga olinmaydi, bu — yalpi tushum.",
      formula: 'Tovar aylanmasi = Σ (Sotuvlar)',
      example: 'Misol: 1000 ta non × 4000 so\'m + 200 ta somsa × 6000 so\'m = 5,200,000 so\'m'
    },
    cogs: {
      title: '📦 Tannarx (COGS - Cost of Goods Sold)',
      desc: "Sotilgan har bir mahsulot uchun sarflangan xom ashyo qiymati. Tizim har bir sotilgan mahsulotning retseptidan kerakli un, yog', achitqi va h.k. miqdorini olib, ularning narxlarini ko'paytiradi.",
      formula: 'Tannarx = Σ (Sotilgan_dona × Retseptdagi_xom_ashyo × Narx)',
      example: 'Misol: 1 dona non = 0.4 kg un × 6500 so\'m + 0.02 l yog\' × 28000 so\'m = ~3160 so\'m'
    },
    gross: {
      title: '💵 Yalpi foyda (Gross Profit)',
      desc: 'Tushumdan tannarxni ayirgandan keyin qoladigan pul. Bu hali sof foyda emas — operatsion xarajatlar (ish haqi, kommunal) hali hisobga olinmagan.',
      formula: 'Yalpi foyda = Tushum − Tannarx',
      example: "Marja = (Yalpi foyda / Tushum) × 100%. Yaxshi: 30-50%. Manfiy bo'lsa - mahsulot zarariga sotilyapti!"
    },
    expenses: {
      title: '📉 Operatsion xarajatlar',
      desc: "Mahsulot ishlab chiqarishdan tashqari barcha xarajatlar: ish haqi, ijara, kommunal (gaz/suv/elektr), maishiy xarajatlar (idishlar, tozalik), reklama va h.k. Tranzaksiyalar bo'limidagi 'Chiqim' yozuvlari hisoblanadi.",
      formula: 'Σ (Tranzaksiyalar.type=expense)',
      example: "Bu xarajatlar Moliya → Tranzaksiyalar bo'limida 'Chiqim' sifatida yoziladi va kategoriyalarga ajratiladi."
    },
    other_income: {
      title: '💰 Boshqa kirimlar',
      desc: "Sotuvdan tashqari boshqa kirimlar: investitsiya, kredit, qaytarib olingan qarzlar va h.k. Tranzaksiyalar bo'limidagi 'Kirim' yozuvlari.",
      formula: 'Σ (Tranzaksiyalar.type=income)',
      example: "Misol: Bankdan kredit, asosiy vositalar sotuvi, foiz daromadi"
    },
    net: {
      title: '⭐ Sof foyda (Net Profit)',
      desc: "Eng muhim ko'rsatkich! Barcha xarajatlar (tannarx + operatsion) ayrilgandan va boshqa kirimlar qo'shilgandan keyin **biznes sohibi cho'ntagiga tushadigan** real foyda. Manfiy bo'lsa — biznes zarar ko'rayapti.",
      formula: 'Sof foyda = Yalpi foyda + Boshqa kirimlar − Operatsion xarajatlar',
      example: "Sof marja: yaxshi biznes uchun 10-20%. Past bo'lsa - xarajatlarni kamaytirish yoki narxni oshirish kerak."
    },
  };

  if (loading && !data) return <p className="text-gray-500 text-center py-8">Yuklanmoqda...</p>;
  if (!data) return <p className="text-gray-500">Ma'lumot yo'q</p>;

  const InfoCard = ({ id, color, label, value, subtitle, valueColor }) => (
    <div className={'p-5 rounded-xl border-l-4 relative ' + color}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <button onClick={() => setInfoCard(id)}
          className="w-6 h-6 rounded-full bg-white text-gray-500 hover:bg-bread-100 hover:text-bread-700 flex items-center justify-center font-bold text-sm border"
          title="Batafsil ma'lumot">
          ?
        </button>
      </div>
      <p className={'text-2xl font-bold mt-1 ' + (valueColor || '')}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Yordam paneli */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <button onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 text-blue-700 font-semibold w-full justify-between">
          <span>📚 P&L (Foyda-Zarar) hisoboti haqida ma'lumot</span>
          <span className="text-2xl">{showHelp ? '−' : '+'}</span>
        </button>
        {showHelp && (
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <p><strong>P&L (Profit & Loss Statement)</strong> — bu biznesning ma'lum bir davrdagi moliyaviy natijasini ko'rsatuvchi asosiy hisobot. Quyidagi formula bo'yicha hisoblanadi:</p>
            <div className="bg-white p-3 rounded-lg font-mono text-sm">
              <p>Tushum (Revenue) <span className="text-gray-400">— barcha sotuvlar</span></p>
              <p className="text-red-600">− Tannarx (COGS) <span className="text-gray-400">— xom ashyo qiymati</span></p>
              <p className="text-blue-600 font-bold border-t mt-1 pt-1">= Yalpi foyda (Gross Profit)</p>
              <p className="text-purple-600">+ Boshqa kirimlar</p>
              <p className="text-red-600">− Operatsion xarajatlar <span className="text-gray-400">— ish haqi, kommunal</span></p>
              <p className="text-green-700 font-bold border-t-2 mt-1 pt-1">= ⭐ SOF FOYDA (Net Profit)</p>
            </div>
            <p>💡 <strong>Maslahat:</strong> Har bir kartada <strong>?</strong> tugmasini bosib, batafsil tushuntirish va misolni ko'rishingiz mumkin.</p>
          </div>
        )}
      </div>

      {/* Sana tanlash */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium">📅 Davr:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2" max={dateTo} />
          <span>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2" min={dateFrom} max={todayStr()} />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={() => setQuickRange('today')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">Bugun</button>
          <button onClick={() => setQuickRange('week')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">Oxirgi 7 kun</button>
          <button onClick={() => setQuickRange('month')}
            className="px-3 py-1.5 text-sm bg-bread-100 hover:bg-bread-200 text-bread-700 rounded-lg font-medium">Joriy oy</button>
          <button onClick={() => setQuickRange('3months')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">3 oy</button>
          <button onClick={() => setQuickRange('year')}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">Joriy yil</button>
        </div>
      </div>

      {/* P&L kartochkalari */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard id="revenue"
          color="bg-emerald-50 border-emerald-500"
          label="📈 Tovar aylanmasi (Tushum)"
          value={formatMoney(data.revenue)}
          valueColor="text-emerald-700"
          subtitle={data.units_sold + ' dona sotildi'} />
        <InfoCard id="cogs"
          color="bg-orange-50 border-orange-500"
          label="📦 Tannarx (Sebestoyimost)"
          value={formatMoney(data.cogs)}
          valueColor="text-orange-700"
          subtitle="Xom ashyo qiymati" />
        <InfoCard id="gross"
          color="bg-blue-50 border-blue-500"
          label="💵 Yalpi foyda (Gross)"
          value={formatMoney(data.gross_profit)}
          valueColor={data.gross_profit >= 0 ? 'text-blue-700' : 'text-red-700'}
          subtitle={'Marja: ' + data.gross_margin.toFixed(1) + '%'} />
        <InfoCard id="expenses"
          color="bg-red-50 border-red-500"
          label="📉 Operatsion xarajatlar"
          value={formatMoney(data.total_expenses)}
          valueColor="text-red-700"
          subtitle="Ish haqi, kommunal va h.k." />
        <InfoCard id="other_income"
          color="bg-purple-50 border-purple-500"
          label="💰 Boshqa kirimlar"
          value={formatMoney(data.other_income)}
          valueColor="text-purple-700"
          subtitle="Sotuvdan tashqari" />
        <div className={'p-5 rounded-xl border-l-4 relative ' +
          (data.net_profit >= 0 ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-600' : 'bg-red-100 border-red-600')
        }>
          <div className="flex items-start justify-between">
            <p className="text-sm text-gray-700 font-semibold">⭐ Sof foyda (Net Profit)</p>
            <button onClick={() => setInfoCard('net')}
              className="w-6 h-6 rounded-full bg-white text-gray-500 hover:bg-bread-100 hover:text-bread-700 flex items-center justify-center font-bold text-sm border">
              ?
            </button>
          </div>
          <p className={'text-3xl font-bold mt-1 ' + (data.net_profit >= 0 ? 'text-green-800' : 'text-red-800')}>
            {formatMoney(data.net_profit)}
          </p>
          <p className="text-xs text-gray-700 mt-1">Sof marja: {data.net_margin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Info modal */}
      {infoCard && cardInfo[infoCard] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setInfoCard(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{cardInfo[infoCard].title}</h3>
              <button onClick={() => setInfoCard(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <p className="text-gray-700 mb-4">{cardInfo[infoCard].desc}</p>
            <div className="bg-blue-50 p-3 rounded-lg mb-3">
              <p className="text-xs text-blue-600 font-semibold mb-1">📐 FORMULA</p>
              <p className="font-mono text-blue-900">{cardInfo[infoCard].formula}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-700 font-semibold mb-1">💡 MISOL</p>
              <p className="text-sm text-gray-700">{cardInfo[infoCard].example}</p>
            </div>
            <button onClick={() => setInfoCard(null)}
              className="mt-4 w-full bg-bread-600 text-white py-2 rounded-lg hover:bg-bread-700">
              Tushundim
            </button>
          </div>
        </div>
      )}

      {/* P&L Vizual hisoboti - chiroyli ko'rinish */}
      <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xl font-bold text-gray-800">📊 Foyda-Zarar Hisoboti</h3>
          <span className={'px-4 py-1 rounded-full font-bold text-white ' +
            (data.net_profit >= 0 ? 'bg-green-600' : 'bg-red-600')
          }>
            {data.net_profit >= 0 ? '✓ FOYDA' : '✗ ZARAR'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-6">💡 Har bir blokni bosib, batafsil ma'lumotni ko'rishingiz mumkin</p>

        {/* Bosqich 1: Asosiy biznes (Sotuv → Tannarx = Yalpi foyda) */}
        <div className="mb-6">
          <p className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wide">1-bosqich: Asosiy biznes (sotuv)</p>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
            {/* Sotuv tushumi */}
            <button onClick={() => loadDetail('revenue')}
              className="md:col-span-2 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-4 text-left hover:shadow-lg hover:border-emerald-500 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl">📈</div>
                <p className="text-xs text-emerald-700 font-semibold uppercase">Sotuvdan tushum</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">{formatMoney(data.revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{data.units_sold} dona sotildi</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">→ Batafsil</p>
            </button>

            {/* Minus belgi */}
            <div className="text-center text-4xl font-bold text-gray-400">−</div>

            {/* Tannarx */}
            <button onClick={() => loadDetail('cogs')}
              className="md:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4 text-left hover:shadow-lg hover:border-orange-500 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">📦</div>
                <p className="text-xs text-orange-700 font-semibold uppercase">Tannarx (COGS)</p>
              </div>
              <p className="text-2xl font-bold text-orange-700">{formatMoney(data.cogs)}</p>
              <p className="text-xs text-gray-500 mt-1">Xom ashyo qiymati</p>
              <p className="text-xs text-orange-600 mt-2 font-medium">→ Batafsil</p>
            </button>

            {/* Teng belgi */}
            <div className="text-center text-4xl font-bold text-gray-400">=</div>

            {/* Yalpi foyda */}
            <div className={'md:col-span-1 rounded-xl p-4 border-2 ' +
              (data.gross_profit >= 0
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400'
                : 'bg-gradient-to-br from-red-50 to-red-100 border-red-400')
            }>
              <div className="flex items-center gap-1 mb-2">
                <div className={'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ' +
                  (data.gross_profit >= 0 ? 'bg-blue-500' : 'bg-red-500')
                }>{data.gross_profit >= 0 ? '💵' : '⚠'}</div>
                <p className={'text-xs font-semibold uppercase ' + (data.gross_profit >= 0 ? 'text-blue-700' : 'text-red-700')}>
                  Yalpi foyda
                </p>
              </div>
              <p className={'text-xl font-bold ' + (data.gross_profit >= 0 ? 'text-blue-700' : 'text-red-700')}>
                {formatMoney(data.gross_profit)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Marja: {data.gross_margin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Bosqich 2: Yalpi foyda + Boshqa kirimlar - Xarajatlar = Sof foyda */}
        <div className="mb-6">
          <p className="text-xs uppercase text-gray-500 font-semibold mb-2 tracking-wide">2-bosqich: Yakuniy hisob</p>
          <div className="grid grid-cols-1 md:grid-cols-9 gap-2 items-center text-sm">
            {/* Yalpi foyda */}
            <div className={'md:col-span-2 rounded-lg p-3 ' +
              (data.gross_profit >= 0 ? 'bg-blue-50' : 'bg-red-50')
            }>
              <p className="text-xs text-gray-500">Yalpi foyda</p>
              <p className={'font-bold ' + (data.gross_profit >= 0 ? 'text-blue-700' : 'text-red-700')}>
                {formatMoney(data.gross_profit)}
              </p>
            </div>

            <div className="text-center text-2xl font-bold text-purple-500">+</div>

            {/* Boshqa kirimlar */}
            <button onClick={() => loadDetail('other_income')}
              className="md:col-span-2 bg-purple-50 border border-purple-300 rounded-lg p-3 text-left hover:shadow-md hover:border-purple-500 transition-all">
              <p className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                💰 Boshqa kirimlar →
              </p>
              <p className="font-bold text-purple-700">+{formatMoney(data.other_income)}</p>
            </button>

            <div className="text-center text-2xl font-bold text-red-500">−</div>

            {/* Operatsion xarajatlar */}
            <button onClick={() => loadDetail('expenses')}
              className="md:col-span-2 bg-red-50 border border-red-300 rounded-lg p-3 text-left hover:shadow-md hover:border-red-500 transition-all">
              <p className="text-xs text-red-700 font-semibold flex items-center gap-1">
                📉 Xarajatlar →
              </p>
              <p className="font-bold text-red-700">-{formatMoney(data.total_expenses)}</p>
            </button>
          </div>
        </div>

        {/* SOF FOYDA - katta natija */}
        <div className={'rounded-2xl p-6 border-4 ' +
          (data.net_profit >= 0
            ? 'bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 border-green-500'
            : 'bg-gradient-to-r from-red-100 via-orange-100 to-red-100 border-red-500')
        }>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className={'w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg ' +
                (data.net_profit >= 0 ? 'bg-green-500' : 'bg-red-500')
              }>
                {data.net_profit >= 0 ? '⭐' : '⚠️'}
              </div>
              <div>
                <p className={'text-sm font-bold uppercase tracking-wider ' +
                  (data.net_profit >= 0 ? 'text-green-700' : 'text-red-700')
                }>
                  {data.net_profit >= 0 ? 'SOF FOYDA' : 'SOF ZARAR'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Net Profit (oxirgi natija)</p>
              </div>
            </div>
            <div className="text-right">
              <p className={'text-4xl font-extrabold ' +
                (data.net_profit >= 0 ? 'text-green-700' : 'text-red-700')
              }>
                {formatMoney(data.net_profit)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Sof marja: <span className="font-bold">{data.net_margin.toFixed(1)}%</span>
              </p>
            </div>
          </div>

          {/* Ogohlantirish/Maslahat */}
          {data.net_profit >= 0 ? (
            <div className="mt-4 p-3 bg-white bg-opacity-70 rounded-lg text-sm text-green-800">
              ✅ <strong>Yaxshi natija!</strong> Tanlangan davrda biznes foyda ko'rgan.
              {data.net_margin < 10 && " Lekin marja past — xarajatlarni kamaytirish yoki narxni oshirish haqida o'ylab ko'ring."}
              {data.net_margin >= 10 && data.net_margin < 20 && " Sof marja yaxshi darajada (10-20%)."}
              {data.net_margin >= 20 && " Marja juda yaxshi! Biznes barqaror foyda olmoqda."}
            </div>
          ) : (
            <div className="mt-4 p-3 bg-white bg-opacity-70 rounded-lg text-sm text-red-800">
              ⚠️ <strong>Diqqat!</strong> Biznes zarar ko'rmoqda.
              {data.gross_profit < 0 && " Asosiy muammo: tannarx tushumdan baland — mahsulot narxlarini ko'taring yoki xom ashyo arzonroq olib turing."}
              {data.gross_profit >= 0 && " Asosiy biznes foydali, lekin operatsion xarajatlar juda baland — ish haqi/ijara/kommunal xarajatlarni qaytadan ko'rib chiqing."}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4 sticky top-0 bg-white pb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {detailLoading || !detailModal.data ? 'Yuklanmoqda...' : detailModal.data.title}
                </h3>
                {detailModal.data && !detailModal.data.error && (
                  <p className="text-sm text-gray-500 mt-1">{detailModal.data.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">📅 Davr: {dateFrom} — {dateTo}</p>
              </div>
              <button onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-gray-700 text-3xl leading-none">×</button>
            </div>

            {detailLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-bread-600 mx-auto"></div>
              </div>
            ) : detailModal.data && detailModal.data.error ? (
              <p className="text-red-500 py-8 text-center">Ma'lumot yuklanmadi</p>
            ) : detailModal.data && detailModal.data.items.length === 0 ? (
              <p className="text-gray-400 py-12 text-center">Bu davr uchun ma'lumot yo'q</p>
            ) : detailModal.data && (
              <>
                {/* Kategoriya bo'yicha jamlanma (faqat expenses uchun) */}
                {detailModal.data.by_category && detailModal.data.by_category.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold mb-2">📊 Kategoriya bo'yicha taqsimot:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {detailModal.data.by_category.map((c, i) => (
                        <div key={i} className="p-2 bg-white rounded border text-sm">
                          <p className="text-gray-600 text-xs">{c.category}</p>
                          <p className="font-bold text-red-700">{formatMoney(c.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-16">
                    <tr>
                      {detailModal.data.columns.map((col, i) => (
                        <th key={i} className={'p-3 text-sm font-medium text-gray-600 ' +
                          (i === detailModal.data.columns.length - 1 ? 'text-right' : 'text-left')}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.data.items.map((item, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        {detailModal.type === 'revenue' && (
                          <>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-blue-700">{item.qty} dona</td>
                            <td className="p-3 text-right font-semibold text-emerald-700">{formatMoney(item.amount)}</td>
                          </>
                        )}
                        {detailModal.type === 'cogs' && (
                          <>
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-blue-700">{item.qty} dona</td>
                            <td className="p-3 text-orange-700">{formatMoney(item.unit_cost)}</td>
                            <td className="p-3 text-right font-semibold text-red-700">{formatMoney(item.amount)}</td>
                          </>
                        )}
                        {(detailModal.type === 'other_income' || detailModal.type === 'expenses') && (
                          <>
                            <td className="p-3 text-sm">{new Date(item.date).toLocaleString('uz-UZ')}</td>
                            <td className="p-3"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{item.category}</span></td>
                            <td className="p-3 text-sm">{item.cash}</td>
                            <td className="p-3 text-sm text-gray-600">{item.note}</td>
                            <td className={'p-3 text-right font-semibold ' +
                              (detailModal.type === 'other_income' ? 'text-emerald-700' : 'text-red-700')}>
                              {detailModal.type === 'other_income' ? '+' : '-'}{formatMoney(item.amount)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2">
                    <tr className="font-bold">
                      <td className="p-3" colSpan={detailModal.data.columns.length - 1}>📊 JAMI</td>
                      <td className={'p-3 text-right text-lg ' +
                        (detailModal.type === 'revenue' ? 'text-emerald-700' :
                         detailModal.type === 'other_income' ? 'text-purple-700' :
                         'text-red-700')}>
                        {formatMoney(detailModal.data.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}

            <button onClick={() => setDetailModal(null)}
              className="mt-4 w-full bg-bread-600 text-white py-2 rounded-lg hover:bg-bread-700">
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Xarajatlar kategoriya bo'yicha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Xarajatlar kategoriya bo'yicha</h3>
          {data.expenses_by_category.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.expenses_by_category} dataKey="total" nameKey="category"
                  cx="50%" cy="50%" outerRadius={100} label={(e) => e.category}>
                  {data.expenses_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">Xarajatlar yo'q</p>}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Oylik xarajat dinamikasi (6 oy)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthly_expenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month_label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : (v/1000).toFixed(0) + 'k'} />
              <Tooltip formatter={(v) => formatMoney(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Tushum" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" name="Xarajat" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// === Asosiy komponent ===
export default function Accounting() {
  const [tab, setTab] = useState('cash');
  const tabs = [
    { id: 'cash', label: 'Kassalar', icon: MdAccountBalanceWallet },
    { id: 'transactions', label: 'Tranzaksiyalar', icon: MdSwapHoriz },
    { id: 'categories', label: 'Kategoriyalar', icon: MdCategory },
    { id: 'suppliers', label: 'Yetkazib beruvchilar / Qarzdorlar', icon: MdPeople },
    { id: 'pl', label: 'Foyda-Zarar (P&L)', icon: MdAssessment },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Moliya — Boshqaruvchi hamyoni</h1>
      <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ' +
              (tab === t.id ? 'bg-bread-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'cash' && <CashRegisters />}
      {tab === 'transactions' && <Transactions />}
      {tab === 'categories' && <Categories />}
      {tab === 'suppliers' && <Suppliers />}
      {tab === 'pl' && <ProfitLoss />}
    </div>
  );
}

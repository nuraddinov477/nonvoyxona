import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MdShoppingCart, MdDelete, MdAdd, MdRemove, MdHistory,
  MdReportProblem, MdAssessment, MdPerson, MdAttachMoney,
  MdSearch, MdFileDownload, MdPrint
} from 'react-icons/md';
import { downloadExcel, printReceipt } from '../../utils/exports';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { formatMoney, todayStr, daysAgoStr, CHART_COLORS as COLORS, getErrorMessage } from '../../utils/helpers';

// === Tezkor sotuv ===
function QuickSale() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState('cash');
  const [loading, setLoading] = useState(false);

  const loadStock = useCallback(() => {
    api.get('/production/stock/').then(r => setProducts(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { loadStock(); }, [loadStock]);

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error("Bu mahsulot omborda yo'q!");
      return;
    }
    const existing = cart.find(c => c.product_id === product.product);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error('Omborda yetarli emas!');
        return;
      }
      setCart(cart.map(c => c.product_id === product.product ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        product_id: product.product,
        name: product.product_name,
        price: parseFloat(product.product_price),
        quantity: 1,
        stock: product.quantity,
      }]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map(c => {
      if (c.product_id === productId) {
        const newQty = c.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > c.stock) {
          toast.error('Omborda yetarli emas!');
          return c;
        }
        return { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => setCart(cart.filter(c => c.product_id !== productId));

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleSale = async () => {
    if (cart.length === 0) return toast.error("Savat bo'sh");
    setLoading(true);
    try {
      await api.post('/trade/sales/', {
        payment_type: paymentType,
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
      });
      toast.success('Sotuv amalga oshirildi! ' + formatMoney(total));
      setCart([]);
      loadStock();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mahsulotlar</h2>
          <span className="text-sm text-gray-500">⚠ Faqat omborda mavjud mahsulotlar sotiladi</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              disabled={p.quantity <= 0}
              className={'bg-white rounded-xl p-4 shadow-sm border-2 text-left transition-all hover:shadow-md ' +
                (p.quantity <= 0 ? 'opacity-50 cursor-not-allowed border-gray-200' :
                 p.quantity < 20 ? 'border-red-200 hover:border-red-400' :
                 'border-gray-200 hover:border-bread-300')}>
              <h3 className="font-semibold">{p.product_name}</h3>
              <p className="text-bread-600 font-bold text-lg">{formatMoney(p.product_price)}</p>
              <p className={'text-xs mt-1 ' + (p.quantity <= 0 ? 'text-red-500' : p.quantity < 20 ? 'text-orange-500' : 'text-gray-500')}>
                Qoldiq: {p.quantity} dona
              </p>
            </button>
          ))}
          {products.length === 0 && (
            <p className="col-span-3 text-center text-gray-400 py-8">Omborda mahsulot yo'q</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border h-fit sticky top-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdShoppingCart /> Savat ({cart.length})
        </h2>
        {cart.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Savat bo'sh</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {cart.map(c => (
              <div key={c.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{formatMoney(c.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(c.product_id, -1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                    <MdRemove size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold">{c.quantity}</span>
                  <button onClick={() => updateQty(c.product_id, 1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300">
                    <MdAdd size={16} />
                  </button>
                  <button onClick={() => removeFromCart(c.product_id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded ml-1">
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Jami:</span>
            <span className="text-2xl font-bold text-bread-700">{formatMoney(total)}</span>
          </div>

          <p className="text-xs text-gray-500 mb-2">To'lov turi:</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { value: 'cash', label: '💵 Naqd' },
              { value: 'terminal', label: '💳 Terminal' },
              { value: 'click', label: '📱 Click' },
              { value: 'payme', label: '📱 Payme' },
            ].map(pt => (
              <button key={pt.value} onClick={() => setPaymentType(pt.value)}
                className={'py-2 rounded-lg text-sm font-medium transition-colors ' +
                  (paymentType === pt.value ? 'bg-bread-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }>
                {pt.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-red-500 mb-2 text-center">⚠ Qarz tugmasi yo'q — to'lov to'liq qabul qilingach tugaydi</p>

          <button onClick={handleSale} disabled={loading || cart.length === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Kutib turing...' : 'Sotish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === Sotuvlar tarixi ===
function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    api.get('/trade/sales/').then(r => setSales(r.data.results || r.data)).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (paymentFilter && s.payment_type !== paymentFilter) return false;
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.date) > new Date(dateTo + 'T23:59:59')) return false;
      if (search) {
        const q = search.toLowerCase();
        const hit = ('#' + s.id).includes(q) ||
                    (s.seller_name || '').toLowerCase().includes(q) ||
                    String(s.total_amount).includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [sales, search, paymentFilter, dateFrom, dateTo]);

  const totalSum = filtered.reduce((s, x) => s + parseFloat(x.total_amount || 0), 0);

  const handleExport = () => {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    downloadExcel('/trade/export/sales/', `sotuvlar_${dateFrom || 'all'}_${dateTo || 'all'}.xlsx`, params);
  };

  return (
    <div>
      {/* Filter panel */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" />
            <input placeholder="Qidirish (chek №, sotuvchi, summa)..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded-lg pl-10 pr-3 py-2 w-full" />
          </div>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
            className="border rounded-lg px-3 py-2">
            <option value="">Barcha to'lovlar</option>
            <option value="cash">Naqd</option>
            <option value="terminal">Terminal</option>
            <option value="click">Click</option>
            <option value="payme">Payme</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2" placeholder="Dan" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2" placeholder="Gacha" />
        </div>
        <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
          <div className="text-sm text-gray-600">
            Topildi: <b>{filtered.length}</b> sotuv · Jami: <b className="text-bread-700">{formatMoney(totalSum)}</b>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            <MdFileDownload /> Excel'ga yuklash
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">#</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sotuvchi</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">To'lov</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Summa</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">Chek</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-gray-500">#{s.id}</td>
                <td className="p-3">{new Date(s.date).toLocaleString('uz-UZ')}</td>
                <td className="p-3">{s.seller_name || '-'}</td>
                <td className="p-3">
                  <span className={'px-2 py-1 text-xs rounded-full ' +
                    (s.payment_type === 'cash' ? 'bg-green-100 text-green-700' :
                     s.payment_type === 'terminal' ? 'bg-blue-100 text-blue-700' :
                     'bg-purple-100 text-purple-700')}>{s.payment_type_display}</span>
                </td>
                <td className="p-3 text-right font-semibold">{formatMoney(s.total_amount)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => printReceipt(s)}
                    className="text-bread-600 hover:bg-bread-50 px-2 py-1 rounded text-sm flex items-center gap-1 mx-auto">
                    <MdPrint /> Chop etish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            {sales.length === 0 ? "Sotuvlar tarixi bo'sh" : "Filterga mos sotuv topilmadi"}
          </p>
        )}
      </div>
    </div>
  );
}

// === Brak (sotilmagan/defektli) ===
function Brak() {
  const [unsold, setUnsold] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', reason: 'burnt', note: '' });

  const load = useCallback(() => {
    api.get('/trade/unsold/').then(r => setUnsold(r.data.results || r.data)).catch(() => {});
    api.get('/production/stock/').then(r => setProducts(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trade/unsold/', form);
      toast.success('Brakka yozildi (omborda kamaytirildi)');
      setShowAdd(false);
      setForm({ product: '', quantity: '', reason: 'burnt', note: '' });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const totalUnsold = unsold.reduce((s, u) => s + u.quantity, 0);

  const reasonLabels = {
    burnt: '🔥 Kuygan',
    deformed: '📐 Shakli buzilgan',
    expired: '⏱️ Muddati o\'tgan',
    returned: '↩️ Qaytarilgan',
    other: '❓ Boshqa',
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-sm text-gray-500">Jami brak</p>
          <p className="text-2xl font-bold mt-1 text-red-700">{totalUnsold} dona</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Jami yozuvlar</p>
          <p className="text-2xl font-bold mt-1">{unsold.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-sm text-gray-700">💡 Maslahat</p>
          <p className="text-xs text-gray-600 mt-1">
            Brak yozuvi qo'shilganda mahsulot avtomatik tayyor mahsulot omboridan chiqariladi
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MdReportProblem className="text-red-500" /> Brak (sotilmaydigan mahsulot)
        </h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          <MdAdd /> Brakka yozish
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-red-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.product} onChange={e => setForm({...form, product: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Mahsulot tanlang</option>
            {products.map(p => (
              <option key={p.id} value={p.product}>{p.product_name} ({p.quantity} dona)</option>
            ))}
          </select>
          <input type="number" placeholder="Miqdor (dona)" value={form.quantity}
            onChange={e => setForm({...form, quantity: e.target.value})}
            className="border rounded-lg px-3 py-2" required min="1" />
          <select value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="burnt">Kuygan</option>
            <option value="deformed">Shakli buzilgan</option>
            <option value="expired">Muddati o'tgan</option>
            <option value="returned">Qaytarilgan</option>
            <option value="other">Boshqa</option>
          </select>
          <button type="submit" className="bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700">
            Saqlash
          </button>
          <input placeholder="Izoh (ixtiyoriy)" value={form.note}
            onChange={e => setForm({...form, note: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-4" />
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Mahsulot</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Miqdor</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sabab</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {unsold.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{new Date(u.date).toLocaleString('uz-UZ')}</td>
                <td className="p-3 font-medium">{u.product_name}</td>
                <td className="p-3 text-right text-red-700 font-semibold">{u.quantity} dona</td>
                <td className="p-3">{reasonLabels[u.reason] || u.reason_display}</td>
                <td className="p-3 text-gray-500 text-sm">{u.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {unsold.length === 0 && (
          <p className="text-center text-gray-400 py-8">Brak yozuvlari yo'q</p>
        )}
      </div>
    </div>
  );
}

// === Hisobotlar ===
function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());

  const load = useCallback(() => {
    setLoading(true);
    api.get('/trade/reports/?date_from=' + dateFrom + '&date_to=' + dateTo)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <p className="text-gray-500 text-center py-8">Yuklanmoqda...</p>;
  if (!data) return <p className="text-gray-500">Ma'lumot yo'q</p>;

  const cashData = (data.cash_report || []).filter(c => c.amount > 0);
  const summary = data.summary || { total_amount: 0, total_sales_count: 0, total_units_sold: 0 };

  return (
    <div className="space-y-6">
      {/* Sana tanlash */}
      <div className="bg-white rounded-xl p-4 shadow-sm border flex flex-wrap items-center gap-3">
        <span className="font-medium">Davr:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border rounded-lg px-3 py-2" max={dateTo} />
        <span>—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border rounded-lg px-3 py-2" min={dateFrom} max={todayStr()} />
        <div className="flex gap-2 ml-auto">
          <button onClick={() => { setDateFrom(todayStr()); setDateTo(todayStr()); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">Bugun</button>
          <button onClick={() => { setDateFrom(daysAgoStr(6)); setDateTo(todayStr()); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">7 kun</button>
          <button onClick={() => { setDateFrom(daysAgoStr(29)); setDateTo(todayStr()); }}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">30 kun</button>
        </div>
      </div>

      {/* Umumiy statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
          <p className="text-sm text-gray-500">Jami tushum</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatMoney(summary.total_amount)}</p>
        </div>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
          <p className="text-sm text-gray-500">Sotuvlar soni</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{summary.total_sales_count} ta</p>
        </div>
        <div className="bg-bread-50 p-5 rounded-xl border border-bread-200">
          <p className="text-sm text-gray-500">Sotilgan dona</p>
          <p className="text-2xl font-bold text-bread-700 mt-1">{summary.total_units_sold} dona</p>
        </div>
      </div>

      {/* Kassa hisoboti */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdAttachMoney className="text-emerald-600" /> Kassa hisoboti (to'lov turlari)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {(data.cash_report || []).map(c => (
              <div key={c.type} className={'flex items-center justify-between p-3 mb-2 rounded-lg border-l-4 ' +
                (c.type === 'cash' ? 'bg-emerald-50 border-emerald-500' :
                 c.type === 'terminal' ? 'bg-blue-50 border-blue-500' :
                 c.type === 'click' ? 'bg-purple-50 border-purple-500' :
                 'bg-pink-50 border-pink-500')}>
                <div>
                  <p className="font-semibold">{c.label}</p>
                  <p className="text-sm text-gray-500">{c.count} ta sotuv</p>
                </div>
                <p className="text-lg font-bold">{formatMoney(c.amount)}</p>
              </div>
            ))}
          </div>
          {cashData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={cashData} dataKey="amount" nameKey="label"
                  cx="50%" cy="50%" outerRadius={90} label={(e) => e.label}>
                  {cashData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top mahsulotlar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">🏆 Top mahsulotlar</h3>
        {(data.top_products || []).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="product__name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(v) => v + ' dona'} />
                <Bar dataKey="total_sold" name="Sotilgan" fill="#d6802a" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
            <div className="overflow-auto max-h-[350px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-sm font-medium text-gray-600">#</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-600">Mahsulot</th>
                    <th className="text-right p-2 text-sm font-medium text-gray-600">Sotildi</th>
                    <th className="text-right p-2 text-sm font-medium text-gray-600">Tushum</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products.map((p, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-2 text-gray-500">{i + 1}</td>
                      <td className="p-2 font-medium">{p.product__name}</td>
                      <td className="p-2 text-right font-semibold text-blue-700">{p.total_sold}</td>
                      <td className="p-2 text-right text-emerald-700">{formatMoney(p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Bu davr uchun ma'lumot yo'q</p>
        )}
      </div>

      {/* Sotuvchilar unumdorligi */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdPerson className="text-purple-600" /> Sotuvchilar unumdorligi
        </h3>
        {(data.sellers_report || []).length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Sotuvchi</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Sotuvlar</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Sotilgan dona</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Tushum</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">O'rtacha chek</th>
              </tr>
            </thead>
            <tbody>
              {data.sellers_report.map((s, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                        {(s.full_name || '?')[0].toUpperCase()}
                      </div>
                      {s.full_name}
                    </div>
                  </td>
                  <td className="p-3 text-right">{s.sales_count}</td>
                  <td className="p-3 text-right font-semibold">{s.units_sold || 0} dona</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{formatMoney(s.total_revenue)}</td>
                  <td className="p-3 text-right text-gray-500">
                    {formatMoney(s.sales_count > 0 ? s.total_revenue / s.sales_count : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-center py-8">Sotuvchilar uchun ma'lumot yo'q</p>
        )}
      </div>

      {/* Soatlik sotuv */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">📊 Soatlik sotuv (faolligi)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v, name) => name === 'Tushum' ? formatMoney(v) : v + ' ta'} />
            <Legend />
            <Bar dataKey="amount" name="Tushum" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Brak xulosasi */}
      {data.unsold_total > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdReportProblem className="text-red-500" /> Brak (jami: {data.unsold_total} dona)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(data.unsold_by_reason || []).map(u => (
              <div key={u.reason} className="p-3 bg-red-50 rounded-lg text-center border border-red-100">
                <p className="text-xs text-gray-600">{u.label}</p>
                <p className="text-xl font-bold text-red-700 mt-1">{u.total} dona</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Trade() {
  const [tab, setTab] = useState('sale');
  const tabs = [
    { id: 'sale', label: 'Tezkor sotuv', icon: MdShoppingCart },
    { id: 'history', label: 'Sotuvlar tarixi', icon: MdHistory },
    { id: 'brak', label: 'Brak', icon: MdReportProblem },
    { id: 'reports', label: 'Hisobotlar', icon: MdAssessment },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Savdo</h1>
      <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ' +
              (tab === t.id ? 'bg-bread-600 text-white' : 'text-gray-600 hover:bg-gray-100')}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'sale' && <QuickSale />}
      {tab === 'history' && <SalesHistory />}
      {tab === 'brak' && <Brak />}
      {tab === 'reports' && <Reports />}
    </div>
  );
}

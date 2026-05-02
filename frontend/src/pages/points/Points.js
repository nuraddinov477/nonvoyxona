import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MdAdd, MdSend, MdCheck, MdLocalShipping, MdStorefront,
  MdAssignmentReturn, MdWarning,
  MdPerson, MdClose, MdLocationOn, MdPhone
} from 'react-icons/md';

import { formatMoney, todayStr, getErrorMessage } from '../../utils/helpers';

// === Nuqtalar ro'yxati ===
function PointsList({ onSelectPoint }) {
  const [points, setPoints] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const load = useCallback(() => {
    api.get('/points/sales-points/').then(r => setPoints(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/points/sales-points/', form);
      toast.success("Nuqta qo'shildi");
      setShowAdd(false);
      setForm({ name: '', address: '', phone: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Sotuv nuqtalari ({points.length})</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
          <MdAdd /> Yangi nuqta
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Nuqta nomi" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <input placeholder="Manzil" value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <div className="flex gap-2">
            <input placeholder="Telefon" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              className="border rounded-lg px-3 py-2 flex-1" />
            <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">Saqlash</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {points.map(p => (
          <button key={p.id} onClick={() => onSelectPoint(p)}
            className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md hover:border-bread-300 transition-all text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-bread-100 rounded-lg">
                <MdStorefront size={24} className="text-bread-600" />
              </div>
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MdLocationOn size={14} /> {p.address}
                </p>
              </div>
            </div>
            {p.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MdPhone size={14} /> {p.phone}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">Xodimlar: {p.employee_count}</p>
            <p className="text-xs text-bread-600 mt-2 font-medium">→ Batafsil ko'rish</p>
          </button>
        ))}
      </div>
      {points.length === 0 && (
        <p className="text-center text-gray-400 py-8">Nuqtalar yo'q</p>
      )}
    </div>
  );
}

// === Nuqta batafsil (kartochka) ===
function PointDetail({ point, onClose }) {
  const [stock, setStock] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [planFact, setPlanFact] = useState(null);
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [activeView, setActiveView] = useState('stock');

  useEffect(() => {
    api.get('/points/sales-points/' + point.id + '/stock/').then(r => setStock(r.data)).catch(() => {});
    api.get('/points/sales-points/' + point.id + '/employees/').then(r => setEmployees(r.data)).catch(() => {});
  }, [point.id]);

  useEffect(() => {
    api.get('/points/sales-points/' + point.id + '/plan_fact/?date_from=' + dateFrom + '&date_to=' + dateTo)
      .then(r => setPlanFact(r.data)).catch(() => {});
  }, [point.id, dateFrom, dateTo]);

  const totalStock = stock.reduce((s, x) => s + x.quantity, 0);
  const stockValue = stock.reduce((s, x) => s + x.quantity * parseFloat(x.product_price || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-start sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-bread-100 rounded-xl">
              <MdStorefront size={32} className="text-bread-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{point.name}</h2>
              <p className="text-gray-500 flex items-center gap-1"><MdLocationOn size={16} /> {point.address}</p>
              {point.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MdPhone size={14} /> {point.phone}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <MdClose size={24} />
          </button>
        </div>

        {/* Mas'ul shaxslar */}
        <div className="p-5 border-b bg-gray-50">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MdPerson className="text-purple-600" /> Mas'ul shaxslar
          </h3>
          {employees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {employees.map(e => (
                <div key={e.id} className="flex items-center gap-2 bg-white p-2 px-3 rounded-lg border">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                    {(e.first_name || e.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{e.first_name} {e.last_name}</p>
                    {e.phone && <p className="text-xs text-gray-500">{e.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Hech kim biriktirilmagan</p>
          )}
        </div>

        {/* Tab tugmalari */}
        <div className="px-5 pt-4 flex gap-2 border-b">
          <button onClick={() => setActiveView('stock')}
            className={'px-4 py-2 rounded-t-lg font-medium ' +
              (activeView === 'stock' ? 'bg-bread-100 text-bread-700' : 'text-gray-600 hover:bg-gray-100')}>
            Ombor qoldig'i ({stock.length})
          </button>
          <button onClick={() => setActiveView('planFact')}
            className={'px-4 py-2 rounded-t-lg font-medium ' +
              (activeView === 'planFact' ? 'bg-bread-100 text-bread-700' : 'text-gray-600 hover:bg-gray-100')}>
            Plan-fakt
          </button>
        </div>

        {/* Ombor */}
        {activeView === 'stock' && (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-bread-50 rounded-lg">
                <p className="text-xs text-gray-500">Jami dona</p>
                <p className="text-xl font-bold text-bread-700">{totalStock}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-xs text-gray-500">Jami qiymat</p>
                <p className="text-xl font-bold text-emerald-700">{formatMoney(stockValue)}</p>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Mahsulot</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">Qoldiq</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">Narx</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">Qiymat</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{s.product_name}</td>
                    <td className={'p-3 text-right font-semibold ' +
                      (s.quantity < 10 ? 'text-red-600' : s.quantity < 30 ? 'text-orange-600' : 'text-green-600')}>
                      {s.quantity} dona
                    </td>
                    <td className="p-3 text-right">{formatMoney(s.product_price)}</td>
                    <td className="p-3 text-right font-semibold">{formatMoney(s.quantity * parseFloat(s.product_price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stock.length === 0 && (
              <p className="text-center text-gray-400 py-8">Omborda mahsulot yo'q</p>
            )}
          </div>
        )}

        {/* Plan-fakt */}
        {activeView === 'planFact' && (
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="font-medium">Davr:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="border rounded-lg px-3 py-2" max={dateTo} />
              <span>—</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="border rounded-lg px-3 py-2" min={dateFrom} max={todayStr()} />
            </div>

            {planFact ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Jo'natildi</p>
                    <p className="text-xl font-bold text-blue-700">{planFact.totals.sent}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Sotildi</p>
                    <p className="text-xl font-bold text-emerald-700">{planFact.totals.sold}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Qaytarildi</p>
                    <p className="text-xl font-bold text-orange-700">{planFact.totals.returned}</p>
                  </div>
                  <div className="p-3 bg-bread-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Qoldiq</p>
                    <p className="text-xl font-bold text-bread-700">{planFact.totals.current_stock}</p>
                  </div>
                  <div className={'p-3 rounded-lg text-center ' +
                    (planFact.totals.shortage > 0 ? 'bg-red-50 border border-red-300' : 'bg-green-50 border border-green-200')}>
                    <p className="text-xs text-gray-500">Kamomat</p>
                    <p className={'text-xl font-bold ' + (planFact.totals.shortage > 0 ? 'text-red-700' : 'text-green-700')}>
                      {planFact.totals.shortage}
                    </p>
                  </div>
                </div>

                {planFact.totals.shortage > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <MdWarning className="text-red-600" size={24} />
                    <p className="text-red-700">
                      ⚠ <strong>Kamomat aniqlandi!</strong> Jo'natilgan {planFact.totals.sent} dona,
                      lekin sotilgan + qaytim + qoldiq = {planFact.totals.sold + planFact.totals.returned + planFact.totals.current_stock}.
                      Yo'qolgan: <strong>{planFact.totals.shortage} dona</strong>
                    </p>
                  </div>
                )}

                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-gray-600">Mahsulot</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Jo'natildi</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Sotildi</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Qaytdi</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Qoldiq</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-600">Kamomat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planFact.items.map(item => (
                      <tr key={item.product_id} className={'border-t ' + (item.has_shortage ? 'bg-red-50' : 'hover:bg-gray-50')}>
                        <td className="p-3 font-medium">{item.product_name}</td>
                        <td className="p-3 text-right text-blue-700 font-semibold">{item.sent}</td>
                        <td className="p-3 text-right text-emerald-700 font-semibold">{item.sold}</td>
                        <td className="p-3 text-right text-orange-700">{item.returned}</td>
                        <td className="p-3 text-right text-bread-700">{item.current_stock}</td>
                        <td className={'p-3 text-right font-bold ' +
                          (item.shortage > 0 ? 'text-red-700' : 'text-green-700')}>
                          {item.has_shortage ? '⚠ ' : '✓ '}{item.shortage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {planFact.items.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Bu davr uchun ma'lumot yo'q</p>
                )}

                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  💰 Jami tushum: <strong className="text-emerald-700">{formatMoney(planFact.totals.revenue)}</strong>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-400 py-8">Yuklanmoqda...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// === Jo'natishlar (Transfer) ===
function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [points, setPoints] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ point_id: '', items: [{ product_id: '', quantity: '' }], note: '' });

  const load = useCallback(() => {
    api.get('/points/transfers/').then(r => setTransfers(r.data.results || r.data)).catch(() => {});
    api.get('/points/sales-points/').then(r => setPoints(r.data.results || r.data)).catch(() => {});
    api.get('/production/stock/').then(r => setProducts(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const addItem = () => setForm({...form, items: [...form.items, { product_id: '', quantity: '' }]});
  const removeItem = (i) => setForm({...form, items: form.items.filter((_, idx) => idx !== i)});
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({...form, items});
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await api.post('/points/transfers/', form);
      toast.success("Mahsulot jo'natildi (yo'lda)");
      setShowAdd(false);
      setForm({ point_id: '', items: [{ product_id: '', quantity: '' }], note: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Xatolik'); }
  };

  const handleAccept = async (id) => {
    try {
      await api.post('/points/transfers/' + id + '/accept/');
      toast.success('Qabul qilindi - mahsulot nuqta omboriga o\'tdi');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const inTransitCount = transfers.filter(t => t.status === 'in_transit').length;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Jami jo'natmalar</p>
          <p className="text-2xl font-bold mt-1">{transfers.length}</p>
        </div>
        <div className={'p-4 rounded-xl border ' + (inTransitCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white')}>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MdLocalShipping /> Yo'lda
          </p>
          <p className={'text-2xl font-bold mt-1 ' + (inTransitCount > 0 ? 'text-yellow-700' : '')}>
            {inTransitCount}
          </p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <p className="text-sm text-gray-500">Qabul qilingan</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">
            {transfers.filter(t => t.status === 'accepted').length}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Mahsulot jo'natish (nakladnoy)</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
          <MdSend /> Yangi nakladnoy
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSend} className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="mb-3">
            <select value={form.point_id} onChange={e => setForm({...form, point_id: e.target.value})}
              className="border rounded-lg px-3 py-2 w-full" required>
              <option value="">Qaysi nuqtaga?</option>
              {points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {form.items.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                className="border rounded-lg px-3 py-2 flex-1" required>
                <option value="">Mahsulot tanlang</option>
                {products.map(p => (
                  <option key={p.id} value={p.product}>{p.product_name} (omborda: {p.quantity})</option>
                ))}
              </select>
              <input type="number" placeholder="Miqdori" value={item.quantity}
                onChange={e => updateItem(i, 'quantity', e.target.value)}
                className="border rounded-lg px-3 py-2 w-32" required min="1" />
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)}
                  className="text-red-500 px-3 hover:bg-red-50 rounded">X</button>
              )}
            </div>
          ))}
          <input placeholder="Izoh (ixtiyoriy)" value={form.note}
            onChange={e => setForm({...form, note: e.target.value})}
            className="border rounded-lg px-3 py-2 w-full mt-2" />
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={addItem}
              className="text-bread-600 hover:underline text-sm">+ Mahsulot qo'shish</button>
            <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2 ml-auto">
              📋 Nakladnoyni yuborish
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">№</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Nuqta</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Mahsulotlar</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">Holat</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">Amal</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-sm text-gray-500">№{t.id}</td>
                <td className="p-3 font-medium">{t.point_name}</td>
                <td className="p-3 text-sm text-gray-600">
                  {(t.items || []).map(i => i.product_name + ' (' + i.quantity + ')').join(', ')}
                </td>
                <td className="p-3 text-sm">{new Date(t.date).toLocaleString('uz-UZ')}</td>
                <td className="p-3 text-center">
                  <span className={'px-3 py-1 text-xs rounded-full inline-flex items-center gap-1 ' +
                    (t.status === 'in_transit' ? 'bg-yellow-100 text-yellow-700' :
                    t.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                  }>
                    {t.status === 'in_transit' && <MdLocalShipping size={14} />}
                    {t.status === 'accepted' && <MdCheck size={14} />}
                    {t.status_display}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {t.status === 'in_transit' && (
                    <button onClick={() => handleAccept(t.id)}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-lg text-sm mx-auto hover:bg-green-700">
                      <MdCheck /> Qabul qilish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transfers.length === 0 && (
          <p className="text-center text-gray-400 py-8">Jo'natmalar yo'q</p>
        )}
      </div>
    </div>
  );
}

// === Qaytim (Returns) ===
function Returns() {
  const [returns, setReturns] = useState([]);
  const [points, setPoints] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ point: '', product: '', quantity: '', reason: '' });

  const load = useCallback(() => {
    api.get('/points/returns/').then(r => setReturns(r.data.results || r.data)).catch(() => {});
    api.get('/points/sales-points/').then(r => setPoints(r.data.results || r.data)).catch(() => {});
    api.get('/production/products/').then(r => setProducts(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/points/returns/', form);
      toast.success('Qaytim qayd qilindi (markaziy omborga qaytarildi)');
      setShowAdd(false);
      setForm({ point: '', product: '', quantity: '', reason: '' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const totalReturns = returns.reduce((s, r) => s + r.quantity, 0);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
          <p className="text-sm text-gray-500">Jami qaytim</p>
          <p className="text-2xl font-bold mt-1 text-orange-700">{totalReturns} dona</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Yozuvlar soni</p>
          <p className="text-2xl font-bold mt-1">{returns.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-sm text-gray-700">💡 Qaytim mantig'i</p>
          <p className="text-xs text-gray-600 mt-1">
            Nuqtadan qaytim qilingan mahsulot avtomatik ravishda nuqta omboridan chiqariladi va markaziy omborga qaytariladi.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MdAssignmentReturn className="text-orange-500" /> Qaytim (nuqtadan markazga)
        </h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <MdAdd /> Yangi qaytim
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-orange-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.point} onChange={e => setForm({...form, point: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Nuqta</option>
            {points.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.product} onChange={e => setForm({...form, product: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Mahsulot</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" placeholder="Miqdor" value={form.quantity}
            onChange={e => setForm({...form, quantity: e.target.value})}
            className="border rounded-lg px-3 py-2" required min="1" />
          <button type="submit" className="bg-orange-600 text-white rounded-lg px-4 py-2">Saqlash</button>
          <input placeholder="Sabab (ixtiyoriy)" value={form.reason}
            onChange={e => setForm({...form, reason: e.target.value})}
            className="border rounded-lg px-3 py-2 col-span-1 md:col-span-4" />
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Nuqta</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Mahsulot</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Miqdor</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sabab</th>
            </tr>
          </thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{new Date(r.date).toLocaleString('uz-UZ')}</td>
                <td className="p-3 font-medium">{r.point_name}</td>
                <td className="p-3">{r.product_name}</td>
                <td className="p-3 text-right text-orange-700 font-semibold">{r.quantity} dona</td>
                <td className="p-3 text-gray-600 text-sm">{r.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {returns.length === 0 && (
          <p className="text-center text-gray-400 py-8">Qaytim yozuvlari yo'q</p>
        )}
      </div>
    </div>
  );
}

// === Asosiy komponent ===
export default function Points() {
  const [tab, setTab] = useState('points');
  const [selectedPoint, setSelectedPoint] = useState(null);

  const tabs = [
    { id: 'points', label: 'Nuqtalar', icon: MdStorefront },
    { id: 'transfers', label: "Jo'natishlar (Nakladnoy)", icon: MdLocalShipping },
    { id: 'returns', label: 'Qaytim', icon: MdAssignmentReturn },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sotuv nuqtalari</h1>
      <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ' +
              (tab === t.id ? 'bg-bread-600 text-white' : 'text-gray-600 hover:bg-gray-100')
            }>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'points' && <PointsList onSelectPoint={setSelectedPoint} />}
      {tab === 'transfers' && <Transfers />}
      {tab === 'returns' && <Returns />}

      {selectedPoint && (
        <PointDetail point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      )}
    </div>
  );
}

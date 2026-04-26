import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MdAdd, MdInventory, MdReceipt, MdFactory, MdMenuBook,
  MdLocalShipping, MdStorefront, MdDelete, MdWarning, MdDashboard
} from 'react-icons/md';
import Dashboard from '../dashboard/Dashboard';

function formatMoney(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

// === Xom ashyo ombori ===
function RawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showIncome, setShowIncome] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCatAdd, setShowCatAdd] = useState(false);
  const [catForm, setCatForm] = useState({ name: '' });
  const [form, setForm] = useState({ name: '', category: '', unit: 'kg', min_quantity: 0, price_per_unit: 0 });
  const [incomeForm, setIncomeForm] = useState({ quantity: '', price_per_unit: '', supplier: '' });

  const load = useCallback(() => {
    api.get('/production/materials/').then(r => setMaterials(r.data.results || r.data)).catch(() => {});
    api.get('/production/categories/').then(r => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/materials/', form);
      toast.success("Xom ashyo qo'shildi");
      setShowAdd(false);
      setForm({ name: '', category: '', unit: 'kg', min_quantity: 0, price_per_unit: 0 });
      load();
    } catch (err) { toast.error('Xatolik'); }
  };

  const handleAddCat = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/categories/', catForm);
      toast.success("Kategoriya qo'shildi");
      setShowCatAdd(false);
      setCatForm({ name: '' });
      load();
    } catch (err) { toast.error('Xatolik'); }
  };

  const handleIncome = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/material-incomes/', {
        material: showIncome.id,
        quantity: incomeForm.quantity,
        price_per_unit: incomeForm.price_per_unit,
        supplier: incomeForm.supplier,
      });
      toast.success(showIncome.name + ' omborga kirim qilindi');
      setShowIncome(null);
      setIncomeForm({ quantity: '', price_per_unit: '', supplier: '' });
      load();
    } catch (err) { toast.error('Xatolik'); }
  };

  const lowCount = materials.filter(m => parseFloat(m.quantity) <= parseFloat(m.min_quantity)).length;
  const totalValue = materials.reduce((s, m) => s + parseFloat(m.quantity) * parseFloat(m.price_per_unit), 0);

  return (
    <div>
      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Jami xom ashyo</p>
          <p className="text-2xl font-bold mt-1">{materials.length} tur</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Ombor qiymati</p>
          <p className="text-2xl font-bold mt-1 text-bread-700">{formatMoney(totalValue)}</p>
        </div>
        <div className={'p-4 rounded-xl border shadow-sm ' + (lowCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white')}>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            {lowCount > 0 && <MdWarning className="text-red-500" />} Kam qolganlari
          </p>
          <p className={'text-2xl font-bold mt-1 ' + (lowCount > 0 ? 'text-red-600' : 'text-green-600')}>
            {lowCount} tur
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Xom ashyo ombori</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCatAdd(!showCatAdd)}
            className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm">
            <MdAdd /> Kategoriya
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
            <MdAdd /> Xom ashyo
          </button>
        </div>
      </div>

      {showCatAdd && (
        <form onSubmit={handleAddCat} className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-2">
          <input placeholder="Yangi kategoriya nomi" value={catForm.name}
            onChange={e => setCatForm({ name: e.target.value })}
            className="border rounded-lg px-3 py-2 flex-1" required />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">Saqlash</button>
        </form>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="Xom ashyo nomi" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="border rounded-lg px-3 py-2" required>
            <option value="">Kategoriya tanlang</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
            className="border rounded-lg px-3 py-2">
            <option value="kg">Kilogramm</option>
            <option value="litr">Litr</option>
            <option value="dona">Dona</option>
            <option value="paket">Paket</option>
          </select>
          <input type="number" step="0.01" placeholder="Min. miqdor (ogohlantirish)" value={form.min_quantity}
            onChange={e => setForm({...form, min_quantity: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <input type="number" placeholder="1 birlik narxi" value={form.price_per_unit}
            onChange={e => setForm({...form, price_per_unit: e.target.value})}
            className="border rounded-lg px-3 py-2" />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-4 py-2">Saqlash</button>
        </form>
      )}

      {/* Kirim modal */}
      {showIncome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              <MdLocalShipping className="inline text-bread-600" /> Omborga kirim: {showIncome.name}
            </h3>
            <form onSubmit={handleIncome} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Miqdori ({showIncome.unit})</label>
                <input type="number" step="0.001" placeholder="Miqdori" value={incomeForm.quantity}
                  onChange={e => setIncomeForm({...incomeForm, quantity: e.target.value})}
                  className="border rounded-lg px-3 py-2 w-full" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">Birlik narxi (so'm)</label>
                <input type="number" placeholder="Narxi" value={incomeForm.price_per_unit}
                  onChange={e => setIncomeForm({...incomeForm, price_per_unit: e.target.value})}
                  className="border rounded-lg px-3 py-2 w-full" required />
              </div>
              <div>
                <label className="text-sm text-gray-600">Yetkazib beruvchi</label>
                <input placeholder="Kompaniya yoki shaxs nomi" value={incomeForm.supplier}
                  onChange={e => setIncomeForm({...incomeForm, supplier: e.target.value})}
                  className="border rounded-lg px-3 py-2 w-full" />
              </div>
              {incomeForm.quantity && incomeForm.price_per_unit && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  Jami: <span className="font-bold text-blue-700">
                    {formatMoney(parseFloat(incomeForm.quantity) * parseFloat(incomeForm.price_per_unit))}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowIncome(null)}
                  className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Bekor</button>
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700">
                  Kirim qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Nomi</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Kategoriya</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Mavjud</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Min.</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Narxi</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">Holat</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">Amal</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(m => {
              const isLow = parseFloat(m.quantity) <= parseFloat(m.min_quantity);
              return (
                <tr key={m.id} className={'border-t ' + (isLow ? 'bg-red-50' : 'hover:bg-gray-50')}>
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3 text-gray-600">{m.category_name}</td>
                  <td className="p-3 text-right font-semibold">{m.quantity} {m.unit}</td>
                  <td className="p-3 text-right text-gray-500">{m.min_quantity} {m.unit}</td>
                  <td className="p-3 text-right">{formatMoney(m.price_per_unit)}</td>
                  <td className="p-3 text-center">
                    {isLow ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        ⚠ Kam!
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Yetarli
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => setShowIncome(m)}
                      className="text-bread-600 hover:bg-bread-50 px-3 py-1 rounded-lg text-sm">
                      + Kirim
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {materials.length === 0 && (
          <p className="text-center text-gray-400 py-8">Xom ashyolar yo'q</p>
        )}
      </div>
    </div>
  );
}

// === Mahsulotlar va Tayyor mahsulot ombori (birlashgan) ===
function ProductsAndStock() {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '' });

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
    } catch (err) { toast.error('Xatolik'); }
  };

  const totalUnits = products.reduce((s, p) => s + (p.stock_quantity || 0), 0);
  const totalValue = products.reduce((s, p) => s + (p.stock_quantity || 0) * parseFloat(p.price || 0), 0);
  const lowCount = products.filter(p => (p.stock_quantity || 0) < 30).length;

  return (
    <div>
      {/* Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Mahsulot turlari</p>
          <p className="text-2xl font-bold mt-1">{products.length}</p>
        </div>
        <div className="bg-bread-50 p-4 rounded-xl border border-bread-200 shadow-sm">
          <p className="text-sm text-gray-500">Omborda jami</p>
          <p className="text-2xl font-bold mt-1 text-bread-700">{totalUnits} dona</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-sm text-gray-500">Ombor qiymati</p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">{formatMoney(totalValue)}</p>
        </div>
        <div className={'p-4 rounded-xl border shadow-sm ' + (lowCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white')}>
          <p className="text-sm text-gray-500">Kam qolganlari</p>
          <p className={'text-2xl font-bold mt-1 ' + (lowCount > 0 ? 'text-red-600' : 'text-green-600')}>
            {lowCount}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          <MdStorefront className="inline text-bread-600" /> Mahsulotlar va tayyor mahsulot ombori
        </h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
          <MdAdd /> Yangi mahsulot
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-3 flex-wrap">
          <input placeholder="Mahsulot nomi" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" required />
          <input type="number" placeholder="Sotuv narxi (so'm)" value={form.price}
            onChange={e => setForm({...form, price: e.target.value})}
            className="border rounded-lg px-3 py-2 w-48" required />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">Saqlash</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => {
          const qty = p.stock_quantity || 0;
          const status = qty < 20 ? 'low' : qty < 60 ? 'mid' : 'high';
          const colors = {
            low: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
            mid: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
            high: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
          };
          const c = colors[status];
          const stockValue = qty * parseFloat(p.price || 0);
          return (
            <div key={p.id} className={'p-5 rounded-xl border-2 ' + c.bg + ' ' + c.border}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <MdReceipt className="text-bread-600" size={22} />
                  </div>
                  <h3 className="font-semibold text-gray-800">{p.name}</h3>
                </div>
                <span className={'text-xs px-2 py-1 rounded-full ' + c.badge}>
                  {status === 'low' ? '⚠ Kam' : status === 'mid' ? "O'rta" : '✓ Yetarli'}
                </span>
              </div>

              <div className="text-center my-4">
                <p className={'text-4xl font-bold ' + c.text}>{qty}</p>
                <p className="text-sm text-gray-500">dona omborda</p>
              </div>

              <div className="space-y-1 pt-3 border-t border-gray-200/50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sotuv narxi:</span>
                  <span className="font-semibold text-bread-700">{formatMoney(p.price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ombor qiymati:</span>
                  <span className="font-semibold">{formatMoney(stockValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Retsept:</span>
                  <span className="font-semibold">{p.recipes?.length || 0} ta xom ashyo</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {products.length === 0 && (
        <p className="text-center text-gray-400 py-8">Mahsulotlar yo'q</p>
      )}
    </div>
  );
}

// === Texnologik xarita (Recipe) ===
function Recipes() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ material: '', quantity_per_unit: '' });

  const load = useCallback(() => {
    api.get('/production/products/').then(r => {
      const data = r.data.results || r.data;
      setProducts(data);
      if (data.length && !selectedProduct) setSelectedProduct(data[0]);
    }).catch(() => {});
    api.get('/production/materials/').then(r => setMaterials(r.data.results || r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const refreshSelected = useCallback(() => {
    if (!selectedProduct) return;
    api.get('/production/products/' + selectedProduct.id + '/').then(r => setSelectedProduct(r.data)).catch(() => {});
  }, [selectedProduct]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/recipes/', {
        product: selectedProduct.id,
        material: form.material,
        quantity_per_unit: form.quantity_per_unit,
      });
      toast.success("Retseptga qo'shildi");
      setShowAdd(false);
      setForm({ material: '', quantity_per_unit: '' });
      refreshSelected();
      load();
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Xatolik');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ushbu xom ashyo retseptdan olib tashlansinmi?')) return;
    try {
      await api.delete('/production/recipes/' + id + '/');
      toast.success("O'chirildi");
      refreshSelected();
      load();
    } catch (err) { toast.error('Xatolik'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Mahsulotlar ro'yxati */}
      <div className="lg:col-span-1">
        <h3 className="font-semibold mb-3">Mahsulotlar</h3>
        <div className="space-y-1 max-h-[600px] overflow-auto">
          {products.map(p => (
            <button key={p.id} onClick={() => setSelectedProduct(p)}
              className={'w-full text-left p-3 rounded-lg transition-colors ' +
                (selectedProduct?.id === p.id
                  ? 'bg-bread-600 text-white'
                  : 'bg-white border hover:bg-gray-50')
              }>
              <div className="font-medium">{p.name}</div>
              <div className={'text-xs ' + (selectedProduct?.id === p.id ? 'text-bread-100' : 'text-gray-500')}>
                {p.recipes?.length || 0} ta xom ashyo
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Retsept */}
      <div className="lg:col-span-3">
        {selectedProduct ? (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-500">1 dona uchun retsept</p>
              </div>
              <button onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
                <MdAdd /> Xom ashyo qo'shish
              </button>
            </div>

            {showAdd && (
              <form onSubmit={handleAdd} className="bg-blue-50 p-4 border-b flex gap-3 flex-wrap">
                <select value={form.material} onChange={e => setForm({...form, material: e.target.value})}
                  className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" required>
                  <option value="">Xom ashyo tanlang</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
                <input type="number" step="0.0001" placeholder="1 dona uchun miqdor" value={form.quantity_per_unit}
                  onChange={e => setForm({...form, quantity_per_unit: e.target.value})}
                  className="border rounded-lg px-3 py-2 w-48" required />
                <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">
                  Qo'shish
                </button>
              </form>
            )}

            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-600">Xom ashyo</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">1 dona uchun</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">100 dona uchun</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-600">500 dona uchun</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-600">Amal</th>
                </tr>
              </thead>
              <tbody>
                {(selectedProduct.recipes || []).map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.material_name}</td>
                    <td className="p-3 text-right">{r.quantity_per_unit} {r.material_unit}</td>
                    <td className="p-3 text-right text-bread-700">
                      {(parseFloat(r.quantity_per_unit) * 100).toFixed(2)} {r.material_unit}
                    </td>
                    <td className="p-3 text-right font-semibold text-bread-800">
                      {(parseFloat(r.quantity_per_unit) * 500).toFixed(2)} {r.material_unit}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(r.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <MdDelete size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!selectedProduct.recipes || selectedProduct.recipes.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <MdMenuBook size={48} className="mx-auto mb-2 opacity-50" />
                <p>Retsept hali kiritilmagan</p>
                <p className="text-sm">"Xom ashyo qo'shish" tugmasini bosing</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-12">Mahsulot tanlang</p>
        )}
      </div>
    </div>
  );
}

// === Kunlik ishlab chiqarish ===
function DailyProd() {
  const [productions, setProductions] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], product: '', quantity: '' });

  const load = useCallback(() => {
    api.get('/production/daily-production/').then(r => setProductions(r.data.results || r.data)).catch(() => {});
    api.get('/production/products/').then(r => setProducts(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/production/daily-production/', form);
      toast.success('Ishlab chiqarish yozildi! Xom ashyolar avtomatik hisobdan chiqarildi.');
      setShowAdd(false);
      setForm({ date: new Date().toISOString().split('T')[0], product: '', quantity: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayCount = productions.filter(p => p.date === today).reduce((s, p) => s + p.quantity, 0);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Bugun ishlab chiqarilgan</p>
          <p className="text-2xl font-bold mt-1 text-bread-700">{todayCount} dona</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-gray-500">Jami yozuvlar</p>
          <p className="text-2xl font-bold mt-1">{productions.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-sm text-emerald-700">💡 Avtomatik hisob</p>
          <p className="text-xs text-emerald-600 mt-1">
            Ishlab chiqarish kiritilganda, retseptga ko'ra xom ashyolar omboridan chiqariladi
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Kunlik ishlab chiqarish akti</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-bread-600 text-white px-4 py-2 rounded-lg hover:bg-bread-700">
          <MdAdd /> Yangi yozuv
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-3 flex-wrap">
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
            className="border rounded-lg px-3 py-2" required />
          <select value={form.product} onChange={e => setForm({...form, product: e.target.value})}
            className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" required>
            <option value="">Mahsulot tanlang</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" placeholder="Pishirilgan miqdor (dona)" value={form.quantity}
            onChange={e => setForm({...form, quantity: e.target.value})}
            className="border rounded-lg px-3 py-2 w-48" required />
          <button type="submit" className="bg-green-600 text-white rounded-lg px-6 py-2">Saqlash</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Mahsulot</th>
              <th className="text-right p-3 text-sm font-medium text-gray-600">Miqdori</th>
              <th className="text-left p-3 text-sm font-medium text-gray-600">Novvoy</th>
              <th className="text-center p-3 text-sm font-medium text-gray-600">Holat</th>
            </tr>
          </thead>
          <tbody>
            {productions.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.date}</td>
                <td className="p-3 font-medium">{p.product_name}</td>
                <td className="p-3 text-right font-semibold text-bread-700">{p.quantity} dona</td>
                <td className="p-3 text-gray-600">{p.baker_name || '-'}</td>
                <td className="p-3 text-center">
                  {p.is_processed ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      ✓ Bajarildi
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      Kutilmoqda
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productions.length === 0 && (
          <p className="text-center text-gray-400 py-8">Yozuvlar yo'q</p>
        )}
      </div>
    </div>
  );
}

// === Asosiy komponent ===
export default function Production() {
  const [tab, setTab] = useState('dashboard');
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 'materials', label: 'Xom ashyo ombori', icon: MdInventory },
    { id: 'recipes', label: 'Texnologik xarita', icon: MdMenuBook },
    { id: 'production', label: 'Kunlik ishlab chiqarish', icon: MdFactory },
    { id: 'products', label: 'Mahsulotlar va ombor', icon: MdStorefront },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ' +
              (tab === t.id ? 'bg-bread-600 text-white' : 'text-gray-600 hover:bg-gray-100')
            }>
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'materials' && <RawMaterials />}
      {tab === 'recipes' && <Recipes />}
      {tab === 'production' && <DailyProd />}
      {tab === 'products' && <ProductsAndStock />}
    </div>
  );
}

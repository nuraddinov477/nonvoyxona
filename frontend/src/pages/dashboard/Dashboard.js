import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  MdTrendingUp, MdShoppingCart, MdFactory, MdAccountBalanceWallet,
  MdArrowUpward, MdArrowDownward, MdWarning, MdCalendarToday, MdPaid, MdInventory,
  MdPeople, MdPayment
} from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line, ComposedChart
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];

function formatMoney(amount) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + ' mln';
  if (amount >= 1_000) return Math.round(amount / 1_000) + 'k';
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

function formatMoneyFull(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={'p-3 rounded-xl ' + color}>
          <Icon size={24} className="text-white" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ' +
            (trend >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50')}>
            {trend >= 0 ? <MdArrowUpward size={16} /> : <MdArrowDownward size={16} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(daysAgoStr(6));
  const [dateTo, setDateTo] = useState(todayStr());

  const load = useCallback(() => {
    setLoading(true);
    api.get('/dashboard/?date_from=' + dateFrom + '&date_to=' + dateTo)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const setQuickRange = (days) => {
    setDateFrom(daysAgoStr(days - 1));
    setDateTo(todayStr());
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bread-600 mx-auto"></div>
          <p className="text-gray-500 mt-3">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Ma'lumot yuklanmadi</p>;

  // Default values - eski yoki noto'liq response uchun
  const today = data.today || { revenue: 0, sales_count: 0, units_sold: 0, production: 0 };
  const yesterday = data.yesterday || { revenue: 0, units_sold: 0, production: 0 };
  const cashBalances = data.cash_balances || [];
  const paymentBreakdown = data.payment_breakdown || [];
  const stock = data.stock || [];
  const lowMaterials = data.low_materials || [];
  const pointsStats = data.points_stats || [];
  const recentTxns = data.recent_transactions || [];
  const debtorsList = data.debtors_list || [];
  const creditorsList = data.creditors_list || [];
  const dailyBreakdown = data.daily_breakdown || [];
  const periodTopProducts = data.period_top_products || [];
  const expenseByCategory = data.expense_by_category || [];
  const monthlyExpenses = data.monthly_expenses || [];
  const hr = data.hr || { today_present: 0, total_active: 0, pending_salary: 0 };
  const ps = data.period_summary || {
    date_from: dateFrom, date_to: dateTo, days_count: 0,
    revenue: 0, units_sold: 0, production: 0,
    expense: 0, other_income: 0, profit: 0,
    avg_daily_revenue: 0, avg_daily_production: 0,
  };

  const revenueChange = yesterday.revenue > 0
    ? Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100)
    : 0;
  const totalCash = cashBalances.reduce((sum, c) => sum + parseFloat(c.balance), 0);
  const paymentData = paymentBreakdown.filter(p => p.amount > 0);

  return (
    <div>
      <div className="mb-6 flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Nonvoyxona biznes holati</p>
        </div>
      </div>

      {/* === Bugungi statistika === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Bugungi tushum" value={formatMoneyFull(today.revenue)}
          subtitle={'Kecha: ' + formatMoneyFull(yesterday.revenue)}
          icon={MdTrendingUp} color="bg-emerald-500" trend={revenueChange} />
        <StatCard title="Bugun sotilgan" value={(today.units_sold || 0) + ' dona'}
          subtitle={today.sales_count + ' ta sotuv'}
          icon={MdShoppingCart} color="bg-blue-500" />
        <StatCard title="Bugun ishlab chiqarildi" value={today.production + ' dona'}
          subtitle={'Kecha: ' + yesterday.production + ' dona'}
          icon={MdFactory} color="bg-bread-500" />
        <StatCard title="Jami kassa" value={formatMoneyFull(totalCash)}
          icon={MdAccountBalanceWallet} color="bg-purple-500" />
      </div>

      {/* === Sana oralig'i tanlash === */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <MdCalendarToday className="text-bread-600" size={20} /> Davr tanlang:
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border rounded-lg px-3 py-2" max={dateTo} />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border rounded-lg px-3 py-2" min={dateFrom} max={todayStr()} />
          <div className="flex gap-2 ml-auto flex-wrap">
            <button onClick={() => setQuickRange(1)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">Bugun</button>
            <button onClick={() => setQuickRange(7)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">7 kun</button>
            <button onClick={() => setQuickRange(14)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">14 kun</button>
            <button onClick={() => setQuickRange(30)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-bread-100 rounded-lg">30 kun</button>
          </div>
        </div>

        {/* Davr xulosasi */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-gray-500">Tushum</p>
            <p className="text-lg font-bold text-emerald-700">{formatMoneyFull(ps.revenue)}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500">Sotilgan</p>
            <p className="text-lg font-bold text-blue-700">{ps.units_sold} dona</p>
          </div>
          <div className="text-center p-3 bg-bread-50 rounded-lg">
            <p className="text-xs text-gray-500">Ishlab chiqarildi</p>
            <p className="text-lg font-bold text-bread-700">{ps.production} dona</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-500">Xarajat</p>
            <p className="text-lg font-bold text-red-700">{formatMoneyFull(ps.expense)}</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-500">Foyda</p>
            <p className={'text-lg font-bold ' + (ps.profit >= 0 ? 'text-purple-700' : 'text-red-700')}>
              {formatMoneyFull(ps.profit)}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Kunlik o'rtacha</p>
            <p className="text-lg font-bold text-gray-700">{formatMoneyFull(Math.round(ps.avg_daily_revenue))}</p>
          </div>
        </div>
      </div>

      {/* === Kunlik ishlab chiqarish vs sotuv grafigi === */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MdInventory className="text-bread-600" />
          Kunlik ishlab chiqarish va sotuv ({ps.days_count} kun)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={dailyBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day_short" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} label={{ value: 'Dona', angle: -90, position: 'insideLeft', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }}
              tickFormatter={v => formatMoney(v)}
              label={{ value: "So'm", angle: 90, position: 'insideRight', fontSize: 12 }} />
            <Tooltip formatter={(value, name) => name.includes('Tushum') ? formatMoneyFull(value) : value + ' dona'} />
            <Legend />
            <Bar yAxisId="left" dataKey="production" name="Ishlab chiqarildi" fill="#d6802a" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="units_sold" name="Sotildi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Tushum" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* === Foyda/Xarajat grafigi === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdPaid className="text-emerald-600" />
            Tushum vs Xarajat
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyBreakdown}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day_short" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatMoney(v)} />
              <Tooltip formatter={(v) => formatMoneyFull(v)} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Tushum" stroke="#22c55e" fill="url(#colorRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Xarajat" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">To'lov turlari (bugun)</h2>
          {paymentData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentData} dataKey="amount" nameKey="label"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoneyFull(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentData.map((p, i) => (
                  <div key={p.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                      <span className="text-gray-600">{p.label}</span>
                    </div>
                    <span className="font-medium">{formatMoneyFull(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">Bugun sotuv yo'q</p>
          )}
        </div>
      </div>

      {/* === Kunlik jadval (batafsil) === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">Kunlik batafsil hisobot</h2>
          <p className="text-sm text-gray-500 mt-1">{ps.date_from} dan {ps.date_to} gacha</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Sana</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Ishlab chiqarildi</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Sotildi</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Sotuvlar</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Tushum</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Xarajat</th>
                <th className="text-right p-3 text-sm font-medium text-gray-600">Foyda</th>
              </tr>
            </thead>
            <tbody>
              {dailyBreakdown.slice().reverse().map((d, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{d.day_short}</td>
                  <td className="p-3 text-right text-bread-700 font-semibold">{d.production} dona</td>
                  <td className="p-3 text-right text-blue-700 font-semibold">{d.units_sold} dona</td>
                  <td className="p-3 text-right text-gray-600">{d.sales_count}</td>
                  <td className="p-3 text-right text-emerald-700 font-semibold">{formatMoneyFull(d.revenue)}</td>
                  <td className="p-3 text-right text-red-700">{formatMoneyFull(d.expense)}</td>
                  <td className={'p-3 text-right font-bold ' + (d.profit >= 0 ? 'text-purple-700' : 'text-red-700')}>
                    {formatMoneyFull(d.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td className="p-3">Jami</td>
                <td className="p-3 text-right text-bread-700">{ps.production} dona</td>
                <td className="p-3 text-right text-blue-700">{ps.units_sold} dona</td>
                <td className="p-3 text-right text-gray-600">-</td>
                <td className="p-3 text-right text-emerald-700">{formatMoneyFull(ps.revenue)}</td>
                <td className="p-3 text-right text-red-700">{formatMoneyFull(ps.expense)}</td>
                <td className={'p-3 text-right ' + (ps.profit >= 0 ? 'text-purple-700' : 'text-red-700')}>
                  {formatMoneyFull(ps.profit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* === Top mahsulotlar (davr) + Xarajat kategoriyasi === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Top mahsulotlar (tanlangan davr)</h2>
          {periodTopProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={periodTopProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="product__name" type="category" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(v) => v + ' dona'} />
                <Bar dataKey="total_sold" name="Sotilgan" fill="#d6802a" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Ma'lumot yo'q</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Xarajatlar kategoriya bo'yicha</h2>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="total" nameKey="category"
                  cx="50%" cy="50%" outerRadius={100} label={(e) => e.category}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoneyFull(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">Xarajatlar yo'q</p>
          )}
        </div>
      </div>

      {/* === Oylik xarajat dinamikasi (6 oy) === */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4">📅 Oylik xarajatlar grafigi (oxirgi 6 oy)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyExpenses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month_label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatMoney(v)} />
            <Tooltip formatter={(v) => formatMoneyFull(v)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Tushum" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} />
            <Line type="monotone" dataKey="expense" name="Xarajat" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 text-sm text-gray-500 flex flex-wrap gap-4">
          <span>💡 Yashil chiziq — oylik tushum, qizil chiziq — oylik xarajat dinamikasi</span>
        </div>
      </div>

      {/* === Ombor + Kassalar === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Tayyor mahsulot ombori</h2>
          <div className="space-y-3 max-h-[300px] overflow-auto">
            {stock.map((s, i) => {
              const max = Math.max(...stock.map(x => x.quantity), 1);
              const pct = max > 0 ? (s.quantity / max) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{s.product__name}</span>
                    <span className="font-semibold">{s.quantity} dona</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all"
                      style={{ width: pct + '%',
                        backgroundColor: s.quantity < 30 ? '#ef4444' : s.quantity < 60 ? '#f59e0b' : '#22c55e'
                      }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Kassalar</h2>
          <div className="space-y-3">
            {cashBalances.map(cash => {
              const colors = {
                main: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
                terminal: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
                electronic: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
                expense: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
              };
              const c = colors[cash.type] || colors.main;
              return (
                <div key={cash.id} className={'flex items-center justify-between p-4 rounded-lg border-l-4 ' + c.bg + ' ' + c.border}>
                  <span className="text-gray-700 font-medium">{cash.name}</span>
                  <span className={'text-lg font-bold ' + c.text}>{formatMoneyFull(cash.balance)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* === Qarz holati === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-red-700">Qarzdorlar (bizga qarz)</h2>
          <div className="text-center p-3 bg-red-50 rounded-lg mb-3">
            <p className="text-2xl font-bold text-red-600">{formatMoneyFull(data.debtors_total || 0)}</p>
          </div>
          <div className="space-y-2">
            {debtorsList.map(d => (
              <div key={d.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                <span className="text-gray-600">{d.name}</span>
                <span className="font-semibold text-red-600">{formatMoneyFull(d.total_debt)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-orange-700">Kreditorlar (biz qarz)</h2>
          <div className="text-center p-3 bg-orange-50 rounded-lg mb-3">
            <p className="text-2xl font-bold text-orange-600">{formatMoneyFull(data.creditors_total || 0)}</p>
          </div>
          <div className="space-y-2">
            {creditorsList.map(c => (
              <div key={c.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                <span className="text-gray-600">{c.name}</span>
                <span className="font-semibold text-orange-600">{formatMoneyFull(c.total_debt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === HR statistikasi === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">👥 Bugun ishda</p>
            <MdPeople size={28} className="text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-purple-700">{hr.today_present} / {hr.total_active}</p>
          <p className="text-xs text-gray-500 mt-1">aktiv xodimdan smenada</p>
        </div>
        <div className={'bg-white rounded-xl p-5 shadow-sm border-l-4 ' +
          (hr.pending_salary > 0 ? 'border-yellow-500' : 'border-green-500')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">💰 Maosh qarzi</p>
            <MdPayment size={28} className={hr.pending_salary > 0 ? 'text-yellow-500' : 'text-green-500'} />
          </div>
          <p className={'text-3xl font-bold ' + (hr.pending_salary > 0 ? 'text-yellow-700' : 'text-green-700')}>
            {formatMoneyFull(hr.pending_salary)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {hr.pending_salary > 0 ? 'Hisoblangan, lekin to\'lanmagan' : "Hammasi to'langan ✓"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 shadow-sm border border-purple-200">
          <p className="text-sm text-purple-700 font-semibold">💼 HR bo'limiga o'tish</p>
          <p className="text-xs text-gray-600 mt-1">
            Xodimlar bazasi, davomat, maosh hisob-kitobi, avans/mukofot
          </p>
          <a href="/hr" className="mt-3 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
            👥 Ochish →
          </a>
        </div>
      </div>

      {/* === Nuqtalar + Kam xom ashyo + Tranzaksiyalar === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Sotuv nuqtalari (bugun)</h2>
          <div className="space-y-3">
            {pointsStats.map(pt => (
              <div key={pt.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">{pt.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {pt.stock_count} dona
                  </span>
                </div>
                <p className="text-sm text-emerald-600 font-semibold">
                  {formatMoneyFull(pt.today_revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdWarning className="text-yellow-500" /> Kam qolgan xom ashyolar
          </h2>
          <div className="space-y-3">
            {lowMaterials.length > 0 ? lowMaterials.map((m, i) => (
              <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="font-medium text-sm">{m.name}</p>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-red-600 font-semibold">{m.quantity} {m.unit}</span>
                  <span className="text-gray-400">min: {m.min_quantity} {m.unit}</span>
                </div>
              </div>
            )) : (
              <p className="text-green-500 font-medium text-center py-8">✓ Hammasi yetarli</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Oxirgi tranzaksiyalar</h2>
          <div className="space-y-2">
            {recentTxns.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400">{t.cash_register__name}</p>
                </div>
                <span className={'text-sm font-semibold ml-2 whitespace-nowrap ' +
                  (t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                  {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

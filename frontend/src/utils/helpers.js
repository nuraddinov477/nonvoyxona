export function formatMoney(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm";
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function currentMonth() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

export function getErrorMessage(err) {
  if (!err?.response) return "Server bilan bog'lanib bo'lmadi";
  const data = err.response.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors?.[0]) return data.non_field_errors[0];
  const firstKey = Object.keys(data || {})[0];
  if (firstKey) {
    const val = data[firstKey];
    return Array.isArray(val) ? val[0] : String(val);
  }
  return 'Xatolik yuz berdi';
}

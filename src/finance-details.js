import { received, outstanding } from './data.js';

export function financeDetailRows(state, { view, detail = '', period = '' }) {
  const rows = view === 'costs' ? state.costs : state.income;
  if (detail === 'outstanding') return rows.filter(row => outstanding(row) > 0);
  if (detail === 'received') return rows.filter(row => received(row) > 0 && row.paidDate && (!period || row.paidDate.startsWith(period)));
  if (detail === 'paid') return rows.filter(row => row.paid && row.date && (!period || row.date.startsWith(period)));
  return rows.filter(row => !period || !row.date || row.date.startsWith(period));
}

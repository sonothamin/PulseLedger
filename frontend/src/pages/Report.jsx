import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { useCurrency } from '../hooks/useCurrency';
import useTheme from '../hooks/useTheme';
import useBranding from '../hooks/useBranding';
import axios from 'axios';
import { CashStack, CalendarRange } from 'react-bootstrap-icons';
import { Button, Spinner } from 'react-bootstrap';
import { printReport } from './ReportPrint';
import './ReportPrint.css';

function getDateRangeForRange(range) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (range === 'today') {
    return { startDate: today, endDate: today };
  } else if (range === 'this-month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: startOfMonth.toISOString().split('T')[0], endDate: today };
  } else if (!isNaN(Number(range))) {
    const days = parseInt(range);
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: fromDate, endDate: today };
  }
  return { startDate: today, endDate: today };
}

  function processDataByDate(sales, expenses, fromDate, toDate) {
    const dateMap = new Map();
    const currentDate = new Date(fromDate);
    const endDate = new Date(toDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
    dateMap.set(dateStr, { date: dateStr, inflow: 0, outflow: 0, profit: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    sales.forEach(sale => {
      const dateStr = new Date(sale.createdAt).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr).inflow += parseFloat(sale.total) || 0;
      }
    });
    expenses.forEach(expense => {
      const dateStr = new Date(expense.createdAt).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr).outflow += parseFloat(expense.amount) || 0;
      }
    });
  const dataArray = Array.from(dateMap.values());
  dataArray.forEach(day => {
    day.profit = day.inflow - day.outflow;
  });
  return dataArray;
}

export default function Report() {
  const { t } = useTranslations();
  const { formatCurrency } = useCurrency();
  const { branding } = useBranding();
  const [theme] = useTheme();

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('accounts');

  // State for Accounts/Ledger report
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dateRange, setDateRange] = useState('this-month');
  const [startDate, setStartDate] = useState(() => getDateRangeForRange('this-month').startDate);
  const [endDate, setEndDate] = useState(() => getDateRangeForRange('this-month').endDate);
  const [isCustom, setIsCustom] = useState(false);
  const [ledger, setLedger] = useState([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [minInflow, setMinInflow] = useState('');
  const [maxInflow, setMaxInflow] = useState('');
  const [minOutflow, setMinOutflow] = useState('');
  const [maxOutflow, setMaxOutflow] = useState('');
  const [minProfit, setMinProfit] = useState('');
  const [maxProfit, setMaxProfit] = useState('');

  // Fetch data for Accounts/Ledger
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
      const from = isCustom ? startDate : getDateRangeForRange(dateRange).startDate;
      const to = isCustom ? endDate : getDateRangeForRange(dateRange).endDate;
      const [salesRes, expensesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/sales?start=${from}&end=${to}`),
        axios.get(`${API_BASE}/api/expenses?start=${from}&end=${to}`)
      ]);
      setSales(salesRes.data);
      setExpenses(expensesRes.data);
      setLedger(processDataByDate(salesRes.data, expensesRes.data, from, to));
    } catch (err) {
      setError(t('failedToLoadLedger') || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate, isCustom, t]);

  useEffect(() => {
    if (activeTab === 'accounts') {
      fetchData();
    }
  }, [fetchData, activeTab]);

  // Metrics
  const summary = useMemo(() => {
    const totalInflow = ledger.reduce((sum, d) => sum + d.inflow, 0);
    const totalOutflow = ledger.reduce((sum, d) => sum + d.outflow, 0);
    const totalProfit = totalInflow - totalOutflow;
    const avgDailyProfit = ledger.length > 0 ? totalProfit / ledger.length : 0;
    return { totalInflow, totalOutflow, totalProfit, avgDailyProfit };
  }, [ledger]);

  // Enhanced search: match date, inflow, outflow, profit
  const filteredLedger = useMemo(() => {
    return ledger.filter(row => {
      let match = true;
      if (search) {
        const s = search.toLowerCase();
        match = (
          row.date.includes(s) ||
          (row.inflow !== undefined && String(row.inflow).toLowerCase().includes(s)) ||
          (row.outflow !== undefined && String(row.outflow).toLowerCase().includes(s)) ||
          (row.profit !== undefined && String(row.profit).toLowerCase().includes(s))
        );
      }
      if (!match) return false;
      if (minInflow && row.inflow < parseFloat(minInflow)) return false;
      if (maxInflow && row.inflow > parseFloat(maxInflow)) return false;
      if (minOutflow && row.outflow < parseFloat(minOutflow)) return false;
      if (maxOutflow && row.outflow > parseFloat(maxOutflow)) return false;
      if (minProfit && row.profit < parseFloat(minProfit)) return false;
      if (maxProfit && row.profit > parseFloat(maxProfit)) return false;
      // Date range filter (in addition to API):
      if (row.date < startDate || row.date > endDate) return false;
      return true;
    });
  }, [ledger, search, minInflow, maxInflow, minOutflow, maxOutflow, minProfit, maxProfit, startDate, endDate]);

  // Filter summary string for print
  const filterSummary = useMemo(() => {
    const parts = [];
    if (search) parts.push(`${t('search') || 'Search'}: ${search}`);
    if (minInflow) parts.push(`${t('minInflow') || 'Min Inflow'}: ${minInflow}`);
    if (maxInflow) parts.push(`${t('maxInflow') || 'Max Inflow'}: ${maxInflow}`);
    if (minOutflow) parts.push(`${t('minOutflow') || 'Min Outflow'}: ${minOutflow}`);
    if (maxOutflow) parts.push(`${t('maxOutflow') || 'Max Outflow'}: ${maxOutflow}`);
    if (minProfit) parts.push(`${t('minProfit') || 'Min Profit'}: ${minProfit}`);
    if (maxProfit) parts.push(`${t('maxProfit') || 'Max Profit'}: ${maxProfit}`);
    if (startDate || endDate) parts.push(`${t('dateRange') || 'Date Range'}: ${startDate} - ${endDate}`);
    return parts.length ? parts.join(', ') : (t('none') || 'None');
  }, [search, minInflow, maxInflow, minOutflow, maxOutflow, minProfit, maxProfit, startDate, endDate, t]);

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredLedger.length) return;
    const header = ['Date', 'Inflow', 'Outflow', 'Profit'];
    const rows = filteredLedger.map(row => [row.date, row.inflow, row.outflow, row.profit]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_ledger_${startDate}_to_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print
  const handlePrint = () => {
    printReport({
      title: t('accountsLedger') || 'Accounts Ledger',
      columns: [t('date'), t('inflow'), t('outflow'), t('profit')],
      rows: filteredLedger.map(row => [row.date, formatCurrency(row.inflow), formatCurrency(row.outflow), formatCurrency(row.profit)]),
      totals: ['', formatCurrency(summary.totalInflow), formatCurrency(summary.totalOutflow), formatCurrency(summary.totalProfit)],
      branding,
      t,
      filters: filterSummary // for future use
    });
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">{t('reports') || 'Reports'}</h2>
      {/* Bootstrap Nav Tabs */}
      <ul className="nav nav-tabs mb-4" id="reportTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'accounts' ? ' active' : ''}`}
            id="accounts-tab"
            data-bs-toggle="tab"
            type="button"
            role="tab"
            aria-controls="accounts"
            aria-selected={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
          >
            <CashStack className="me-2" />{t('accountsLedger') || 'Accounts Ledger'}
          </button>
        </li>
        {/* Future tabs can be added here, e.g. Sales, Expenses, etc. */}
      </ul>
      <div className="tab-content" id="reportTabsContent">
        <div
          className={`tab-pane fade${activeTab === 'accounts' ? ' show active' : ''}`}
          id="accounts"
          role="tabpanel"
          aria-labelledby="accounts-tab"
        >
          <div className="card mb-4 shadow-sm border bg-body rounded-3">
            <div className="card-body pb-2">
              <form className="container-fluid px-0">
                <div className="row g-2 align-items-end mb-2">
                  {/* Search */}
                  <div className="col-md-6 col-12">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-transparent border-end-0">{t('search') || 'Search'}</span>
                      <input type="text" className="form-control border-start-0" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('dateInflowOutflowProfit') || 'Date, Inflow, Outflow, Profit'} />
                    </div>
                  </div>
                  {/* Date Range Selector */}
                  <div className="col-md-6 col-12">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-transparent border-end-0"><CalendarRange size={14} /></span>
                      <select className="form-select border-start-0" value={dateRange} onChange={e => { setDateRange(e.target.value); setIsCustom(e.target.value === 'custom'); }}>
                        <option value="today">{t('today') || 'Today'}</option>
                        <option value="this-month">{t('thisMonth') || 'This Month'}</option>
                        <option value="7">{t('last7Days') || 'Last 7 Days'}</option>
                        <option value="30">{t('last30Days') || 'Last 30 Days'}</option>
                        <option value="custom">{t('customRange') || 'Custom Range'}</option>
                      </select>
                      <span className="input-group-text">{t('from') || 'From'}</span>
                      <input type="date" className="form-control form-control-sm" value={startDate} onChange={e => { setStartDate(e.target.value); setDateRange('custom'); }} aria-label="Start date" disabled={dateRange !== 'custom'} />
                      <span className="input-group-text">{t('to') || 'To'}</span>
                      <input type="date" className="form-control form-control-sm" value={endDate} onChange={e => { setEndDate(e.target.value); setDateRange('custom'); }} aria-label="End date" disabled={dateRange !== 'custom'} />
                    </div>
              </div>
            </div>
                <div className="row g-2 align-items-end">
                  {/* Inflow min-max */}
                  <div className="col-md-3 col-12">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">{t('inflow') || 'Inflow'}</span>
                      <input type="number" className="form-control" value={minInflow} onChange={e => setMinInflow(e.target.value)} placeholder={t('min') || 'Min'} />
                      <span className="input-group-text">-</span>
                      <input type="number" className="form-control" value={maxInflow} onChange={e => setMaxInflow(e.target.value)} placeholder={t('max') || 'Max'} />
                    </div>
                  </div>
                  {/* Outflow min-max */}
                  <div className="col-md-3 col-12">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">{t('outflow') || 'Outflow'}</span>
                      <input type="number" className="form-control" value={minOutflow} onChange={e => setMinOutflow(e.target.value)} placeholder={t('min') || 'Min'} />
                      <span className="input-group-text">-</span>
                      <input type="number" className="form-control" value={maxOutflow} onChange={e => setMaxOutflow(e.target.value)} placeholder={t('max') || 'Max'} />
              </div>
            </div>
                  {/* Profit min-max */}
                  <div className="col-md-3 col-12">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">{t('profit') || 'Profit'}</span>
                      <input type="number" className="form-control" value={minProfit} onChange={e => setMinProfit(e.target.value)} placeholder={t('min') || 'Min'} />
                      <span className="input-group-text">-</span>
                      <input type="number" className="form-control" value={maxProfit} onChange={e => setMaxProfit(e.target.value)} placeholder={t('max') || 'Max'} />
                    </div>
              </div>
                  {/* Action buttons */}
                  <div className="col-md-3 col-12 d-flex gap-2 justify-content-md-end justify-content-start mt-md-0 mt-2">
                    <Button variant="outline-primary" size="sm" onClick={fetchData} disabled={loading}>
                      <i className="bi bi-arrow-repeat me-1" />{t('apply') || 'Apply'}
                      </Button>
                    <Button variant="outline-secondary" size="sm" onClick={handleExportCSV} disabled={loading || !filteredLedger.length}>
                      <i className="bi bi-file-earmark-spreadsheet me-1" />{t('exportCSV') || 'Export CSV'}
                      </Button>
                    <Button variant="outline-primary" size="sm" onClick={handlePrint} disabled={loading || !filteredLedger.length}>
                      <i className="bi bi-printer me-1" />{t('print') || 'Print/PDF'}
                      </Button>
                    </div>
              </div>
              </form>
            </div>
          </div>
          {/* Show filter summary */}
          <div className="mb-3 small text-muted">
            <strong>{t('filters') || 'Filters'}:</strong> {filterSummary}
                    </div>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner animation="border" role="status" />
              </div>
          ) : error ? (
            <div className="alert alert-danger mb-0">{error}</div>
          ) : (
            <div className="table-responsive report-table-container">
              <table className="table table-striped table-hover table-bordered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>{t('date') || 'Date'}</th>
                    <th className="text-end">{t('inflow') || 'Inflow'}</th>
                    <th className="text-end">{t('outflow') || 'Outflow'}</th>
                    <th className="text-end">{t('profit') || 'Profit'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.length ? filteredLedger.map((row, idx) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td className="text-end">{formatCurrency(row.inflow)}</td>
                      <td className="text-end">{formatCurrency(row.outflow)}</td>
                      <td className={`text-end ${row.profit >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(row.profit)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-center text-muted">{t('noData') || 'No data available'}</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="report-totals">
                    <td>{t('total') || 'Total'}</td>
                    <td className="text-end">{formatCurrency(summary.totalInflow)}</td>
                    <td className="text-end">{formatCurrency(summary.totalOutflow)}</td>
                    <td className={`text-end ${summary.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(summary.totalProfit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
        )}
        </div>
        {/* Future tab panes can be added here */}
      </div>
    </div>
  );
} 
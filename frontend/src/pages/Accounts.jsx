import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslations } from '../hooks/useTranslations'
import { useCurrency } from '../hooks/useCurrency'
import useTheme from '../hooks/useTheme'
import axios from 'axios'
import { 
  ArrowUp, 
  ArrowDown,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart,
  PieChart,
  CashStack,
  Receipt,
  CreditCard,
  CalendarRange
} from 'react-bootstrap-icons'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

import './Accounts.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Utility functions
const calculateStreaks = (profitData) => {
  let maxProfitStreak = 0
  let maxLossStreak = 0
  let currentProfitStreak = 0
  let currentLossStreak = 0
  
  profitData.forEach(day => {
    if (day.amount > 0) {
      currentProfitStreak++
      currentLossStreak = 0
      maxProfitStreak = Math.max(maxProfitStreak, currentProfitStreak)
    } else {
      currentLossStreak++
      currentProfitStreak = 0
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
    }
  })
  
  return { maxProfitStreak, maxLossStreak }
}

const calculateMetrics = (summary, profitData) => {
  const profitableDays = profitData.filter(day => day.amount > 0).length
  const lossDays = profitData.filter(day => day.amount < 0).length
  const totalDays = profitData.length
  
  return {
    profitableDays,
    lossDays,
    totalDays,
    performanceRate: totalDays > 0 ? (profitableDays / totalDays) * 100 : 0,
    profitMargin: summary.totalInflow > 0 ? (summary.totalProfit / summary.totalInflow) * 100 : 0,
    efficiencyRatio: summary.totalOutflow > 0 ? (summary.totalInflow / summary.totalOutflow) * 100 : 0
  }
}

const getDateRangeForRange = (range) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (range === 'today') {
    return { startDate: today, endDate: today };
  } else if (range === 'this-week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const end = endOfWeek > now ? today : endOfWeek.toISOString().split('T')[0];
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: end
    };
  } else if (range === 'this-month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: today
    };
  } else {
    const days = parseInt(range);
    if (isNaN(days)) return { startDate: today, endDate: today };
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: fromDate, endDate: today };
  }
};

function Accounts() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { t } = useTranslations()
  const { formatCurrency } = useCurrency()
  const [theme] = useTheme()
  
  // Data states
  const [accountsData, setAccountsData] = useState({
    inflow: [],
    outflow: [],
    profit: [],
    summary: {
      totalInflow: 0,
      totalOutflow: 0,
      totalProfit: 0,
      avgDailyProfit: 0,
      bestDay: null,
      worstDay: null
    }
  })
  
  // Filter states
  const [dateRange, setDateRange] = useState('this-month')
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [chartType, setChartType] = useState('line')
  const [isEditing, setIsEditing] = useState(false)
  
  // Refs for smooth scrolling
  const overviewRef = useRef(null)
  const ledgerRef = useRef(null)
  const insightsRef = useRef(null)

  // Memoized calculations
  const { maxProfitStreak, maxLossStreak } = useMemo(() => 
    calculateStreaks(accountsData.profit), [accountsData.profit]
  )
  
  const metrics = useMemo(() => 
    calculateMetrics(accountsData.summary, accountsData.profit), 
    [accountsData.summary, accountsData.profit]
  )

  // Sorting state for ledger table
  const [sortColumn, setSortColumn] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Sorted profit data for table
  const sortedProfit = [...accountsData.profit].map((day, idx) => ({
    ...day,
    inflow: accountsData.inflow[idx]?.amount || 0,
    outflow: accountsData.outflow[idx]?.amount || 0,
    index: idx
  }));
  sortedProfit.sort((a, b) => {
    let vA, vB;
    switch (sortColumn) {
      case 'date':
        vA = a.date; vB = b.date; break;
      case 'inflow':
        vA = a.inflow; vB = b.inflow; break;
      case 'outflow':
        vA = a.outflow; vB = b.outflow; break;
      case 'profit':
        vA = a.amount; vB = b.amount; break;
      case 'balance':
        // Calculate running balance up to this row
        vA = accountsData.profit.slice(0, a.index + 1).reduce((sum, d) => sum + d.amount, 0);
        vB = accountsData.profit.slice(0, b.index + 1).reduce((sum, d) => sum + d.amount, 0);
        break;
      default:
        vA = a.date; vB = b.date;
    }
    if (vA < vB) return sortDirection === 'asc' ? -1 : 1;
    if (vA > vB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const fetchAccountsData = useCallback(async () => {
    setLoading(true)
    setError('')
    
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
      const fromDate = dateRange === 'custom' ? startDate : getDateRangeForRange(dateRange).startDate
      const toDate = dateRange === 'custom' ? endDate : getDateRangeForRange(dateRange).endDate

      // Fetch sales data (inflow)
      const salesRes = await axios.get(`${API_BASE}/api/sales?start=${fromDate}&end=${toDate}`)
      
      // Fetch expenses data (outflow)
      const expensesRes = await axios.get(`${API_BASE}/api/expenses?start=${fromDate}&end=${toDate}`)
      
      // Process data by date
      const processedData = processDataByDate(salesRes.data, expensesRes.data, fromDate, toDate)
      
      setAccountsData(processedData)
    } catch (err) {
      console.error('Failed to fetch accounts data:', err)
      setError(t('accountsFailedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [dateRange, startDate, endDate, t])

  useEffect(() => {
    if (!isEditing || dateRange !== 'custom') {
      fetchAccountsData()
    }
  }, [fetchAccountsData, isEditing, dateRange])

  const processDataByDate = (sales, expenses, fromDate, toDate) => {
    const dateMap = new Map()
    
    // Initialize all dates in range
    const currentDate = new Date(fromDate)
    const endDate = new Date(toDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dateMap.set(dateStr, {
        date: dateStr,
        inflow: 0,
        outflow: 0,
        profit: 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Process sales (inflow)
    sales.forEach(sale => {
      const dateStr = new Date(sale.createdAt).toISOString().split('T')[0]
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr).inflow += parseFloat(sale.total) || 0
      }
    })
    
    // Process expenses (outflow)
    expenses.forEach(expense => {
      const dateStr = new Date(expense.createdAt).toISOString().split('T')[0]
      if (dateMap.has(dateStr)) {
        dateMap.get(dateStr).outflow += parseFloat(expense.amount) || 0
      }
    })
    
    // Calculate profit for each date
    const dataArray = Array.from(dateMap.values())
    dataArray.forEach(day => {
      day.profit = day.inflow - day.outflow
    })
    
    // Calculate summary statistics
    const totalInflow = dataArray.reduce((sum, day) => sum + day.inflow, 0)
    const totalOutflow = dataArray.reduce((sum, day) => sum + day.outflow, 0)
    const totalProfit = totalInflow - totalOutflow
    const avgDailyProfit = dataArray.length > 0 ? totalProfit / dataArray.length : 0
    
    const bestDay = dataArray.reduce((best, day) => day.profit > best.profit ? day : best, dataArray[0])
    const worstDay = dataArray.reduce((worst, day) => day.profit < worst.profit ? day : worst, dataArray[0])
    
    return {
      inflow: dataArray.map(day => ({ date: day.date, amount: day.inflow })),
      outflow: dataArray.map(day => ({ date: day.date, amount: day.outflow })),
      profit: dataArray.map(day => ({ date: day.date, amount: day.profit })),
      summary: {
        totalInflow,
        totalOutflow,
        totalProfit,
        avgDailyProfit,
        bestDay,
        worstDay
      },
      sales, // <-- add this
      expenses // <-- add this
    }
  }

  // Memoized chart data
  const chartData = useMemo(() => ({
    labels: accountsData.profit.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Inflow',
        data: accountsData.inflow.map(item => item.amount),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Outflow',
        data: accountsData.outflow.map(item => item.amount),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Profit',
        data: accountsData.profit.map(item => item.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.4
      }
    ]
  }), [accountsData])

  const profitChartData = useMemo(() => ({
    labels: accountsData.profit.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Daily Profit',
        data: accountsData.profit.map(item => item.amount),
        backgroundColor: accountsData.profit.map(item => 
          item.amount >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: accountsData.profit.map(item => 
          item.amount >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1
      }
    ]
  }), [accountsData.profit])

  const summaryChartData = useMemo(() => ({
    labels: ['Inflow', 'Outflow'],
    datasets: [
      {
        data: [accountsData.summary.totalInflow, accountsData.summary.totalOutflow],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 2
      }
    ]
  }), [accountsData.summary])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      }
    }
  }), [formatCurrency])

  const scrollToSection = useCallback((ref) => {
    ref.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }, [])

  const handleDateRangeChange = useCallback((newRange) => {
    setDateRange(newRange);
  }, []);

  // When dateRange changes, update start/end unless custom
  useEffect(() => {
    if (dateRange && dateRange !== 'custom') {
      let s = '', e = '';
      if (dateRange === 'this-week' && accountsData.outflow.length > 0) {
        // Find the start of the week for the latest date in data
        const allDates = accountsData.outflow.map(e => e.date);
        const sortedDates = allDates.sort();
        const today = sortedDates[sortedDates.length - 1];
        const latest = new Date(today);
        const startOfWeek = new Date(latest);
        startOfWeek.setDate(latest.getDate() - latest.getDay());
        s = startOfWeek.toISOString().split('T')[0];
        e = today;
      } else if (dateRange === 'this-month') {
        // Always use the real current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const today = now.toISOString().split('T')[0];
        s = startOfMonth.toISOString().split('T')[0];
        e = today;
      } else if (!isNaN(Number(dateRange)) && accountsData.outflow.length > 0) {
        const allDates = accountsData.outflow.map(e => e.date);
        const sortedDates = allDates.sort();
        const today = sortedDates[sortedDates.length - 1];
        const days = parseInt(dateRange);
        const latest = new Date(today);
        const start = new Date(latest);
        start.setDate(latest.getDate() - days);
        s = start.toISOString().split('T')[0];
        e = today;
      } else if (dateRange === 'today' && accountsData.outflow.length > 0) {
        const allDates = accountsData.outflow.map(e => e.date);
        const sortedDates = allDates.sort();
        const today = sortedDates[sortedDates.length - 1];
        s = e = today;
      }
      if (s && e) {
        setStartDate(s);
        setEndDate(e);
      }
    }
  }, [dateRange, accountsData.outflow]);

  // Best Selling Products aggregation
  const [bestSellingProducts, setBestSellingProducts] = useState([])
  // Control for including supplementary products in best seller calculation
  const [includeSupp, setIncludeSupp] = useState(true)
  // Expense Category Pie Chart data
  const [expenseCategoryData, setExpenseCategoryData] = useState({ labels: [], datasets: [] })
  // Utility to get Bootstrap body color from CSS variable
  function getBootstrapBodyColor() {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.body).getPropertyValue('--bs-body-color') || '#222';
    }
    return '#222';
  }

  const expensePieOptions = useMemo(() => {
    const bodyColor = getBootstrapBodyColor().trim() || '#222';
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: bodyColor,
            font: { size: 14 }
          }
        },
        tooltip: {
          bodyColor: bodyColor,
          callbacks: {
            label: ctx => `${ctx.label}: ${formatCurrency(ctx.parsed)}`
          }
        }
      }
    }
  }, [formatCurrency, accountsData, /* triggers re-read on theme change */])

  useEffect(() => {
    // Aggregate best selling products from sales data
    if (accountsData.sales && Array.isArray(accountsData.sales)) {
      const productMap = {}
      accountsData.sales.forEach(sale => {
        if (Array.isArray(sale.SaleItems)) {
          sale.SaleItems.forEach(item => {
            if (!includeSupp && item.isSupplementary) return;
            const name = item.Product?.name || item.productName || item.name || '—'
            if (!productMap[name]) productMap[name] = 0
            productMap[name] += item.quantity || 0
          })
        }
      })
      const sorted = Object.entries(productMap)
        .map(([productName, quantity]) => ({ productName, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 7)
      setBestSellingProducts(sorted)
    }
    // Aggregate expenses by category for pie chart
    if (accountsData.expenses && Array.isArray(accountsData.expenses)) {
      const categoryMap = {}
      accountsData.expenses.forEach(exp => {
        const cat = exp.ExpenseCategory?.name || exp.categoryName || 'Other'
        if (!categoryMap[cat]) categoryMap[cat] = 0
        categoryMap[cat] += exp.amount || 0
      })
      const labels = Object.keys(categoryMap)
      const data = Object.values(categoryMap)
      setExpenseCategoryData({
        labels,
        datasets: [{
          data,
          backgroundColor: [
            '#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab'
          ].slice(0, labels.length),
          borderWidth: 1
        }]
      })
    }
  }, [accountsData, formatCurrency, theme, includeSupp])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">{t('accountsLoading')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div className="text-danger mb-3">{error}</div>
          <button className="btn btn-primary" onClick={fetchAccountsData}>
            {t('accountsRetry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="accounts-header mb-3">
        <h2 className="accounts-title">
          <CashStack className="me-2" />
          {t('accountsTitle')}
        </h2>
      </div>

      {/* Navigation with Date Selector */}
      <div className="card mb-4 sticky-top shadow-sm sticky-nav">
        <div className="card-body py-3">
          <div className="d-flex justify-content-between align-items-center">
            {/* Date Selector */}
            <div className="date-selector-container">
              <div className="input-group input-group-sm">
                <span className="input-group-text">
                  <CalendarRange size={14} />
                </span>
          <select 
            className="form-select" 
            value={dateRange} 
            onChange={(e) => handleDateRangeChange(e.target.value)}
            aria-label="Select date range"
          >
            <option value="today">{t('today')}</option>
            <option value="this-week">{t('accountsThisWeek')}</option>
            <option value="this-month">{t('accountsThisMonth')}</option>
            <option value="7">{t('accountsLast7Days')}</option>
            <option value="30">{t('accountsLast30Days')}</option>
            <option value="90">{t('accountsLast90Days')}</option>
            <option value="365">{t('accountsLastYear')}</option>
            <option value="custom">{t('accountsCustomRange')}</option>
          </select>
                <span className="input-group-text">{t('accountsFrom')}</span>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setDateRange('custom')
              setIsEditing(true)
            }}
            onBlur={() => setIsEditing(false)}
            aria-label="Start date"
          />
                <span className="input-group-text">{t('accountsTo')}</span>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setDateRange('custom')
              setIsEditing(true)
            }}
            onBlur={() => setIsEditing(false)}
            aria-label="End date"
          />
        </div>
      </div>

            {/* Navigation Buttons */}
            <nav className="d-flex gap-2" aria-label="Page navigation">
            <button
              type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 nav-button"
              onClick={() => scrollToSection(overviewRef)}
              aria-label="Go to overview section"
            >
                <BarChart size={14} />
                <span>{t('accountsOverview')}</span>
            </button>
            <button
              type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 nav-button"
              onClick={() => scrollToSection(ledgerRef)}
              aria-label="Go to daily ledger section"
            >
                <Receipt size={14} />
                <span>{t('accountsDailyLedger')}</span>
            </button>
            <button
              type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 nav-button"
              onClick={() => scrollToSection(insightsRef)}
              aria-label="Go to insights section"
            >
                <PieChart size={14} />
                <span>{t('accountsInsights')}</span>
            </button>
          </nav>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <section ref={overviewRef} className="mb-5">
        <header className="d-flex align-items-center mb-3">
          <BarChart className="me-2 text-primary" size={24} />
          <h3 className="mb-0">{t('accountsOverview')}</h3>
        </header>
        
        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="dashboard-summary-card card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                  <div className="summary-icon success">
                    <ArrowUp className="text-success" size={24} />
                  </div>
                </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title text-muted mb-1">{t('accountsTotalInflow')}</h6>
                    <h4 className="mb-0 text-success">{formatCurrency(accountsData.summary.totalInflow)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="dashboard-summary-card card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                  <div className="summary-icon danger">
                    <ArrowDown className="text-danger" size={24} />
                  </div>
                </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title text-muted mb-1">{t('accountsTotalOutflow')}</h6>
                    <h4 className="mb-0 text-danger">{formatCurrency(accountsData.summary.totalOutflow)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="dashboard-summary-card card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                  <div className={`summary-icon ${accountsData.summary.totalProfit >= 0 ? 'success' : 'danger'}`}>
                    <ArrowUpCircle className={accountsData.summary.totalProfit >= 0 ? 'text-success' : 'text-danger'} size={24} />
                  </div>
                </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title text-muted mb-1">{t('accountsNetProfit')}</h6>
                    <h4 className={`mb-0 ${accountsData.summary.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(accountsData.summary.totalProfit)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-3">
            <div className="dashboard-summary-card card">
              <div className="card-body">
                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                  <div className="summary-icon primary">
                    <BarChart className="text-primary" size={24} />
                  </div>
                </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="card-title text-muted mb-1">{t('accountsAvgDailyProfit')}</h6>
                    <h4 className={`mb-0 ${accountsData.summary.avgDailyProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(accountsData.summary.avgDailyProfit)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="dashboard-chart-card card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{t('accountsFinancialOverview')}</h5>
                <div className="btn-group" role="group" aria-label="Chart type selector">
                  <button
                    type="button"
                    className={`btn btn-sm ${chartType === 'line' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setChartType('line')}
                    aria-label="Line chart"
                  >
                    <ArrowUpCircle size={16} />
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${chartType === 'bar' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setChartType('bar')}
                    aria-label="Bar chart"
                  >
                    <BarChart size={16} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-container-large">
                  {chartType === 'line' ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <Bar data={chartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="dashboard-chart-card card">
              <div className="card-header">
                <h5 className="mb-0">{t('accountsInflowVsOutflow')}</h5>
              </div>
              <div className="card-body">
                <div className="chart-container-large">
                  <Doughnut data={summaryChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="dashboard-chart-card card">
              <div className="card-header">
                <h5 className="mb-0">{t('accountsDailyProfitAnalysis')}</h5>
              </div>
              <div className="card-body">
                <div className="chart-container-medium">
                  <Bar data={profitChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section ref={insightsRef} className="mb-5">
        <header className="d-flex align-items-center mb-3">
          <PieChart className="me-2 text-primary" size={24} />
          <h3 className="mb-0">{t('accountsInsights')}</h3>
        </header>
        
        {/* Performance Overview - Full Width */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">{t('accountsPerformanceOverview')}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                                  {/* Best/Worst Days */}
                <div className="col-md-3">
                  <div className="performance-metric">
                    <div className="performance-metric-icon bg-success bg-opacity-10">
                      <ArrowUpCircle className="text-success" size={24} />
                    </div>
                      <h6>{t('accountsBestDay')}</h6>
                      <p className="mb-1">
                        {accountsData.summary.bestDay ? 
                          new Date(accountsData.summary.bestDay.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'N/A'
                        }
                      </p>
                      <strong className="text-success">
                        {accountsData.summary.bestDay ? formatCurrency(accountsData.summary.bestDay.profit) : 'N/A'}
                      </strong>
                    </div>
                  </div>
                  
                                  <div className="col-md-3">
                  <div className="performance-metric">
                    <div className="performance-metric-icon bg-danger bg-opacity-10">
                      <ArrowDownCircle className="text-danger" size={24} />
                    </div>
                      <h6>{t('accountsWorstDay')}</h6>
                      <p className="mb-1">
                        {accountsData.summary.worstDay ? 
                          new Date(accountsData.summary.worstDay.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'N/A'
                        }
                      </p>
                      <strong className="text-danger">
                        {accountsData.summary.worstDay ? formatCurrency(accountsData.summary.worstDay.profit) : 'N/A'}
                      </strong>
                    </div>
                  </div>
                  
                  {/* Daily Averages */}
                                  <div className="col-md-3">
                  <div className="performance-metric">
                    <div className="performance-metric-icon bg-info bg-opacity-10">
                      <BarChart className="text-info" size={24} />
                    </div>
                      <h6>{t('accountsAvgDailyInflow')}</h6>
                      <p className="mb-1 text-muted">Per Day</p>
                      <strong className="text-info">
                        {formatCurrency(accountsData.summary.totalInflow / Math.max(accountsData.profit.length, 1))}
                      </strong>
                    </div>
                  </div>
                  
                                  <div className="col-md-3">
                  <div className="performance-metric">
                    <div className="performance-metric-icon bg-warning bg-opacity-10">
                      <CreditCard className="text-warning" size={24} />
                    </div>
                      <h6>{t('accountsAvgDailyOutflow')}</h6>
                      <p className="mb-1 text-muted">Per Day</p>
                      <strong className="text-warning">
                        {formatCurrency(accountsData.summary.totalOutflow / Math.max(accountsData.profit.length, 1))}
                      </strong>
                    </div>
                  </div>
                </div>
                
                {/* Efficiency Metrics */}
                <div className="row mt-3">
                  <div className="col-md-4">
                    <div className="efficiency-metric">
                      <small className="text-muted d-block mb-2">{t('accountsEfficiencyRatio')}</small>
                      <div className="h4 mb-0">
                        {metrics.efficiencyRatio.toFixed(1)}%
                      </div>
                      <small className="text-muted">{t('accountsInflowPerOutflow')}</small>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="efficiency-metric">
                      <small className="text-muted d-block mb-2">{t('accountsProfitMargin')}</small>
                      <div className="h4 mb-0">
                        {metrics.profitMargin.toFixed(1)}%
                      </div>
                      <small className="text-muted">{t('accountsNetProfitPercent')}</small>
                    </div>
                  </div>
                  
                  <div className="col-md-4">
                    <div className="efficiency-metric">
                      <small className="text-muted d-block mb-2">{t('accountsPerformanceRate')}</small>
                      <div className="h4 mb-0">
                        {metrics.performanceRate.toFixed(1)}%
                      </div>
                      <small className="text-muted">{t('accountsProfitableDays')}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Analysis and Financial Metrics */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">{t('accountsTrendAnalysis')}</h5>
              </div>
              <div className="card-body d-flex flex-column justify-content-center">
                <div className="text-center">
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">{t('accountsAvgDailyPerformance')}</h6>
                    <div className="h3 mb-0">
                      {metrics.performanceRate.toFixed(1)}% Profitable Days
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6">
                      <div className="border-end">
                        <small className="text-muted d-block">{t('accountsProfitStreak')}</small>
                        <div className="h5 mb-0 text-success">
                          {maxProfitStreak} days
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                                              <small className="text-muted d-block">{t('accountsLossStreak')}</small>
                      <div className="h5 mb-0 text-danger">
                        {maxLossStreak} days
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">{t('accountsFinancialMetrics')}</h5>
              </div>
              <div className="card-body d-flex flex-column justify-content-center">
                <div className="financial-metrics-grid">
                  <div className="financial-metric-card">
                    <small className="text-muted d-block mb-1">{t('accountsProfitMargin')}</small>
                    <div className="h4 mb-0">
                      {metrics.profitMargin.toFixed(1)}%
                    </div>
                  </div>
                  <div className="financial-metric-card">
                    <small className="text-muted d-block mb-1">{t('accountsDaysAnalyzed')}</small>
                    <div className="h4 mb-0">{metrics.totalDays}</div>
                  </div>
                  <div className="financial-metric-card">
                    <small className="text-muted d-block mb-1">{t('accountsProfitDays')}</small>
                    <div className="h4 mb-0 text-success">
                      {metrics.profitableDays}
                    </div>
                  </div>
                  <div className="financial-metric-card">
                    <small className="text-muted d-block mb-1">{t('accountsLossDays')}</small>
                    <div className="h4 mb-0 text-danger">
                      {metrics.lossDays}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Selling Products & Expense Category Pie Chart Row */}
      <div className="row mb-4">
        {/* Best Selling Products */}
        <div className="col-lg-6 mb-3 mb-lg-0">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-transparent d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <BarChart className="me-2 text-primary" size={20} />
                <h5 className="mb-0">{t('accountsBestSellingProducts') || 'Best Selling Products'}</h5>
              </div>
              <div className="form-check form-switch ms-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeSuppSwitch"
                  checked={includeSupp}
                  onChange={e => setIncludeSupp(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="includeSuppSwitch">
                  {includeSupp ? t('includeSuppProducts') || 'Incl. Supplementary' : t('excludeSuppProducts') || 'Excl. Supplementary'}
                </label>
              </div>
            </div>
            <div className="card-body">
              {bestSellingProducts.length === 0 ? (
                <div className="text-muted text-center py-4">{t('noData') || 'No data available'}</div>
              ) : (
                <ol className="list-group list-group-numbered list-group-flush">
                  {bestSellingProducts.map((item, idx) => (
                    <li key={item.productName} className="list-group-item d-flex justify-content-between align-items-center bg-transparent border-0 px-0 py-2">
                      <span className="fw-semibold text-truncate" style={{ maxWidth: 180 }}>{item.productName}</span>
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold" style={{ minWidth: 48 }}>{item.quantity}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
        {/* Expense Category Pie Chart */}
        <div className="col-lg-6">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-header bg-transparent d-flex align-items-center">
              <PieChart className="me-2 text-primary" size={20} />
              <h5 className="mb-0">{t('accountsExpenseCategoryBreakdown') || 'Expense Category Breakdown'}</h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center text-body" style={{ minHeight: 220 }}>
              {expenseCategoryData && expenseCategoryData.labels.length > 0 ? (
                <div style={{ width: '100%', maxWidth: 320 }}>
                  <Doughnut data={expenseCategoryData} options={expensePieOptions} />
                </div>
              ) : (
                <div className="text-muted text-center w-100">{t('noData') || 'No data available'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Ledger Section - Last Section */}
      <section ref={ledgerRef} className="mb-5">
        <header className="d-flex align-items-center mb-3">
          <Receipt className="me-2 text-primary" size={24} />
          <h3 className="mb-0">{t('accountsDailyLedger')}</h3>
        </header>
        
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover" aria-label="Daily financial ledger">
                <thead>
                  <tr>
                    <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('date')}>
                      Date {sortColumn === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th scope="col" className="text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('inflow')}>
                      Inflow {sortColumn === 'inflow' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th scope="col" className="text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('outflow')}>
                      Outflow {sortColumn === 'outflow' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th scope="col" className="text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('profit')}>
                      Profit/Loss {sortColumn === 'profit' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th scope="col" className="text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('balance')}>
                      Running Balance {sortColumn === 'balance' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProfit.map((day) => {
                      const runningBalance = accountsData.profit
                        .slice(0, day.index + 1)
                        .reduce((sum, d) => sum + d.amount, 0)
                      const isToday = new Date(day.date).toDateString() === new Date().toDateString()
                      return (
                        <tr key={day.date} className={isToday ? 'table-primary' : ''}>
                          <td>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                                {isToday && (
                                  <span className="badge bg-primary today-badge">{t('accountsToday')}</span>
                                )}
                              </div>
                              <small className="text-muted">
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'short'
                                })}
                              </small>
                            </div>
                          </td>
                          <td className="text-end text-success">
                            {formatCurrency(day.inflow)}
                          </td>
                          <td className="text-end text-danger">
                            {formatCurrency(day.outflow)}
                          </td>
                          <td className={`text-end ${day.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                            <strong>{formatCurrency(day.amount)}</strong>
                          </td>
                          <td className={`text-end ${runningBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                            <strong>{formatCurrency(runningBalance)}</strong>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <th className="text-end text-success">
                      {formatCurrency(accountsData.summary.totalInflow)}
                    </th>
                    <th className="text-end text-danger">
                      {formatCurrency(accountsData.summary.totalOutflow)}
                    </th>
                    <th className={`text-end ${accountsData.summary.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      <strong>{formatCurrency(accountsData.summary.totalProfit)}</strong>
                    </th>
                    <th className={`text-end ${accountsData.summary.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      <strong>{formatCurrency(accountsData.summary.totalProfit)}</strong>
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Accounts 
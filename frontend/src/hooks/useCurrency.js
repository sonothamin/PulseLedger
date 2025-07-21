import { useState, useEffect } from 'react'
import axios from 'axios'

export function useCurrency() {
  const [currency, setCurrency] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCurrencySettings = async () => {
      try {
        const res = await axios.get('/api/settings')
        const currencySetting = res.data.find(s => s.key === 'currency')
        if (currencySetting?.value) {
          setCurrency(currencySetting.value)
        }
      } catch (err) {
        console.error('Failed to load currency settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrencySettings()
  }, [])

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || !currency) return ''
    
    const formattedAmount = parseFloat(amount).toLocaleString()
    return currency.position === 'before' 
      ? `${currency.symbol}${formattedAmount}`
      : `${formattedAmount}${currency.symbol}`
  }

  return { currency, formatCurrency, loading }
} 
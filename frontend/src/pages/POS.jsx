import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from '../hooks/useTranslations'
import axios from 'axios'
import { 
  Search, 
  Plus, 
  Dash, 
  Trash, 
  Receipt as Invoice,
  Printer,
  CreditCard,
  Cash,
  BoxSeam,
  Person,
  GenderMale,
  GenderFemale,
  GenderAmbiguous,
  Telephone,
  Envelope,
  GeoAlt,
  X
} from 'react-bootstrap-icons'
import { useAuth } from '../context/AuthHelpers'
import { useCurrency } from '../hooks/useCurrency'
import React, { Suspense } from 'react'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast';
import InvoicePage from './Invoice';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// Component for Patient Selection
const PatientSelector = ({ 
  patients, 
  selectedPatient, 
  onPatientSelect, 
  onAddPatient, 
  t 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const [filteredPatients, setFilteredPatients] = useState([])
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter patients based on search term
  useEffect(() => {
    setFilteredPatients(
      patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm))
      )
    )
  }, [searchTerm, patients])

  // Reset hovered index when dropdown opens
  useEffect(() => {
    setHoveredIndex(filteredPatients.length > 0 ? 0 : filteredPatients.length)
  }, [dropdownOpen, searchTerm, filteredPatients.length])

  // Click-away listener
  useEffect(() => {
    if (!dropdownOpen) return
    
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!dropdownOpen) return
    
    switch (e.key) {
      case 'ArrowDown':
      e.preventDefault()
      setHoveredIndex(idx => {
        if (idx === -1) return 0
          if (idx >= filteredPatients.length - 1) return filteredPatients.length
        return idx + 1
      })
        break
      case 'ArrowUp':
      e.preventDefault()
      setHoveredIndex(idx => {
          if (idx === -1 || idx === 0) return filteredPatients.length
        if (idx === filteredPatients.length) return filteredPatients.length - 1
        return idx - 1
      })
        break
      case 'Enter':
        if (hoveredIndex === filteredPatients.length) {
          onAddPatient(searchTerm)
        setDropdownOpen(false)
      } else if (hoveredIndex >= 0 && hoveredIndex < filteredPatients.length) {
          onPatientSelect(filteredPatients[hoveredIndex].id)
          setSearchTerm('')
        setDropdownOpen(false)
      }
        break
      case 'Escape':
      case 'Tab':
      setDropdownOpen(false)
        break
      default:
        break
    }
  }, [dropdownOpen, filteredPatients, hoveredIndex, searchTerm, onPatientSelect, onAddPatient])

  const selectedPatientData = patients.find(p => p.id === selectedPatient)
  const displayValue = selectedPatientData 
    ? `${selectedPatientData.name}${selectedPatientData.phone ? ` (${selectedPatientData.phone})` : ''}`
    : searchTerm

    return (
    <div className="position-relative">
                <div className="input-group">
        <span className="input-group-text" style={{ minWidth: '60px' }}>
          {t('patient')}
        </span>
        <span className="input-group-text">
          <Search />
        </span>
                  <input
          ref={inputRef}
                    type="text"
                    className="form-control"
          placeholder={t('searchPatient') || 'Search patient...'}
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            onPatientSelect(null)
            setDropdownOpen(true)
                    }}
                    onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleKeyDown}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="patient-suggestion-list"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="listbox"
                    role="combobox"
                    aria-activedescendant={dropdownOpen && hoveredIndex >= 0 ? `patient-suggestion-${filteredPatients[hoveredIndex]?.id}` : undefined}
                  />
                  {selectedPatient && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
            onClick={() => {
              onPatientSelect(null)
              setSearchTerm('')
              setDropdownOpen(true)
              inputRef.current?.focus()
            }}
                      aria-label={t('clear') || 'Clear'}
                    >
            <X />
                    </button>
                  )}
        <button 
          className="btn btn-outline-primary" 
          type="button" 
          onClick={() => onAddPatient('')}
          aria-label={t('addNewPatient') || 'Add new patient'}
        >
          <Plus />
        </button>
      </div>

      {/* Dropdown */}
      {searchTerm && !selectedPatient && dropdownOpen && (
        <div ref={dropdownRef} className="position-absolute w-100" style={{ zIndex: 1050 }}>
          <div className="list-group border rounded shadow-sm">
            {filteredPatients.map((patient, idx) => (
                        <button
                key={patient.id}
                id={`patient-suggestion-${patient.id}`}
                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between ${
                  hoveredIndex === idx ? 'active' : ''
                }`}
                onClick={() => {
                  onPatientSelect(patient.id)
                  setSearchTerm('')
                  setDropdownOpen(false)
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                          role="option"
                          aria-selected={hoveredIndex === idx}
              >
                <span className="fw-semibold">{patient.name}</span>
                {patient.phone && (
                  <small className="text-muted">{patient.phone}</small>
                          )}
                        </button>
                      ))}
                      <button
              className={`list-group-item list-group-item-action text-primary ${
                filteredPatients.length === 0 ? 'bg-light' : ''
              } ${hoveredIndex === filteredPatients.length ? 'bg-info-subtle' : ''}`}
                        onClick={() => {
                onAddPatient(searchTerm)
                          setDropdownOpen(false)
                        }}
              onMouseEnter={() => setHoveredIndex(filteredPatients.length)}
                        role="option"
                        aria-selected={hoveredIndex === filteredPatients.length}
                      >
              <Plus className="me-2" />
              {t('addNewPatient') || 'Add new patient'}: <strong>{searchTerm}</strong>
                      </button>
                    </div>
                  </div>
                )}
              </div>
  )
}

// Component for Sales Agent Selection
const SalesAgentSelector = ({ agents, selectedAgent, onAgentSelect, onAddAgent, t }) => (
                <div className="input-group">
    <span className="input-group-text" style={{ minWidth: '80px' }}>
      {t('salesAgentsTitle') || 'Sales Agent'}
    </span>
    <select 
      className="form-select" 
      value={selectedAgent} 
      onChange={(e) => onAgentSelect(e.target.value)}
      aria-label={t('selectAgent') || 'Select sales agent'}
    >
                    <option value="">{t('selectAgent') || 'Select Agent'}</option>
      {agents.map(agent => (
        <option key={agent.id} value={agent.id}>
          {agent.name}
        </option>
      ))}
                  </select>
    <button 
      className="btn btn-outline-primary" 
      type="button" 
      onClick={() => onAddAgent()}
      aria-label={t('addNewAgent') || 'Add new agent'}
    >
      <Plus />
    </button>
                </div>
)

// Component for Product List
const ProductList = ({ products, searchTerm, onSearchChange, onAddToCart, error, loading, t, formatCurrency }) => {
  const filteredProducts = products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!product.isSupplementary || product.canSellStandalone)
  )

  return (
    <>
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <Search />
                  </span>
                  <input
                    type="text"
                    className="form-control"
            placeholder={t('productSearch') || 'Search products...'}
                    value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={t('productSearch') || 'Search products'}
                  />
                </div>
              </div>
      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('loading') || 'Loading...'}</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
                  </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <BoxSeam size={48} className="mb-3" />
          <p>{searchTerm ? (t('noProductsFound') || 'No products found') : (t('noProducts') || 'No products available')}</p>
                  </div>
                ) : (
        <div className="list-group" style={{ maxHeight: '370px', overflowY: 'auto' }}>
          {filteredProducts.map(product => {
            const hasSupplementary = product.supplementaryIds && product.supplementaryIds.length > 0
            const supplementaryProducts = hasSupplementary 
              ? product.supplementaryIds.map(id => products.find(p => p.id === id)).filter(Boolean)
              : []
            
            return (
              <div 
                key={product.id} 
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                      <div className="flex-grow-1">
                  <div className="fw-semibold d-flex align-items-center gap-2">
                    {product.name}
                    {hasSupplementary && (
                      <span className="badge bg-info" title={`Includes: ${supplementaryProducts.map(p => p.name).join(', ')}`}>
                        🧩 {supplementaryProducts.length}
                      </span>
                    )}
                  </div>
                  {product.code && (
                        <div className="text-muted small">{product.code}</div>
                  )}
                  {hasSupplementary && (
                    <div className="text-muted small">
                      <small>Includes: {supplementaryProducts.map(p => p.name).join(', ')}</small>
                    </div>
                  )}
                      </div>
                      <div className="d-flex align-items-center gap-3">
                              <span className="fw-bold">{formatCurrency(product.price)}</span>
                              <button
                                className="btn btn-primary btn-sm"
                    onClick={() => onAddToCart(product)}
                    aria-label={`${t('addToCart') || 'Add'} ${product.name} to cart`}
                              >
                                <Plus />
                              </button>
                      </div>
                    </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// Component for Supplementary Product Display
const SupplementaryItem = ({ item, formatCurrency }) => (
  <div className="ms-3 ps-2 py-0 mb-0">
    <div className="d-flex align-items-center justify-content-between">
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex align-items-center gap-1">
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>+</span>
          <span className="text-muted text-truncate" style={{ fontSize: '0.8rem' }}>
            {item.name}
          </span>
              </div>
            </div>
      <div className="text-end me-3" style={{ minWidth: '80px' }}>
        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
          {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
        </span>
          </div>
        </div>
  </div>
)

// Component for Cart Item
const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  formatCurrency, 
  t, 
  supplementaryItems = [] 
}) => {
  // Calculate bundle totals
  const mainTotal = item.price * item.quantity
  const supplementaryTotal = supplementaryItems.reduce((sum, supp) => sum + (supp.price * supp.quantity), 0)
  const bundleTotal = mainTotal + supplementaryTotal
  const hasSupplementary = supplementaryItems.length > 0

  return (
    <div className="border rounded p-2 mb-1 border-primary">
      <div className="d-flex align-items-center justify-content-between">
        {/* Product Info */}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold text-truncate">
              {item.name}
            </span>
            {hasSupplementary && (
              <span className="badge bg-info" style={{ fontSize: '0.7rem' }}>
                🧩 {supplementaryItems.length}
              </span>
                )}
              </div>
            </div>
        
        {/* Price Info */}
        <div className="text-end me-3" style={{ minWidth: '80px' }}>
          <div className="small text-muted">
            {formatCurrency(item.price)} × {item.quantity}
          </div>
          <div className="fw-bold">
            {formatCurrency(bundleTotal)}
          </div>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center gap-1">
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={e => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: '4rem', textAlign: 'center' }}
            className="form-control form-control-sm d-inline-block p-0 m-0"
            aria-label={t('quantity') || 'Quantity'}
          />
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={() => onRemove(item.id)}
            aria-label={`${t('remove') || 'Remove'} ${item.name} from cart`}
            style={{ padding: '0.25rem 0.5rem' }}
          >
            <Trash size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// Component for Cart Summary
const CartSummary = ({ 
  cart, 
  discount, 
  discountType, 
  onDiscountChange, 
  onDiscountTypeChange, 
  onUpdateQuantity,
  onRemove,
  onClearCart,
  onCompleteSale,
  onPrintInvoice,
  copiesToPrint,
  onCopiesChange,
  selectedPatient,
  t, 
  formatCurrency 
}) => {
  // Group cart items: main products and their supplementary products
  const mainItems = cart.filter(item => !item.isSupplementary)
  const getSupplementaryItems = (parentId) => cart.filter(item => item.isSupplementary && item.supplementaryParentId === parentId)
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  // Ensure discount is a valid number
  const discountValue = isNaN(parseFloat(discount)) || discount === '' || discount === null ? 0 : parseFloat(discount);
  const discountAmount = discountType === 'percent' 
    ? subtotal * (discountValue / 100) 
    : discountValue;
  const total = subtotal - discountAmount;

  return (
    <div className="card h-100 shadow-sm rounded-3">
      <div className="card-header bg-body-tertiary border-bottom pb-2">
        <h5 className="card-title mb-0 text-body-emphasis">{t('cart') || 'Cart'}</h5>
      </div>
      <div className="card-body d-flex flex-column p-3">
        {cart.length === 0 ? (
          <div className="text-center text-muted py-4">
            <BoxSeam size={32} className="mb-2" />
            <p className="mb-0 small">{t('cartEmpty') || 'Cart is empty'}</p>
          </div>
        ) : (
          <>
            {/* Cart Items Table */}
            <div className="flex-grow-1 mb-3" style={{ maxHeight: '260px', overflowY: 'auto' }}>
              <table className="table table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40%' }}>{t('product') || 'Product'}</th>
                    <th className="text-end" style={{ width: '20%' }}>{t('price') || 'Price'}</th>
                    <th className="text-center" style={{ width: '20%' }}>{t('quantity') || 'Qty'}</th>
                    <th className="text-end" style={{ width: '20%' }}>{t('total') || 'Total'}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mainItems.map(item => {
                    const supplementaryItems = getSupplementaryItems(item.id)
                    // Only show parent total (not including supplements)
                    const parentTotal = item.price * item.quantity
                    return (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td>
                            <span className="fw-semibold">{item.name}</span>
                            {supplementaryItems.length > 0 && (
                              <div className="text-muted small mt-1">
                                <span className="badge bg-info me-1">🧩 {supplementaryItems.length}</span>
                                {supplementaryItems.map(supp => supp.name).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="text-end">{formatCurrency(item.price)}</td>
                          <td className="text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              style={{ width: '4rem', textAlign: 'center' }}
                              className="form-control form-control-sm d-inline-block p-0 m-0"
                              aria-label={t('quantity') || 'Quantity'}
                            />
                          </td>
                          <td className="text-end fw-bold">{formatCurrency(parentTotal)}</td>
                          <td className="text-end">
                            <button className="btn btn-outline-danger btn-sm" onClick={() => onRemove(item.id)}><Trash size={12} /></button>
                          </td>
                        </tr>
                        {/* Supplementary Items */}
                        {supplementaryItems.map(suppItem => (
                          <tr key={suppItem.id} className="text-muted small">
                            <td colSpan={2} className="ps-4">+ {suppItem.name}</td>
                            <td className="text-center">{suppItem.quantity}</td>
                            <td className="text-end">{formatCurrency(suppItem.price * suppItem.quantity)}</td>
                            <td></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Totals and Discount */}
            <div className="pt-3 mb-2">
              <div className="row g-2 align-items-center mb-2">
                <div className="col-6 text-muted small">{t('subtotal') || 'Subtotal'}:</div>
                <div className="col-6 text-end small">{formatCurrency(subtotal)}</div>
                <div className="col-6 text-muted small">{t('discount') || 'Discount'}:</div>
                <div className="col-6 text-end">
                  <div className="input-group input-group-sm justify-content-end" style={{ maxWidth: 180, marginLeft: 'auto' }}>
                    <input type="number" className="form-control" placeholder={t('discount') || 'Discount'} value={discount} onChange={e => onDiscountChange(e.target.value)} min="0" step="0.01" />
                    <select className="form-select" value={discountType} onChange={e => onDiscountTypeChange(e.target.value)} style={{ maxWidth: '90px' }}>
                      <option value="fixed">{t('fixed') || 'Fixed'}</option>
                      <option value="percent">{t('percent') || 'Percent'}</option>
                    </select>
                  </div>
                </div>
                <div className="col-6 fw-bold">{t('totalAmount') || 'Total'}:</div>
                <div className="col-6 text-end fw-bold">{formatCurrency(total)}</div>
              </div>
            </div>
            {/* Print Copies */}
            <div className="mb-2">
              <label className="form-label small mb-1">{t('copiesToPrint') || 'Copies to Print'}</label>
              <div className="input-group input-group-sm" style={{ maxWidth: 180 }}>
                <span className="input-group-text"><Printer /></span>
                <input type="number" className="form-control" value={copiesToPrint} onChange={e => onCopiesChange(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="10" />
                <span className="input-group-text">{t('copies') || 'copies'}</span>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="d-grid gap-2 mt-3">
              <button className="btn btn-success btn-lg" onClick={onCompleteSale} disabled={cart.length === 0 || !selectedPatient}>
                {t('completeSale') || 'Complete Sale'}
              </button>
              <div className="btn-group">
                <button className="btn btn-outline-secondary btn-sm" onClick={onClearCart} disabled={cart.length === 0}>
                  {t('clearCart') || 'Clear Cart'}
                </button>
                <button className="btn btn-outline-primary btn-sm" disabled={cart.length === 0 || !selectedPatient} onClick={onPrintInvoice}>
                  <Invoice className="me-1" /> {t('previewInvoice') || 'Preview Invoice'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Custom hook for cart operations
const useCart = (products) => {
  const [cart, setCart] = useState([])
  const addToCart = useCallback((product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && !item.isSupplementary)
      if (existingItem) {
        // Update main product quantity
        const updatedCart = prevCart.map(item =>
          item.id === product.id && !item.isSupplementary
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        
        // Update supplementary products quantities to match
        if (product.supplementaryIds && product.supplementaryIds.length > 0) {
          return updatedCart.map(item =>
            item.isSupplementary && item.supplementaryParentId === product.id
              ? { ...item, quantity: existingItem.quantity + 1 }
              : item
          )
        }
        
        return updatedCart
      } else {
        // Add main product
        const newCart = [...prevCart, { ...product, quantity: 1, isSupplementary: false }]
        
        // Add supplementary products if any
        if (product.supplementaryIds && product.supplementaryIds.length > 0) {
          const supplementaryProducts = product.supplementaryIds.map(suppId => {
            const suppProduct = products.find(p => p.id === suppId)
            return suppProduct ? {
              ...suppProduct,
              quantity: 1,
              isSupplementary: true,
              supplementaryParentId: product.id
            } : null
          }).filter(Boolean)
          
          return [...newCart, ...supplementaryProducts]
        }
        
        return newCart
      }
    })
  }, [products])

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId)
      if (!item) return prevCart
      
      // Update the target item
      const updatedCart = prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
      
      // If it's a main product, update its supplementary products
      if (!item.isSupplementary && item.supplementaryIds && item.supplementaryIds.length > 0) {
        return updatedCart.map(cartItem =>
          cartItem.isSupplementary && cartItem.supplementaryParentId === productId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      }
      
      // If it's a supplementary product, update its parent
      if (item.isSupplementary && item.supplementaryParentId) {
        return updatedCart.map(cartItem =>
          cartItem.id === item.supplementaryParentId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      }
      
      return updatedCart
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId)
      if (!item) return prevCart
      
      // If removing a main product, also remove its supplementary products
      if (!item.isSupplementary) {
        return prevCart.filter(cartItem => 
          cartItem.id !== productId && 
          !(cartItem.isSupplementary && cartItem.supplementaryParentId === productId)
        )
      }
      
      // If removing a supplementary product, also remove its parent
      if (item.isSupplementary && item.supplementaryParentId) {
        return prevCart.filter(cartItem => 
          cartItem.id !== productId && 
          cartItem.id !== item.supplementaryParentId
        )
      }
      
      // Regular removal
      return prevCart.filter(item => item.id !== productId)
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  }
}

// Main POS Component
function POS() {
  // State management
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [patientForm, setPatientForm] = useState({ 
    name: '', 
    age: '', 
    gender: '', 
    phone: '', 
    email: '', 
    address: '', 
    isActive: true 
  })
  const [savingPatient, setSavingPatient] = useState(false)
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [agentForm, setAgentForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    isActive: true 
  })
  const [savingAgent, setSavingAgent] = useState(false)
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState('fixed')
  const [copiesToPrint, setCopiesToPrint] = useState(2)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [invoiceSaleId, setInvoiceSaleId] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'error' });

  // Custom hooks
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart(products)
  const [showClearCartModal, setShowClearCartModal] = useState(false)
  const handleClearCart = () => setShowClearCartModal(true)
  const handleCancelClearCart = () => setShowClearCartModal(false)
  const doClearCart = useCallback(() => {
    clearCart()
    setDiscount('')
    setDiscountType('percent')
    setSelectedPatient(null)
    setSelectedAgent('')
    setCopiesToPrint(1)
    setShowClearCartModal(false)
  }, [clearCart])

  // Hooks
  const { t } = useTranslations()
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        
        const [productsRes, patientsRes, agentsRes, settingsRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/products`),
          axios.get(`${API_BASE}/api/patients`),
          axios.get(`${API_BASE}/api/sales-agents`),
          axios.get(`${API_BASE}/api/settings`)
        ])

        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data)
        }
        if (patientsRes.status === 'fulfilled') {
          setPatients(patientsRes.value.data)
        }
        if (agentsRes.status === 'fulfilled') {
          setAgents(agentsRes.value.data)
        }
        if (settingsRes.status === 'fulfilled') {
          const brandingSetting = settingsRes.value.data.find(s => s.key === 'branding')
          if (brandingSetting?.value?.hospitalName) {
            // setBranding(brandingSetting.value) // This line was removed
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Escape key handler for modals
  useEffect(() => {
    if (!showPatientModal && !showAgentModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showPatientModal) setShowPatientModal(false);
        if (showAgentModal) setShowAgentModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPatientModal, showAgentModal]);

  // Form handlers
  const handlePatientFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setPatientForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSavePatient = async (e) => {
    e.preventDefault()
    setSavingPatient(true)
    try {
      const res = await axios.post(`${API_BASE}/api/patients`, patientForm)
      setPatients(prev => [...prev, res.data])
      setSelectedPatient(res.data.id)
      setShowPatientModal(false)
      setPatientForm({ name: '', age: '', gender: '', phone: '', email: '', address: '', isActive: true })
    } catch (err) {
      console.error('Failed to save patient:', err)
      setToast({ message: t('patientSaveFailed') || 'Failed to save patient', type: 'error' });
    } finally {
      setSavingPatient(false)
    }
  }

  const handleAgentFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setAgentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveAgent = async (e) => {
    e.preventDefault()
    setSavingAgent(true)
    try {
      const res = await axios.post(`${API_BASE}/api/sales-agents`, agentForm)
      setAgents(prev => [...prev, res.data])
      setSelectedAgent(res.data.id)
      setShowAgentModal(false)
      setAgentForm({ name: '', phone: '', email: '', isActive: true })
    } catch (err) {
      console.error('Failed to save agent:', err)
      setToast({ message: t('agentSaveFailed') || 'Failed to save agent', type: 'error' });
    } finally {
      setSavingAgent(false)
    }
  }

  // Sale operations
  const handleCompleteSale = async () => {
    if (cart.length === 0 || !selectedPatient) return

    try {
      const saleData = {
        patientId: selectedPatient,
        salesAgentId: selectedAgent || null,
        cashierId: user.id,
        items: cart
          .filter(item => !item.isSupplementary && !item.supplementaryParentId)
          .map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            supplementaryIds: item.supplementaryIds || []
          })),
        discount: parseFloat(discount) || 0,
        discountType: discountType
      }

      const response = await axios.post(`${API_BASE}/api/sales`, saleData)
      // Print in browser popup
      const popup = window.open('', '_blank', 'width=900,height=1200');
      if (!popup) return;
      popup.document.write('<html><head><title>Invoice</title>');
      popup.document.write('<link rel="stylesheet" href="/index.css" />');
      popup.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />');
      popup.document.write('</head><body><div id="invoice-root"></div></body></html>');
      popup.document.close();
      popup.onload = () => {
        import('react-dom/client').then(ReactDOM => {
          import('./Invoice').then(({ default: InvoicePage }) => {
            const root = ReactDOM.createRoot(popup.document.getElementById('invoice-root'));
            // Render the invoice N times, each wrapped in a div with a page break
            root.render(
              React.createElement(
                React.Fragment,
                null,
                Array.from({ length: copiesToPrint }).map((_, i) =>
                  React.createElement(
                    'div',
                    { key: i, style: { pageBreakAfter: 'always' } },
                    React.createElement(InvoicePage, { saleId: response.data.id })
                  )
                )
              )
            );
            // Wait for content, then print
            const observer = new popup.MutationObserver(() => {
              observer.disconnect();
              setTimeout(() => {
                popup.focus();
                popup.print();
                popup.close();
              }, 1200);
            });
            observer.observe(popup.document.getElementById('invoice-root'), { childList: true, subtree: true });
          });
        });
      };
      doClearCart();
    } catch (error) {
      console.error('Sale failed:', error)
      setToast({ message: t('saleFailed') || 'Failed to complete sale. Please try again.', type: 'error' });
    }
  }

  // Preview Invoice (does NOT clear cart or reset POS)
  const handlePreviewInvoice = async () => {
    if (cart.length === 0 || !selectedPatient) return
    try {
      const saleData = {
        patientId: selectedPatient,
        salesAgentId: selectedAgent || null,
        cashierId: user.id,
        items: cart
          .filter(item => !item.isSupplementary && !item.supplementaryParentId)
          .map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            supplementaryIds: item.supplementaryIds || []
          })),
        discount: parseFloat(discount) || 0,
        discountType: discountType
      }
      const response = await axios.post(`${API_BASE}/api/sales`, saleData)
      openInvoiceModal({ saleId: response.data.id })
      // Do NOT clear cart or reset POS
    } catch (error) {
      console.error('Invoice preview failed:', error)
      setToast({ message: t('invoiceFailed') || 'Failed to preview invoice. Please try again.', type: 'error' });
    }
  }

  // Invoice preview in modal
  const openInvoiceModal = (invoiceData) => {
    setInvoiceSaleId(invoiceData.saleId);
    setShowInvoiceModal(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">{t('loading') || 'Loading...'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid">
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
      )}
      <div className="row g-4">
                 {/* Left Column - Patient, Agent, Products */}
         <div className="col-lg-6">
           {/* Patient & Agent Selection */}
           <div className="row g-2 mb-3">
             <div className="col-12">
               <PatientSelector
                 patients={patients}
                 selectedPatient={selectedPatient}
                 onPatientSelect={setSelectedPatient}
                 onAddPatient={(name) => {
                   setPatientForm(prev => ({ ...prev, name }))
                   setShowPatientModal(true)
                 }}
                 t={t}
               />
                      </div>
             <div className="col-12">
               <SalesAgentSelector
                 agents={agents}
                 selectedAgent={selectedAgent}
                 onAgentSelect={setSelectedAgent}
                 onAddAgent={() => setShowAgentModal(true)}
                 t={t}
               />
                    </div>
                  </div>

          {/* Products Section */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">{t('posTitle') || 'Point of Sale'}</h5>
            </div>
            <div className="card-body">
              <ProductList
                products={products}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddToCart={addToCart}
                error={error}
                loading={loading}
                t={t}
                formatCurrency={formatCurrency}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Cart */}
        <div className="col-lg-6">
          <div className="" style={{ top: '1rem'}}>
                         <CartSummary
               cart={cart}
               discount={discount}
               discountType={discountType}
               onDiscountChange={setDiscount}
               onDiscountTypeChange={setDiscountType}
               onUpdateQuantity={updateQuantity}
               onRemove={removeFromCart}
               onClearCart={handleClearCart}
               onCompleteSale={handleCompleteSale}
               onPrintInvoice={handlePreviewInvoice}
               copiesToPrint={copiesToPrint}
               onCopiesChange={setCopiesToPrint}
               selectedPatient={selectedPatient}
               t={t}
               formatCurrency={formatCurrency}
             />
          </div>
        </div>
      </div>

      {/* Patient Modal */}
        {showPatientModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={handleSavePatient}>
                <div className="modal-header">
                <h5 className="modal-title">
                  <Plus className="text-primary me-2" />
                  {t('newPatient') || 'New Patient'}
                  </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowPatientModal(false)}
                  aria-label={t('close') || 'Close'}
                />
                </div>
                <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-7">
                    <label className="form-label">{t('name') || 'Name'}</label>
                      <div className="input-group">
                      <span className="input-group-text">
                        <Person />
                      </span>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="name" 
                        placeholder={t('name') || 'Name'} 
                        value={patientForm.name} 
                        onChange={handlePatientFormChange} 
                        required 
                      />
                      </div>
                    </div>
                  <div className="col-md-5">
                    <label className="form-label">{t('age') || 'Age'}</label>
                      <div className="input-group">
                      <span className="input-group-text">
                        <BoxSeam />
                      </span>
                      <input 
                        type="number" 
                        className="form-control" 
                        name="age" 
                        placeholder={t('age') || 'Age'} 
                        value={patientForm.age} 
                        onChange={handlePatientFormChange} 
                        min="0" 
                      />
                      </div>
                    </div>
                  <div className="col-12">
                    <label className="form-label">{t('gender') || 'Gender'}</label>
                    <div className="btn-group w-100" role="group" aria-label={t('gender') || 'Gender'}>
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="gender" 
                        id="gender-male" 
                        value="male" 
                        checked={patientForm.gender === 'male'} 
                        onChange={handlePatientFormChange} 
                      />
                      <label className="btn btn-outline-secondary" htmlFor="gender-male">
                        <GenderMale className="me-1" />
                        {t('male') || 'Male'}
                      </label>
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="gender" 
                        id="gender-female" 
                        value="female" 
                        checked={patientForm.gender === 'female'} 
                        onChange={handlePatientFormChange} 
                      />
                      <label className="btn btn-outline-secondary" htmlFor="gender-female">
                        <GenderFemale className="me-1" />
                        {t('female') || 'Female'}
                      </label>
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="gender" 
                        id="gender-other" 
                        value="other" 
                        checked={patientForm.gender === 'other'} 
                        onChange={handlePatientFormChange} 
                      />
                      <label className="btn btn-outline-secondary" htmlFor="gender-other">
                        <GenderAmbiguous className="me-1" />
                        {t('other') || 'Other'}
                      </label>
                  </div>
                    </div>
                  <div className="col-12">
                    <label className="form-label">{t('phone') || 'Phone'}</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Telephone />
                      </span>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="phone" 
                        placeholder={t('phone') || 'Phone'} 
                        value={patientForm.phone} 
                        onChange={handlePatientFormChange} 
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('email') || 'Email'}</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Envelope />
                      </span>
                      <input 
                        type="email" 
                        className="form-control" 
                        name="email" 
                        placeholder={t('email') || 'Email'} 
                        value={patientForm.email} 
                        onChange={handlePatientFormChange} 
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('address') || 'Address'}</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <GeoAlt />
                      </span>
                      <textarea 
                        className="form-control" 
                        name="address" 
                        placeholder={t('address') || 'Address'} 
                        value={patientForm.address} 
                        onChange={handlePatientFormChange} 
                        rows={2} 
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        name="isActive" 
                        checked={patientForm.isActive} 
                        onChange={handlePatientFormChange} 
                        id="isActiveCheck" 
                      />
                      <label className="form-check-label" htmlFor="isActiveCheck">
                        {t('active') || 'Active'}
                      </label>
                  </div>
                </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPatientModal(false)}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingPatient}
                >
                  {savingPatient ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Plus className="me-2" />
                      {t('save') || 'Save'}
                    </>
                  )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Agent Modal */}
        {showAgentModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
              <form className="modal-content" onSubmit={handleSaveAgent}>
                <div className="modal-header">
                <h5 className="modal-title">
                  <Plus className="text-primary me-2" />
                  {t('newAgent') || 'New Sales Agent'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAgentModal(false)}
                  aria-label={t('close') || 'Close'}
                />
                </div>
                <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">{t('name') || 'Name'}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name" 
                      value={agentForm.name} 
                      onChange={handleAgentFormChange} 
                      required 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('phone') || 'Phone'}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="phone" 
                      value={agentForm.phone} 
                      onChange={handleAgentFormChange} 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('email') || 'Email'}</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email" 
                      value={agentForm.email} 
                      onChange={handleAgentFormChange} 
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        name="isActive" 
                        checked={agentForm.isActive} 
                        onChange={handleAgentFormChange} 
                        id="isActiveAgentCheck" 
                      />
                      <label className="form-check-label" htmlFor="isActiveAgentCheck">
                        {t('active') || 'Active'}
                      </label>
                    </div>
                  </div>
                  </div>
                </div>
                <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAgentModal(false)}
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={savingAgent}
                >
                  {savingAgent ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Plus className="me-2" />
                      {t('save') || 'Save'}
                    </>
                  )}
                </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Invoice Preview Modal */}
      <Modal
        show={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title={t('invoice') || 'Invoice'}
        size="xl"
        footer={<button className="btn btn-secondary" onClick={() => setShowInvoiceModal(false)}>{t('close') || 'Close'}</button>}
      >
        {invoiceSaleId && (
          <Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border" /></div>}>
            <InvoicePage saleId={invoiceSaleId} />
          </Suspense>
        )}
      </Modal>

      {/* Clear Cart Confirmation Modal */}
      <Modal show={showClearCartModal} onClose={handleCancelClearCart} title={t('clearCart') || 'Clear Cart'}>
        <div className="mb-3">{t('clearCartConfirm') || 'Are you sure you want to clear the cart?'}</div>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary" onClick={handleCancelClearCart}>{t('cancel') || 'Cancel'}</button>
          <button className="btn btn-danger" onClick={doClearCart}>{t('clearCart') || 'Clear Cart'}</button>
        </div>
      </Modal>
    </div>
  )
}

export default POS 
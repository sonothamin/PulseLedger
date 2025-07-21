import { useEffect, useState } from 'react'
import { X } from 'react-bootstrap-icons'

function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (!message) return

    // Start fade out animation after duration
    const timer = setTimeout(() => {
      setIsFading(true)
      // Remove toast after fade animation completes
      setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, 300) // 300ms fade animation duration
    }, duration)

    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!isVisible || !message) return null

  const getToastClasses = () => {
    const baseClasses = 'toast show position-fixed bottom-0 end-0 m-4'
    const fadeClasses = isFading ? 'fade-out' : 'fade-in'
    
    let typeClasses = ''
    switch (type) {
      case 'success':
        typeClasses = 'border-success'
        break
      case 'error':
        typeClasses = 'border-danger'
        break
      case 'warning':
        typeClasses = 'border-warning'
        break
      default:
        typeClasses = 'border-info'
    }
    
    return `${baseClasses} ${typeClasses} ${fadeClasses}`
  }

  const getHeaderClasses = () => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'error':
        return 'text-danger'
      case 'warning':
        return 'text-warning'
      default:
        return 'text-info'
    }
  }

  const handleManualClose = () => {
    setIsFading(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  return (
    <div className={getToastClasses()} style={{ zIndex: 9999, transition: 'opacity 0.3s ease-in-out' }}>
      <div className="toast-header">
        <strong className={`me-auto ${getHeaderClasses()}`}>
          {type === 'success' && 'Success'}
          {type === 'error' && 'Error'}
          {type === 'warning' && 'Warning'}
          {type === 'info' && 'Information'}
        </strong>
        <button 
          type="button" 
          className="btn-close" 
          onClick={handleManualClose}
          aria-label="Close"
        />
      </div>
      <div className="toast-body">{message}</div>
    </div>
  )
}

export default Toast 
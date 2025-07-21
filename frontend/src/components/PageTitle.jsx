import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslations } from '../hooks/useTranslations'

function PageTitle() {
  const location = useLocation()
  const { t } = useTranslations()

  useEffect(() => {
    const setTitle = () => {
      let titleKey = ''
      
      // Map routes to title keys
      switch (location.pathname) {
        case '/':
          titleKey = 'pageDashboard'
          break
        case '/pos':
          titleKey = 'pagePOS'
          break
        case '/sales':
          titleKey = 'pageSales'
          break
        case '/expenses':
          titleKey = 'pageExpenses'
          break
        case '/products':
          titleKey = 'pageProducts'
          break
        case '/users':
          titleKey = 'pageUsers'
          break
        case '/roles':
          titleKey = 'pageRoles'
          break
        case '/settings':
          titleKey = 'pageSettings'
          break
        case '/login':
          titleKey = 'pageLogin'
          break
        case '/sales-agents':
          titleKey = 'pageSalesAgents'
          break
        default:
          titleKey = 'pageDashboard'
      }
      
      const title = t(titleKey, titleKey)
      document.title = title
    }

    setTitle()
  }, [location.pathname, t])

  return null // This component doesn't render anything
}

export default PageTitle 
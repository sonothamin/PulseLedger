import { useEffect, useState, useCallback, useRef } from 'react'
import axios from 'axios'
import { Globe, Building, CurrencyDollar, Check, Upload, X, InfoCircle, Image, CheckCircleFill, FileEarmarkText, ArrowUpCircle, Hospital, Quote, Lightbulb, GeoAlt, Map, Telephone, Phone, Envelope, Facebook, Translate, Calendar3, CalendarCheck, Clock, ClockHistory, CurrencyExchange, CodeSlash, CardText, ArrowLeftRight } from 'react-bootstrap-icons'

import { useTranslations } from '../hooks/useTranslations'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState('localization')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [pendingChanges, setPendingChanges] = useState({})
  const [pendingLogoFile, setPendingLogoFile] = useState(null)
  
  // Use translations hook
  const { t, currentLanguage, changeLanguage, availableLanguages } = useTranslations()
  
  // Local state for language (to prevent auto-saving)
  const [localLanguage, setLocalLanguage] = useState(currentLanguage)

  // Ref for TimezoneSelector
  const timezoneRef = useRef()

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/settings')
      const settingsMap = {}
      res.data.forEach(setting => {
        settingsMap[setting.key] = setting
      })
      setSettings(settingsMap)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  // Cleanup object URL when component unmounts or pending file changes
  useEffect(() => {
    return () => {
      // Cleanup any object URLs when component unmounts
    }
  }, [pendingLogoFile])

  const updateSetting = async (key, value) => {
    setSaving(true)
    try {
      const setting = settings[key]
      if (setting) {
        await axios.put(`/api/settings/${setting.id}`, {
          key: setting.key,
          value: value,
          description: setting.description
        })
        setSettings(prev => ({
          ...prev,
          [key]: { ...prev[key], value }
        }))
        setToast(t('settingsSaved'))
      } else {
        await axios.post('/api/settings', {
          key,
          value,
          description: `${key} settings`
        })
        await fetchSettings()
        setToast(t('settingsSaved'))
      }
    } catch (err) {
      console.error('Error updating setting:', err)
      setToast(t('settingsError'))
    } finally {
      setSaving(false)
      setHasUnsavedChanges(false)
      setPendingChanges({})
      setPendingLogoFile(null)
    }
  }

  const handleSaveAll = async () => {
    if (Object.keys(pendingChanges).length === 0 && !pendingLogoFile) return
    
    // Get timezone value from ref if it exists
    if (timezoneRef.current) {
      const timezoneValue = timezoneRef.current.getValue()
      const current = settings.localization?.value || {}
      const updated = { ...current, timezone: timezoneValue }
      setPendingChanges(prev => ({ ...prev, localization: updated }))
    }
    
    // Handle language changes first (these are stored in localStorage)
    if (pendingChanges.language) {
      localStorage.setItem('language', pendingChanges.language)
      changeLanguage(pendingChanges.language) // Apply language immediately
    }
    
    // If there is a pending logo file, upload it first and update branding
    let brandingWithLogo = null;
    let brandingChanged = false;
    if (pendingLogoFile) {
      const file = pendingLogoFile;
      const formData = new FormData();
      formData.append('logo', file);
      try {
        const response = await axios.post('/api/settings/upload-logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const current = settings.branding?.value || {};
        brandingWithLogo = { ...current, ...pendingChanges.branding, logo: response.data.logoUrl };
        // Save branding with new logo
        await updateSetting('branding', brandingWithLogo);
        brandingChanged = true;
      } catch (error) {
        setToast(t('failedToUploadLogo'));
        return;
      }
    }
    
    // Save all other pending changes (excluding branding if already handled above, and language which is handled above)
    for (const [key, value] of Object.entries({ ...pendingChanges })) {
      if (key === 'branding' && brandingWithLogo) continue; // already saved above
      if (key === 'language') continue; // handled above
      await updateSetting(key, value);
      if (key === 'branding') brandingChanged = true;
    }
    
    // If branding was changed, prompt for reload
    if (brandingChanged) {
      setTimeout(() => {
        if (window.confirm('Branding settings updated. Reload the page to see changes?')) {
          window.location.reload();
        }
      }, 100);
    }
    
    setToast(t('settingsSavedSuccessfully'))
    
    // Refresh settings to ensure currency updates are reflected
    await fetchSettings()
  }

  const handleLocalizationChange = (field, value) => {
    // Get current localization from pending changes OR original settings
    const currentPending = pendingChanges.localization || {}
    const currentOriginal = settings.localization?.value || {}
    const current = { ...currentOriginal, ...currentPending }
    
    const updated = { ...current, [field]: value }
    setPendingChanges(prev => ({ ...prev, localization: updated }))
    setHasUnsavedChanges(true)
  }

  const handleBrandingChange = (field, value) => {
    // Get current branding from pending changes OR original settings
    const currentPending = pendingChanges.branding || {}
    const currentOriginal = settings.branding?.value || {}
    const current = { ...currentOriginal, ...currentPending }
    
    const updated = { ...current, [field]: value }
    setPendingChanges(prev => ({ ...prev, branding: updated }))
    setHasUnsavedChanges(true)
  }

  const handleLanguageChange = (newLanguage) => {
    // Store language change in pending changes instead of auto-saving
    setPendingChanges(prev => ({ ...prev, language: newLanguage }))
    setHasUnsavedChanges(true)
    // Update local language for immediate UI feedback
    setLocalLanguage(newLanguage)
  }

  const handleCurrencyChange = (field, value) => {
    const currentPending = pendingChanges.currency || {}
    const currentOriginal = settings.currency?.value || {}
    const current = { ...currentOriginal, ...currentPending }
    const updated = { ...current, [field]: value }
    setPendingChanges(prev => ({ ...prev, currency: updated }))
    setHasUnsavedChanges(true)
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast('File size must be less than 2MB')
      return
    }

    setPendingLogoFile(file)
    setHasUnsavedChanges(true)
    setToast('Logo ready to upload. Click Save Settings to apply.')
  }

  const removeLogo = () => {
    const current = settings.branding?.value || {}
    const updated = { ...current, logo: null }
    setPendingChanges(prev => ({ ...prev, branding: updated }))
    setPendingLogoFile(null)
    setHasUnsavedChanges(true)
  }

  const tabs = [
    { id: 'localization', label: t('localization'), icon: <Globe /> },
    { id: 'branding', label: t('branding'), icon: <Building /> },
    { id: 'currency', label: t('currency'), icon: <CurrencyDollar /> }
  ]

  const localization = pendingChanges.localization || settings.localization?.value || {}
  const branding = { ...settings.branding?.value, ...pendingChanges.branding } || {}
  const currency = pendingChanges.currency || settings.currency?.value || {}

  // Handle logo source with proper fallback
  const rawLogoSrc = branding.logo || settings.branding?.value?.logo || null;
  const logoSrc = rawLogoSrc?.startsWith('/uploads/') 
    ? `${API_BASE}${rawLogoSrc}` 
    : rawLogoSrc;

  // Helper for merging settings
  function mergeSettings(original, pending) {
    return { ...original, ...pending };
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border" />
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t('systemSettings')}</h2>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2" 
          onClick={handleSaveAll}
          disabled={!hasUnsavedChanges || saving}
        >
          {saving ? (
            <>
              <div className="spinner-border spinner-border-sm" />
              {t('saving')}
            </>
          ) : (
            <>
              <Check />
              {t('saveSettings')}
            </>
          )}
        </button>
      </div>
      
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.id}>
            <button
              className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
              style={{ borderBottomLeftRadius: '0', borderBottomRightRadius: '0' }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Localization Settings */}
        {activeTab === 'localization' && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Globe className="text-primary" />
                <h5 className="mb-0">{t('localization')}</h5>
              </div>
              <p className="text-muted mb-0 small">
                <InfoCircle className="me-1" />
                {t('localizationHelp')}
              </p>
            </div>
            <div className="card-body pb-0">
              <div className="row g-4">
                <div className="col-12">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label mb-1 d-flex align-items-center gap-2">
                        <Translate className="text-primary" />
                        {t('language') || 'Language'}
                      </label>
                      <select
                        className="form-select"
                        value={localLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                      >
                        {availableLanguages.map(({code, display}) => (
                          <option key={code} value={code}>
                            {display}
                          </option>
                        ))}
                      </select>
                      <div className="form-text">
                        <InfoCircle className="me-1" />
                        {t('primaryLanguageHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label mb-1 d-flex align-items-center gap-2">
                        <Calendar3 className="text-primary" />
                        {t('dateFormat') || 'Date Format'}
                      </label>
                      <select
                        className="form-select"
                        value={localization.dateFormat || 'MM/DD/YYYY'}
                        onChange={(e) => handleLocalizationChange('dateFormat', e.target.value)}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      </select>
                      <div className="form-text">
                        <CalendarCheck className="me-1" />
                        {t('dateFormatHelp')}
                      </div>
                    </div>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label className="form-label mb-1 d-flex align-items-center gap-2">
                        <Calendar3 className="text-primary" />
                        {t('startOfWeek') || 'Start of Week'}
                      </label>
                      <select
                        className="form-select"
                        value={localization.startOfWeek || 'sunday'}
                        onChange={(e) => handleLocalizationChange('startOfWeek', e.target.value)}
                      >
                        <option value="sunday">{t('sunday') || 'Sunday'}</option>
                        <option value="monday">{t('monday') || 'Monday'}</option>
                        <option value="tuesday">{t('tuesday') || 'Tuesday'}</option>
                        <option value="wednesday">{t('wednesday') || 'Wednesday'}</option>
                        <option value="thursday">{t('thursday') || 'Thursday'}</option>
                        <option value="friday">{t('friday') || 'Friday'}</option>
                        <option value="saturday">{t('saturday') || 'Saturday'}</option>
                      </select>
                      <div className="form-text">
                        <CalendarCheck className="me-1" />
                        {t('startOfWeekDescription')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branding Settings */}
        {activeTab === 'branding' && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <Building className="text-primary" />
                <h5 className="mb-0">{t('branding')}</h5>
              </div>
              <p className="text-muted mb-0 small">
                <InfoCircle className="me-1" />
                {t('brandingHelp')}
              </p>
            </div>
            <div className="card-body">
              <div className="row g-4">
                {/* Logo Section */}
                <div className="col-12">
                  <div className="border rounded p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <Image className="text-primary" />
                        <div>
                          <h6 className="mb-1">{t('hospitalLogo')}</h6>
                          <p className="text-muted small mb-0">
                            <InfoCircle className="me-1" />
                            {t('uploadLogoHelp')}
                          </p>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                          onClick={() => document.getElementById('logo-upload').click()}
                        >
                          <Upload />
                          {t('chooseLogo') || 'Choose Logo'}
                        </button>
                        <input
                          type="file"
                          className="d-none"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          id="logo-upload"
                        />
                        {(logoSrc || pendingLogoFile) && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm d-flex align-items-center"
                            onClick={() => {
                              if (window.confirm(t('confirmRemoveLogo') || 'Are you sure you want to remove the logo?')) {
                                removeLogo();
                              }
                            }}
                            title={t('removeLogo') || 'Remove Logo'}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {(logoSrc || pendingLogoFile) ? (
                                              <div className="d-flex align-items-center gap-3">
                        <div className="border rounded d-flex align-items-center justify-content-center bg-body-secondary"
                               style={{ 
                                 width: '120px', 
                                 height: '120px',
                               overflow: 'hidden'
                               }}>
                            <img 
                              src={pendingLogoFile ? URL.createObjectURL(pendingLogoFile) : logoSrc}
                              alt="Hospital Logo"
                              className="img-fluid"
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                console.error('Failed to load logo:', logoSrc);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <CheckCircleFill className={pendingLogoFile ? "text-warning" : "text-success"} />
                            <span className={`fw-medium ${pendingLogoFile ? "text-warning" : "text-success"}`}>
                              {pendingLogoFile ? t('logoReadyToUpload') : t('logoUploaded')}
                            </span>
                          </div>
                          <p className="text-muted small mb-0">
                            <FileEarmarkText className="me-1" />
                            {pendingLogoFile 
                              ? t('logoSavePrompt')
                              : t('logoAppearHelp')
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded d-flex align-items-center justify-content-center bg-body-tertiary"
                           style={{ 
                             height: '120px',
                             borderColor: 'var(--bs-border-color)'
                           }}>
                        <div className="text-center">
                          <Image className="display-5 text-muted mb-2" size={48} />
                          <p className="mb-1 fw-medium text-muted">{t('noLogoSelected') || 'No logo selected'}</p>
                          <p className="small text-muted">
                            <ArrowUpCircle className="me-1" />
                            Click "Choose Logo" to upload your hospital logo
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Hospital Information */}
                <div className="col-12">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Building className="text-primary" />
                    <h6 className="mb-0">{t('hospitalInfo')}</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Hospital className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={branding.hospitalName || ''}
                          onChange={(e) => handleBrandingChange('hospitalName', e.target.value)}
                          placeholder={t('enterHospitalName')}
                        />
                      </div>
                      <div className="form-text">
                        <InfoCircle className="me-1" />
                        {t('hospitalNameHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Quote className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={branding.tagline || ''}
                          onChange={(e) => handleBrandingChange('tagline', e.target.value)}
                          placeholder={t('enterTagline')}
                        />
                      </div>
                      <div className="form-text">
                        <Lightbulb className="me-1" />
                        {t('taglineHelp')}
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="input-group">
                        <span className="input-group-text">
                          <GeoAlt className="text-muted" />
                        </span>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={branding.address || ''}
                          onChange={(e) => handleBrandingChange('address', e.target.value)}
                          placeholder={t('enterAddress')}
                        />
                      </div>
                      <div className="form-text">
                        <Map className="me-1" />
                        {t('addressHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Telephone className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={branding.contactNumber || ''}
                          onChange={(e) => handleBrandingChange('contactNumber', e.target.value)}
                          placeholder={t('enterContact')}
                        />
                      </div>
                      <div className="form-text">
                        <Phone className="me-1" />
                        {t('contactHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Envelope className="text-muted" />
                        </span>
                        <input
                          type="email"
                          className="form-control"
                          value={branding.email || ''}
                          onChange={(e) => handleBrandingChange('email', e.target.value)}
                          placeholder={t('enterEmail')}
                        />
                      </div>
                      <div className="form-text">
                        <Envelope className="me-1" />
                        {t('emailHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Facebook className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={branding.facebookId || ''}
                          onChange={(e) => handleBrandingChange('facebookId', e.target.value)}
                          placeholder={t('enterFacebookId')}
                        />
                      </div>
                      <div className="form-text">
                        <Facebook className="me-1" />
                        {t('facebookHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <Globe className="text-muted" />
                        </span>
                        <input
                          type="url"
                          className="form-control"
                          value={branding.website || ''}
                          onChange={(e) => handleBrandingChange('website', e.target.value)}
                          placeholder={t('enterWebsiteUrl')}
                        />
                      </div>
                      <div className="form-text">
                        <Globe className="me-1" />
                        {t('websiteHelp')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Currency Settings */}
        {activeTab === 'currency' && (
          <div className="card">
            <div className="card-header">
              <div className="d-flex align-items-center gap-2">
                <CurrencyDollar className="text-primary" />
                <h5 className="mb-0">{t('currency')}</h5>
              </div>
              <p className="text-muted mb-0 small">
                <InfoCircle className="me-1" />
                {t('currencyHelp')}
              </p>
            </div>
            <div className="card-body">
              <div className="row g-4">
                <div className="col-12">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <CurrencyExchange className="text-primary" />
                    <h6 className="mb-0">{t('currencyConfig')}</h6>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <CurrencyDollar className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={currency.symbol || ''}
                          onChange={(e) => handleCurrencyChange('symbol', e.target.value)}
                          placeholder={t('enterSymbol')}
                        />
                      </div>
                      <div className="form-text">
                        <InfoCircle className="me-1" />
                        {t('currencySymbolHelp')}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="input-group">
                        <span className="input-group-text">
                          <CodeSlash className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={currency.code || ''}
                          onChange={(e) => handleCurrencyChange('code', e.target.value)}
                          placeholder={t('enterCode')}
                        />
                      </div>
                      <div className="form-text">
                        <InfoCircle className="me-1" />
                        {t('currencyCodeHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <CardText className="text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={currency.name || ''}
                          onChange={(e) => handleCurrencyChange('name', e.target.value)}
                          placeholder={t('enterName')}
                        />
                      </div>
                      <div className="form-text">
                        <InfoCircle className="me-1" />
                        {t('currencyNameHelp')}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text">
                          <ArrowLeftRight className="text-muted" />
                        </span>
                        <select
                          className="form-select"
                          value={currency.position || 'before'}
                          onChange={(e) => handleCurrencyChange('position', e.target.value)}
                        >
                          <option value="before">{t('beforeAmount')}</option>
                          <option value="after">{t('afterAmount')}</option>
                        </select>
                      </div>
                      <div className="form-text">
                        <InfoCircle className="me-1" />
                        {t('currencyPositionHelp')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast show position-fixed bottom-0 end-0 m-4" style={{ zIndex: 9999 }}>
          <div className="toast-header">
            <strong className="me-auto">{t('systemSettings')}</strong>
            <button type="button" className="btn-close" onClick={() => setToast('')}></button>
          </div>
          <div className="toast-body">{toast}</div>
        </div>
      )}
    </div>
  )
}

export default Settings 
import React from 'react'
import { Plus, Person, ChatText } from 'react-bootstrap-icons'

export default function ExpenseForm({
  form,
  onChange,
  onSubmit,
  saving,
  categories,
  newCategory,
  setNewCategory,
  showAddCategory,
  setShowAddCategory,
  addCategory,
  t,
  hideSubmitButton,
  id
}) {
  return (
    <form onSubmit={onSubmit} autoComplete="off" id={id}>
      <div className="row">
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">{t('amount')}</label>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                name="amount"
                value={form.amount}
                onChange={onChange}
                required
                min="0"
                step="0.01"
              />
              <span className="input-group-text">
                <span className="fw-bold">৳</span>
              </span>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t('category')}</label>
            <div className="input-group">
              <select
                className="form-select"
                name="categoryId"
                value={form.categoryId}
                onChange={onChange}
                required
              >
                <option value="">{t('selectCategory')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowAddCategory(v => !v)}
                title={t('addNewCategory')}
              >
                <Plus size={16} />
              </button>
            </div>
            {showAddCategory && (
              <div className="mt-2">
                <div className="input-group">
                  <input
                    className="form-control"
                    placeholder={t('enterCategoryName')}
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    autoFocus
                  />
                  <button type="button" className="btn btn-outline-primary" onClick={addCategory}>{t('add')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">{t('recipient')}</label>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                name="recipient" 
                value={form.recipient} 
                onChange={onChange} 
              />
              <span className="input-group-text">
                <Person />
              </span>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="mb-3">
            <label className="form-label">{t('description')}</label>
            <div className="input-group">
              <textarea 
                className="form-control" 
                rows="3" 
                name="description" 
                value={form.description} 
                onChange={onChange}
              ></textarea>
              <span className="input-group-text">
                <ChatText />
              </span>
            </div>
          </div>
        </div>
      </div>
      {!hideSubmitButton && (
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('saving') : t('save')}</button>
        </div>
      )}
    </form>
  )
} 
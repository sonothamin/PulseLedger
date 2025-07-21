import React from 'react';

export default function Modal({ show, onClose, title, children, footer, size = '', className = '', ...props }) {
  if (!show) return null;
  return (
    <div className={`modal fade show d-block ${className}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} {...props}>
      <div className={`modal-dialog${size ? ' modal-' + size : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
} 
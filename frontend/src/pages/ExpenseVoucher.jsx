import { useEffect, useState, useRef } from 'react';
import useBranding from '../hooks/useBranding';
import { useCurrency } from '../hooks/useCurrency';
import { useAuth } from '../context/AuthHelpers';
import axios from 'axios';
import { GeoAlt, Telephone, Envelope, Globe } from 'react-bootstrap-icons';

function ExpenseVoucher({ expense, category, branding, formatCurrency, cashier, currentDate, voucherNumber, logoSrc }) {
  const printAreaRef = useRef(null);
  if (!expense || !category || !branding || !formatCurrency || !cashier || !currentDate || !voucherNumber || !logoSrc) {
    return <div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border" /></div>;
  }
  return (
    <div className="expense-voucher-container" ref={printAreaRef}>
      <style>{`
        @font-face {
          font-family: 'Hind Siliguri';
          src: url('/HindSiliguri-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        .expense-voucher-container {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
          font-family: 'Hind Siliguri', system-ui, Avenir, Helvetica, Arial, sans-serif;
          font-size: 13px;
          color: #000;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .ev-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .ev-logo-block {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ev-logo {
          width: 80px;
          height: 80px;
          /* No background, keep full transparency */
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #888;
          font-weight: 600;
          object-fit: contain;
          margin-right: 8px;
        }
        .ev-hospital-details-title-row {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .ev-hospital-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
          min-width: 180px;
          max-width: 400px;
          color: #222;
          word-break: break-word;
        }
        .ev-header-title {
          font-size: 18px;
          font-weight: bold;
          color: #222;
          letter-spacing: 1px;
          margin-left: 32px;
          white-space: nowrap;
          text-align: right;
          align-self: center;
          display: flex;
          align-items: center;
          height: 100%;
        }
        .ev-details-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 10px;
        }
        .ev-details-label {
          font-weight: bold;
          min-width: 90px;
          color: #333;
        }
        .ev-details-value {
          color: #000;
          font-weight: 500;
          font-size: 17px;
        }
        .ev-hr {
          border: none;
          border-top: 1.5px solid #bbb;
          margin: 10px 0;
        }
        .ev-amount-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin: 10px 0;
          padding: 8px 0;
        }
        .ev-amount-label {
          font-weight: bold;
          font-size: 15px;
          color: #333;
        }
        .ev-amount-value {
          font-size: 24px;
          font-weight: bold;
          color: #000;
          letter-spacing: 1px;
        }
        .ev-section-title {
          font-weight: bold;
          font-size: 15px;
          margin-bottom: 6px;
          color: #333;
          margin-top: 15px;
        }
        .ev-description-block {
          margin-bottom: 10px;
          word-break: break-word;
          white-space: pre-line;
          font-size: 14px;
          color: #222;
        }
        .ev-category-block {
          font-size: 13px;
          color: #555;
          margin-bottom: 10px;
        }
        .ev-signatures-section {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
        }
        .ev-signature-block {
          width: 30%;
          text-align: center;
        }
        .ev-signature-line {
          border-bottom: 1px solid #000;
          margin: 30px 0 5px 0;
          height: 2px;
        }
        .ev-signature-label {
          font-size: 12px;
          font-weight: bold;
        }
        .ev-footer {
          margin-top: auto;
          text-align: center;
          font-size: 14px;
          color: #666;
          font-style: italic;
          border-top: 1px solid #bbb;
          padding-top: 10px;
        }
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; }
          .expense-voucher-container {
            width: 100%;
            min-height: 100vh;
            margin: 0;
            padding: 20mm;
            box-shadow: none;
            border: none;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
      {/* Header Section */}
      <div className="ev-header">
        <div className="ev-logo-block">
          <div className="ev-logo" style={!branding.logo ? { background: '#f8f8f8' } : {}}>
            {branding.logo ? (
              <img src={logoSrc} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'transparent' }} />
            ) : (
              'Logo'
            )}
          </div>
          <div className="ev-hospital-details-title-row">
            <div className="ev-hospital-details">
              <div style={{ fontWeight: 800, fontSize: '1.5rem' }}>{branding.hospitalName}</div>
              {branding.address && <div><GeoAlt size={13} style={{ marginRight: 4, marginBottom: 2 }} />{branding.address}</div>}
              {branding.contactNumber && <div><Telephone size={13} style={{ marginRight: 4, marginBottom: 2 }} />{branding.contactNumber}</div>}
              {branding.email && <div><Envelope size={13} style={{ marginRight: 4, marginBottom: 2 }} />{branding.email}</div>}
              {branding.website && <div><Globe size={13} style={{ marginRight: 4, marginBottom: 2 }} />{branding.website}</div>}
            </div>
          </div>
        </div>
        <div className="ev-header-title">Expense Voucher</div>
      </div>
      {/* Voucher Details Section */}
      <div className="ev-details-row">
        <div><span className="ev-details-label">Date:</span> <span className="ev-details-value">{currentDate}</span></div>
        <div><span className="ev-details-label">Voucher ID:</span> <span className="ev-details-value">{voucherNumber}</span></div>
      </div>
      <hr className="ev-hr" />
      {/* Recipient and Amount Section */}
      <div className="ev-amount-section">
        <div><span className="ev-amount-label">Recipient:</span> <span className="ev-details-value">{expense.recipient || '-'}</span></div>
        <div><span className="ev-amount-label">Amount:</span> <span className="ev-amount-value">{formatCurrency(expense.amount)}</span></div>
      </div>
      <hr className="ev-hr" />
      {/* Category and Description Section */}
      <div className="ev-category-block"><span className="ev-details-label">Category:</span> <span className="ev-details-label">{category?.name || '-'}</span></div>
      <div className="ev-section-title">Description:</div>
      <div className="ev-description-block" dangerouslySetInnerHTML={{ __html: expense.description || '-' }} />
      {/* Spacer to push signatures to near bottom, but not flush with footer */}
      <div style={{ flex: 1 }} />
      {/* Signatures above the footer, with extra space */}
      <div className="ev-signatures-section" style={{ marginBottom: 8 }}>
        <div className="ev-signature-block">
          <div className="ev-signature-line"></div>
          <div className="ev-signature-label">Cashier<br/>{cashier?.name || '-'}</div>
        </div>
        <div className="ev-signature-block">
          <div className="ev-signature-line"></div>
          <div className="ev-signature-label">Recipient<br/>{expense.recipient || '-'}</div>
        </div>
        <div className="ev-signature-block">
          <div className="ev-signature-line"></div>
          <div className="ev-signature-label">Approving Authority<br/>Managing Director</div>
        </div>
      </div>
      {/* Validity Notice grouped with signatures */}
      <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8, marginBottom: 24 }}>
        This voucher is valid only when signed.
      </div>
      {branding.tagline && <div className="ev-footer">{branding.tagline}</div>}
    </div>
  );
}

export default ExpenseVoucher; 
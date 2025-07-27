import React from 'react';
import { createRoot } from 'react-dom/client';
import { GeoAlt, Telephone, Envelope, Globe } from 'react-bootstrap-icons';

// Helper: format date as dd-mm-yyyy
function formatDateDMY(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function ReportPrintHeader({ branding }) {
  return (
    <div className="invoice-header border-bottom pb-3 mb-3">
      <div className="hospital-info d-flex align-items-center mb-2">
        <div className="logo-section me-3" style={{ flex: '0 0 110px' }}>
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" style={{ maxWidth: 110, maxHeight: 110, objectFit: 'contain', display: 'block' }} />
          ) : (
            <div className="logo-placeholder" style={{ width: 110, height: 110, background: '#f0f0f0', border: '1px solid #ddd' }} />
          )}
        </div>
        <div className="hospital-details flex-grow-1">
          <div className="hospital-name fw-bold" style={{ fontSize: '1.7rem', marginBottom: 5 }}>{branding.hospitalName}</div>
          <div className="hospital-contact" style={{ fontSize: 12, color: '#333' }}>
            {branding.address && (
              <div><GeoAlt size={12} className="me-1" />{branding.address}</div>
            )}
            {(branding.contactNumber || branding.email) && (
              <div className="d-flex align-items-center gap-3">
                {branding.contactNumber && (
                  <span><Telephone size={12} className="me-1" />{branding.contactNumber}</span>
                )}
                {branding.email && (
                  <span><Envelope size={12} className="me-1" />{branding.email}</span>
                )}
              </div>
            )}
            {branding.website && (
              <div className="mt-1"><Globe size={12} className="me-1" />{branding.website}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Print view as a React component
function ReportPrintView({ title, columns, rows, totals, branding, t, filters }) {
  return (
    <div className="report-print-main container-fluid pb-2 border-bottom mb-3">
      <ReportPrintHeader branding={branding} />
      <div className="row mb-3">
        <div className="col-12 text-center">
          <h3 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 500 }}>{title}</h3>
        </div>
      </div>
      <div className="table-responsive report-table-container mt-3">
        <table className="table table-striped table-hover table-bordered align-middle mb-0">
          <thead className="table-light">
            <tr>
              {columns.map((col, idx) => <th key={idx}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, idx) => (
              <tr key={idx}>
                {row.map((cell, cidx) => <td key={cidx} className={cidx > 0 ? 'text-end' : ''}>{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="text-center text-muted">{t('noData') || 'No data available'}</td></tr>
            )}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="report-totals">
                {totals.map((total, idx) => <td key={idx} className={idx > 0 ? 'text-end' : ''}>{total}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="container-fluid border-top pt-2 mt-3 d-flex justify-content-between align-items-center small print-footer" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff' }}>
        <span>{branding?.hospitalName || ''}</span>
        <span className="print-page-number"></span>
      </div>
    </div>
  );
}

// Print the main app's DOM (like invoice)
export function printReport({ title, columns, rows, totals, branding, t, filters }) {
  // Open a new popup window
  const popup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no');
  if (!popup) {
    alert(t('allowPopupsToPrint') || 'Please allow popups for this site to print reports');
    return;
  }
  // Write a basic HTML shell
  popup.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="/src/pages/ReportPrint.css" rel="stylesheet" type="text/css" media="print,screen">
      </head>
      <body class="report-print-body">
        <div id="report-print-root"></div>
      </body>
    </html>
  `);
  popup.document.close();
  // Wait for popup to load, then render React app
  popup.onload = () => {
    const root = createRoot(popup.document.getElementById('report-print-root'));
    root.render(
      <ReportPrintView
        title={title}
        columns={columns}
        rows={rows}
        totals={totals}
        branding={branding}
        t={t}
        filters={filters}
      />
    );
    // Use onafterprint for robust cleanup
    popup.onafterprint = () => {
      popup.close();
    };
    // Wait for content, then print
    const observer = new popup.MutationObserver(() => {
      observer.disconnect();
      setTimeout(() => {
        popup.focus();
        popup.print();
      }, 500);
    });
    observer.observe(popup.document.getElementById('report-print-root'), { childList: true, subtree: true });
  };
} 
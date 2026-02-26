import html2pdf from 'html2pdf.js';

/**
 * Generate and download a PDF of the invoice detail page.
 * @param {string} elementId  — DOM id of the printable container (default: 'invoice-print')
 * @param {string} filename   — Desired PDF filename (without extension)
 */
export const downloadInvoicePDF = (elementId = 'invoice-print', filename = 'invoice') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin: [0.4, 0.5, 0.4, 0.5],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  };

  html2pdf().set(opt).from(element).save();
};

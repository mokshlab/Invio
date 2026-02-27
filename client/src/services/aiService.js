import api from './api';

export const aiService = {
  generateInvoice: (text) => api.post('/ai/generate-invoice', { text }),
  generateReminder: (invoiceId, tone) =>
    api.post('/ai/payment-reminder', { invoiceId, tone }),
  getInsights: () => api.get('/ai/insights'),
  sendReminder: (invoiceId, reminderText) =>
    api.post('/ai/send-reminder', { invoiceId, reminderText }),
};

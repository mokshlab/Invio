import api from './api';

export const invoiceService = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  bulkDelete: (ids) => api.post('/invoices/bulk-delete', { ids }),
  getStats: () => api.get('/invoices/stats'),
  sendEmail: (id) => api.post(`/invoices/${id}/send`),
  getEmailStatus: () => api.get('/invoices/email-status'),
};

import api from './api';

const invoiceService = {
  /**
   * Download invoice PDF — triggers browser file download
   */
  downloadInvoice: async (bookingId) => {
    const response = await api.get(`/invoice/${bookingId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `INV-${bookingId.slice(-8).toUpperCase()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Email invoice to user
   */
  emailInvoice: async (bookingId) => {
    const response = await api.post(`/invoice/${bookingId}/email`);
    return response.data;
  }
};

export default invoiceService;

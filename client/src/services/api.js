const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = {
  async getByPincode(pin) {
    const response = await fetch(`${API_BASE}/pincode/${pin}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Failed to fetch PIN results');
    return payload.data;
  },

  async getByPostoffice(name) {
    const response = await fetch(`${API_BASE}/postoffice/${encodeURIComponent(name)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Failed to fetch post office results');
    return payload.data;
  },

  async geocode(address) {
    const response = await fetch(`${API_BASE}/geocode?address=${encodeURIComponent(address)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Failed to geocode address');
    return payload;
  }
};

export default api;

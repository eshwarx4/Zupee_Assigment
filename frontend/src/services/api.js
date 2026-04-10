import { auth } from '../config/firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();
  return token;
};

const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const chatWithAI = async (message) => {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

export const placeOrder = async (orderData) => {
  return apiRequest('/place-order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
};

export const getPortfolio = async () => {
  return apiRequest('/portfolio', {
    method: 'GET',
  });
};

export const disconnectZerodha = async () => {
  return apiRequest('/zerodha/logout', {
    method: 'POST',
  });
};

export { getAuthToken };

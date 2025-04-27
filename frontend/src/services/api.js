import axios from 'axios';

// Direkte IP-Adresse verwenden
const baseURL = 'http://10.17.1.12';

// Axios-Instanz mit Basiseinstellungen
const api = axios.create({
  baseURL,
  timeout: 30000, // 30 Sekunden Timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request-Interceptor (z.B. für JWT-Token hinzufügen)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response-Interceptor (z.B. für Fehlerbehandlung oder Token-Aktualisierung)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Automatisches Ausloggen bei 401-Fehlern (Token ungültig/abgelaufen)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

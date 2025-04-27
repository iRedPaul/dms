import axios from 'axios';

// Axios-Instanz mit Basiseinstellungen
const api = axios.create({
  // Leerer baseURL für relative Pfade (geht über Nginx-Proxy)
  baseURL: '',
  timeout: 30000, // 30 Sekunden Timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request-Interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`=== API REQUEST [${config.method.toUpperCase()}] ${config.url} ===`);
    
    // Token aus localStorage holen
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Authorization header set: Bearer ${token.substring(0, 15)}...`);
    } else {
      console.log('No token available, request sent without Authorization header');
    }
    
    // Log request data
    if (config.data) {
      const logData = { ...config.data };
      // Mask password if present
      if (logData.password) {
        logData.password = '********';
      }
      console.log('Request payload:', logData);
    }
    
    // Log all headers (except Authorization which we already logged)
    const headersLog = { ...config.headers };
    if (headersLog.Authorization) {
      headersLog.Authorization = headersLog.Authorization.substring(0, 20) + '...';
    }
    console.log('Request headers:', headersLog);
    
    return config;
  },
  (error) => {
    console.error('=== API REQUEST ERROR ===');
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
);

// Response-Interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`=== API RESPONSE [${response.status}] ${response.config.url} ===`);
    
    // Log response data (careful with large responses)
    const dataSize = JSON.stringify(response.data).length;
    if (dataSize > 1000) {
      console.log(`Response data: (large response, ${dataSize} bytes)`);
    } else {
      console.log('Response data:', response.data);
    }
    
    return response;
  },
  (error) => {
    console.error('=== API RESPONSE ERROR ===');
    
    if (error.response) {
      // Der Request wurde gemacht und der Server hat mit einem Statuscode
      // außerhalb von 2xx geantwortet
      console.error(`Error status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
      
      // Automatisches Ausloggen bei 401-Fehlern (Token ungültig/abgelaufen)
      if (error.response.status === 401) {
        console.log('401 Unauthorized response detected, removing token');
        localStorage.removeItem('token');
        
        // Prüfen, ob wir bereits auf der Login-Seite sind, um Redirect-Schleifen zu vermeiden
        if (!window.location.pathname.includes('/login')) {
          console.log('Redirecting to login page...');
          window.location.href = '/login';
        } else {
          console.log('Already on login page, no redirect needed');
        }
      }
    } else if (error.request) {
      // Der Request wurde gemacht, aber es ist keine Antwort eingegangen
      console.error('No response received from server');
      console.error('Request details:', error.request);
    } else {
      // Beim Setup des Requests ist etwas schief gelaufen
      console.error('Error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

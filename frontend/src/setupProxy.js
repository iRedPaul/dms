const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Konfiguration mit korrekter Domain
  const API_HOST = process.env.REACT_APP_API_HOST || 'https://dms.home-lan.cc';
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: API_HOST,
      changeOrigin: true,
      secure: false, // Bei selbstsignierten Zertifikaten notwendig
      pathRewrite: path => path // keine Umschreibung, damit die API-Pfade beibehalten werden
    })
  );
  
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: API_HOST,
      changeOrigin: true,
      secure: false // Bei selbstsignierten Zertifikaten notwendig
    })
  );
};

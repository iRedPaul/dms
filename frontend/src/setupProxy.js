const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://dms.home-lan.cc',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Entferne '/api' vom Pfad für die Weiterleitung
      },
    })
  );
  
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://dms.home-lan.cc',
      changeOrigin: true,
    })
  );
};

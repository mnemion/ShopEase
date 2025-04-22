const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // /accounts 로 들어오는 모든 요청을 Django 로 전달
  app.use(
    '/accounts',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    })
  );
};
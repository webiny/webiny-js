const devServer = require('webiny-client-scripts/dev-server');

module.exports = devServer({
    domain: 'http://localhost',
    port: 8060,
    routes: {
        '/admin': 'admin.html',
        '/': 'frontend.html'
    }
});
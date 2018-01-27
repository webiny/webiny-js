const server = require("webiny-scripts/lib/server");

module.exports = server({
    domain: "http://localhost",
    port: 8060,
    routes: {
        "/admin": "admin.html",
        "/": "frontend.html"
    }
});

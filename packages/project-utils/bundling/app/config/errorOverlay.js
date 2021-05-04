const url = require("url");
const {
    reportBuildError,
    dismissBuildError,
    startReportingRuntimeErrors
} = require("react-error-overlay");
const formatWebpackMessages = require("../utils/formatWebpackMessages");

startReportingRuntimeErrors({
    onError() {
        if (module.hot) {
            module.hot.addStatusHandler(status => {
                if (status === "apply") {
                    window.location.reload();
                }
            });
        }
    }
});

// Connect to WebpackDevServer via a socket.
const connection = new WebSocket(
    url.format({
        protocol: window.location.protocol === "https:" ? "wss" : "ws",
        hostname: process.env.WDS_SOCKET_HOST || window.location.hostname,
        port: process.env.WDS_SOCKET_PORT || window.location.port,
        // Hardcoded in WebpackDevServer
        pathname: process.env.WDS_SOCKET_PATH || "/sockjs-node",
        slashes: true
    })
);

connection.onclose = function() {
    if (typeof console !== "undefined" && typeof console.info === "function") {
        console.info("The development server has disconnected.\nRefresh the page if necessary.");
    }
};

connection.onmessage = function(e) {
    const { type, data } = JSON.parse(e.data);
    switch (type) {
        case "ok":
            dismissBuildError();
            break;
        case "errors":
            const formatted = formatWebpackMessages({
                errors: data,
                warnings: []
            });
            reportBuildError(formatted.errors[0]);
            break;
        default:
        // Do nothing.
    }
};

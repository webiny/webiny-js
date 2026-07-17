export const getUrl = (): string | undefined => {
    // Explicit WS endpoint (AWS: the dedicated API Gateway WebSocket URL).
    const awsExplicit = process.env.REACT_APP_WEBSOCKET_URL;
    if (awsExplicit && awsExplicit !== "undefined") {
        return awsExplicit;
    }

    // Self-hosted (server) flavour: a dedicated WS URL, baked via `<Admin.WebsocketsUrl>`. Only needed
    // when WebSockets are served from a different origin than the API — otherwise the derivation below
    // is enough. It's a build param (populated from any env the config chooses), not a raw env read.
    const serverExplicit = process.env.WEBINY_ADMIN_WS_API_URL;
    if (serverExplicit && serverExplicit !== "undefined") {
        return serverExplicit;
    }

    // Self-hosted default: no separate WS endpoint — the API server handles WebSocket upgrades on its
    // own origin. Derive the ws(s):// URL from the configured API URL (baked via `<Admin.ApiUrl>`) so
    // real-time updates work without extra configuration.
    const apiUrl = process.env.WEBINY_ADMIN_API_URL;
    if (apiUrl && apiUrl !== "undefined") {
        return apiUrl.replace(/^http/, "ws");
    }

    return undefined;
};

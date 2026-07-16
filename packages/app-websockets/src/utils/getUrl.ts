export const getUrl = (): string | undefined => {
    // Explicit WS endpoint (AWS: the dedicated API Gateway WebSocket URL).
    const explicit = process.env.REACT_APP_WEBSOCKET_URL;
    if (explicit && explicit !== "undefined") {
        return explicit;
    }

    // Self-hosted (server) flavour: there's no separate WS endpoint — the API server handles WebSocket
    // upgrades on its own origin. Derive the ws(s):// URL from the configured API URL so real-time
    // updates work without extra configuration.
    const apiUrl = process.env.WEBINY_ADMIN_API_URL;
    if (apiUrl && apiUrl !== "undefined") {
        return apiUrl.replace(/^http/, "ws");
    }

    return undefined;
};

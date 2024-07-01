export const getUrl = (): string | undefined => {
    const websocketApiUrl = process.env.REACT_APP_WEBSOCKET_URL;

    return !websocketApiUrl || websocketApiUrl === "undefined" ? undefined : websocketApiUrl;
};

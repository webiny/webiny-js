interface Params {
    tenant: string;
    locale: string;
    token: string;
}

export const getUrl = (params: Params): string | undefined => {
    const { tenant, locale, token } = params;
    if (!token) {
        console.log("Missing a token to connect to the websocket.");
        return;
    } else if (!tenant) {
        console.log("Missing a tenant to connect to the websocket.");
        return;
    } else if (!locale) {
        console.log("Missing a locale to connect to the websocket.");
        return;
    }
    const websocketApiUrl = process.env.REACT_APP_WEBSOCKET_URL;

    const url = !websocketApiUrl || websocketApiUrl === "undefined" ? undefined : websocketApiUrl;
    if (!url) {
        console.error("Missing REACT_APP_WEBSOCKET_URL environment variable.");
        return;
    }

    return `${url}?token=${token}&tenant=${tenant}&locale=${locale}`;
};

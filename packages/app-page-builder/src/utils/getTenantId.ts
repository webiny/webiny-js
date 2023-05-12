declare global {
    interface Window {
        __PS_RENDER_TENANT__: string;
    }
}

export const getTenantId = () => {
    const query = new URLSearchParams(location.search);
    return (
        query.get("__tenant") || window.__PS_RENDER_TENANT__ || window.localStorage.webiny_tenant
    );
};

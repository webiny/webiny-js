declare global {
    interface Window {
        __PS_RENDER_TENANT__: string;
    }
}

export const getTenantId = () => {
    // 1. Get tenant via the `__tenant` query param. Useful when doing page previews.
    let tenant = new URLSearchParams(location.search).get("__tenant");
    if (tenant) {
        return tenant;
    }

    // 2. Get tenant via `window.__PS_RENDER_TENANT__`. Used with prerendered pages.
    tenant = window.__PS_RENDER_TENANT__;
    if (tenant) {
        return tenant;
    }

    // 3. Get tenant via `window.localStorage.webiny_tenant`. Used within the Admin app.
    tenant = window.localStorage.webiny_tenant;
    if (tenant) {
        return tenant;
    }

    // 4. Finally, for development purposes, we also want to take the
    // `REACT_APP_WEBSITE_TENANT` environment variable into consideration.
    return process.env.WEBINY_WEBSITE_TENANT || null;
};

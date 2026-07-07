// Prefer the configured API URL (baked by `<Admin.ApiUrl>` into WEBINY_ADMIN_API_URL); else
// same-origin (a deployed self-hosted admin served behind the same domain as the API needs no
// baked-in URL). Never return the literal string "undefined".
export const resolveApiUrl = (): string => {
    const url = process.env.WEBINY_ADMIN_API_URL;
    if (url && url !== "undefined") {
        return url;
    }
    return typeof window !== "undefined" ? window.location.origin : "";
};

// The GraphQL endpoint derived from the resolved API URL.
export const resolveGraphqlUrl = (): string => `${resolveApiUrl()}/graphql`;

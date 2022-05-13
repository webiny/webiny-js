export const variantFixedKey = "webiny-variant-fixed";
export const variantRandomKey = "webiny-variant-random";

export function pointsToFile(uri: string) {
    return /\/[^/]+\.[^/]+$/.test(uri);
}

// Config file has a fixed URL within CDN, so it can be properly cached.
// This way we achieve better performance, because CDN does not have to call WCP API for config every time,
// but it can use it's own cache for a lookup.
export const configPath = "/_config.json";

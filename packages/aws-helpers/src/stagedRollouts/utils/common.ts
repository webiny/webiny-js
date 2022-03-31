export const variantFixedKey = "webiny-variant-fixed";
export const variantRandomKey = "webiny-variant-random";

export function pointsToFile(uri: string) {
    return /\/[^/]+\.[^/]+$/.test(uri);
}

export const configPath = "/_config.json";

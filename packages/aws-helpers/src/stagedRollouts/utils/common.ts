export const variantCookie = "webiny-variant";
export const variantHeader = "webiny-variant";

export function pointsToFile(uri: string) {
    return /\/[^/]+\.[^/]+$/.test(uri);
}

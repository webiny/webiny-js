export const isBrowser = typeof window !== "undefined";
export const isNode = typeof process !== "undefined" && !isBrowser;

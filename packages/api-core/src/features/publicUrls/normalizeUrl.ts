export const normalizeUrl = (value: unknown): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    const url = value.trim().replace(/\/+$/, "");
    return url || null;
};

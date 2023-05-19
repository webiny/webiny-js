export const isValidJSON = (value: string | undefined | null): boolean => {
    if (!value) {
        return false;
    }
    try {
        const o = JSON.parse(value);
        return !!o && typeof o === "object" && !Array.isArray(o);
    } catch {
        return false;
    }
};

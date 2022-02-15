export const useCurrentLocale = (): string | null => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    return code || null;
};

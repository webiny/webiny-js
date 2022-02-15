export const useCurrentLocale = (): string | undefined => {
    return new URLSearchParams(location.search).get("code");
};

export const useCurrentLocale = () => {
    return new URLSearchParams(location.search).get("code");
};

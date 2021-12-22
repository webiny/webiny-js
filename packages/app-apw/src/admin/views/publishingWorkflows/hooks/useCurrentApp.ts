export const useCurrentApp = () => {
    return new URLSearchParams(location.search).get("app");
};

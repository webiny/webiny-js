export const useCurrentTenantId = (): string => {
    return new URLSearchParams(location.search).get("id");
};

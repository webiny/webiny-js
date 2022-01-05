export const useCurrentTenantId = () => {
    return new URLSearchParams(location.search).get("id");
};

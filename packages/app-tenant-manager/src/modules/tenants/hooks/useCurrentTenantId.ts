export const useCurrentTenantId = (): string | null => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");

    return id || null;
};

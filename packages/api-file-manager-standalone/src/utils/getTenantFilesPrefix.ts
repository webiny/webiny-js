/* The key prefix every file of a tenant is stored under. */
export const getTenantFilesPrefix = (tenantId: string): string => {
    return `tenants/${tenantId}/files/`;
};

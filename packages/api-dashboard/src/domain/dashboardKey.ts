// Each identity has one layout per tenant. The key-value store already scopes keys by tenant.
export const createDashboardKey = (ownerId: string): string => {
    return `adminDashboard:${ownerId}`;
};

import { useSecurity } from "@webiny/app-security";

export function useIsDefaultTenant(): boolean {
    const security = useSecurity();

    if (!security || !security.identity) {
        return false;
    }

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = security.identity;

    if (!currentTenant || !defaultTenant) {
        // If there's no tenant information, we assume this is a single-tenant environment.
        return true;
    }

    return currentTenant && defaultTenant && currentTenant.id === defaultTenant.id;
}

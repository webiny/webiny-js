import { useIdentity } from "@webiny/app-admin";

export function useIsDefaultTenant(): boolean {
    const { identity } = useIdentity();

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = identity;

    return currentTenant.id === defaultTenant.id;
}

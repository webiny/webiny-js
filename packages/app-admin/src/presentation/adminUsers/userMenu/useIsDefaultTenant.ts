import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";

export function useIsDefaultTenant(): boolean {
    const { identity } = useIdentity();

    // This is only applicable in multi-tenant environments
    const { currentTenant, defaultTenant } = identity;

    return currentTenant.id === defaultTenant.id;
}

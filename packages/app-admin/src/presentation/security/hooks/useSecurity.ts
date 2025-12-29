// LEGACY HOOK!
import { Identity } from "~/domain/Identity.js";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";

export interface IUseSecurityReturn {
    identity: Identity;
    getPermission<T extends Identity.Permission>(name: string, exact?: boolean): T | null;
    getPermissions<T extends Identity.Permission = Identity.Permission>(name: string): T[];
}

/**
 * @deprecated Use `useAuthentication` hook instead!
 */
export function useSecurity(): IUseSecurityReturn {
    const { identity } = useIdentity();

    return {
        identity,
        getPermission<T extends Identity.Permission>(name: string, exact?: boolean): T | null {
            if (!identity) {
                return null;
            }

            return identity.getPermission<T>(name, exact);
        },
        getPermissions<T extends Identity.Permission = Identity.Permission>(name: string): T[] {
            if (!identity) {
                return [];
            }

            return identity.getPermissions(name);
        }
    };
}

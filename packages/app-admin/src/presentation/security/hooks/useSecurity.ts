// LEGACY HOOK!
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { Identity } from "~/domain/Identity.js";
import { useIdentity } from "~/presentation/security/hooks/useIdentity.js";
import { useFeature } from "@webiny/app";
import { AuthenticationContextFeature } from "~/features/security/AuthenticationContext/feature.js";

export interface IUseSecurityReturn {
    identity: Identity;
    getPermission<T extends Identity.Permission>(name: string, exact?: boolean): T | null;
    getPermissions<T extends Identity.Permission = Identity.Permission>(name: string): T[];
    setIdTokenProvider: (provider: AuthenticationContext.IdTokenProvider) => void;
    getIdToken: AuthenticationContext.IdTokenProvider;
}

export function useSecurity(): IUseSecurityReturn {
    const { identity } = useIdentity();
    const { authenticationContext } = useFeature(AuthenticationContextFeature);

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
        },
        getIdToken() {
            return authenticationContext.getIdToken();
        },
        setIdTokenProvider(provider: AuthenticationContext.IdTokenProvider) {
            authenticationContext.setIdTokenProvider(provider);
        }
    };
}

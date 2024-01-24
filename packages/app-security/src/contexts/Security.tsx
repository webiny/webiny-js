import minimatch from "minimatch";
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { SecurityIdentity, SecurityPermission } from "~/types";

export interface SecurityContext {
    identity: SecurityIdentity | null;
    getIdentityId: () => string | null;

    setIdentity: Dispatch<SetStateAction<SecurityIdentity | null>>;

    getPermission<T extends SecurityPermission = SecurityPermission>(
        name: string,
        exact?: boolean
    ): T | null;

    getPermissions<T extends SecurityPermission = SecurityPermission>(name: string): T[];
}

interface SecurityProviderProps {
    children: React.ReactNode;
}

export const SecurityContext = React.createContext<SecurityContext>({
    identity: null,
    getIdentityId: () => null,
    setIdentity: () => {
        return void 0;
    },
    getPermission: () => {
        return null;
    },
    getPermissions: () => {
        return [];
    }
});

export const SecurityProvider = (props: SecurityProviderProps) => {
    const [identity, setIdentity] = useState<SecurityIdentity | null>(null);

    const getPermission = useCallback(
        <T extends SecurityPermission = SecurityPermission>(
            name: string,
            exact?: boolean
        ): T | null => {
            if (!identity) {
                return null;
            }

            const perms = (identity.permissions || []) as T[];
            const exactMatch = perms.find(p => p.name === name);
            if (exactMatch) {
                return exactMatch as T;
            } else if (exact) {
                return null;
            }

            // Try matching using patterns
            return perms.find(p => minimatch(name, p.name)) || null;
        },
        [identity]
    );

    const getPermissions = useCallback(
        <T extends SecurityPermission = SecurityPermission>(name: string): Array<T> => {
            if (!identity) {
                return [];
            }

            const permissions = identity.permissions || [];

            return permissions.filter(current => {
                const exactMatch = current.name === name;
                if (exactMatch) {
                    return true;
                }

                // Try matching using patterns.
                return minimatch(name, current.name);
            }) as T[];
        },
        [identity]
    );

    const getIdentityId = useCallback(() => {
        if (!identity) {
            return null;
        }
        return identity.id || identity.login || null;
    }, [identity]);

    const value = useMemo(() => {
        return {
            identity: identity
                ? {
                      ...identity,
                      // For backwards compatibility, expose the `getPermission` method on the `identity` object.
                      getPermission
                  }
                : null,
            getIdentityId,
            setIdentity,
            getPermission,
            getPermissions
        };
    }, [identity]);

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

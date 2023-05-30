import minimatch from "minimatch";
import React, { useState, useMemo, Dispatch, SetStateAction, useCallback } from "react";
import { SecurityIdentity, SecurityPermission } from "~/types";

export interface SecurityContext {
    identity: SecurityIdentity | null;
    setIdentity: Dispatch<SetStateAction<SecurityIdentity | null>>;

    getPermission<T extends SecurityPermission = SecurityPermission>(name: string): T | null;

    getPermissions<T extends SecurityPermission = SecurityPermission>(name: string): T[];
}

export const SecurityContext = React.createContext<SecurityContext>({
    identity: null,
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

export const SecurityProvider: React.FC = props => {
    const [identity, setIdentity] = useState<SecurityIdentity | null>(null);

    const getPermission = useCallback(
        <T extends SecurityPermission = SecurityPermission>(name: string): T | null => {
            if (!identity) {
                return null;
            }

            const perms = identity.permissions || [];
            const exactMatch = perms.find(p => p.name === name);
            if (exactMatch) {
                return exactMatch as T;
            }

            // Try matching using patterns
            return perms.find(p => minimatch(name, p.name)) as any;
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

    const value = useMemo(() => {
        return {
            identity: identity
                ? {
                      ...identity,
                      // For backwards compatibility, expose the `getPermission` method on the `identity` object.
                      getPermission
                  }
                : null,
            setIdentity,
            getPermission,
            getPermissions
        };
    }, [identity]);

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

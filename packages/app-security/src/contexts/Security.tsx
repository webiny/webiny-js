import minimatch from "minimatch";
import React, { useState, useMemo, Dispatch, SetStateAction, useCallback } from "react";
import { SecurityIdentity, SecurityPermission } from "~/types";

export interface SecurityContext {
    identity: SecurityIdentity | null;
    setIdentity: Dispatch<SetStateAction<SecurityIdentity>>;
    getPermission<T extends SecurityPermission = SecurityPermission>(name: string): T;
}

export const SecurityContext = React.createContext<SecurityContext>(null);

export const SecurityProvider = props => {
    const [identity, setIdentity] = useState<SecurityIdentity>(null);

    const getPermission = useCallback(
        <T extends SecurityPermission = SecurityPermission>(name: string): T => {
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

    const value = useMemo(
        () => ({
            identity: identity
                ? {
                      ...identity,
                      // For backwards compatibility, expose the `getPermission` method on the `identity` object.
                      getPermission: getPermission as any
                  }
                : null,
            setIdentity,
            getPermission
        }),
        [identity]
    );

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

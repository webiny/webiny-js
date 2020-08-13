import React, { useState, useMemo } from "react";

export const SecurityContext = React.createContext(null);

export type SecurityIdentityData = {
    id: string;
    login: string;
    hasPermission?(permission: string | string[]): boolean;
    [key: string]: any;
};

export class SecurityIdentity {
    id: string;
    login?: string;
    [key: string]: any;
    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }

    hasPermission?(permission: string | string[]): boolean {
        throw Error(`SecurityIdentity must implement a "hasPermission" function!`);
    }
}

export type SecurityContextValue = {
    identity: SecurityIdentity | null;
    setIdentity(data: SecurityIdentity): void;
};

export const SecurityProvider = props => {
    const [identity, setIdentity] = useState(null);

    const value = useMemo(
        () => ({
            identity,
            setIdentity
        }),
        [identity]
    );

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

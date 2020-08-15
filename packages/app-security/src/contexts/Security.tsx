import React, { useState, useMemo } from "react";
import { SecurityIdentity } from "../SecurityIdentity";

export const SecurityContext = React.createContext(null);

export type SecurityContextValue = {
    identity: SecurityIdentity | null;
    setIdentity(data: SecurityIdentity): void;
};

export const SecurityProvider = props => {
    const [identity, setIdentity] = useState(null);

    // @ts-ignore
    window.SecurityIdentity = identity;

    const value = useMemo(
        () => ({
            identity,
            setIdentity
        }),
        [identity]
    );

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

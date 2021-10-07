import React, { useState, useMemo, Dispatch, SetStateAction } from "react";
import { SecurityIdentity } from "~/SecurityIdentity";

export const SecurityContext = React.createContext(null);

export type SecurityContextValue = {
    identity: SecurityIdentity | null;
    setIdentity: Dispatch<SetStateAction<SecurityIdentity>>;
};

export const SecurityProvider = props => {
    const [identity, setIdentity] = useState<SecurityIdentity>(null);

    const value = useMemo(
        () => ({
            identity,
            setIdentity
        }),
        [identity]
    );

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

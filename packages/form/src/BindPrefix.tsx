import * as React from "react";

const BindPrefixContext = React.createContext<string | undefined>(undefined);

export interface BindPrefixProps {
    name: string;
    children: React.ReactNode;
}

export function BindPrefix({ children, name }: BindPrefixProps) {
    return <BindPrefixContext.Provider value={name}>{children}</BindPrefixContext.Provider>;
}

export function useBindPrefix() {
    return React.useContext(BindPrefixContext);
}

import React from "react";
import { WcpProject } from "~/types";

export interface WcpContextValue {
    project: WcpProject | null;
}

export interface WcpProviderProps {
    project: any;
    children: React.ReactNode;
}

export const WcpContext = React.createContext<WcpContextValue>({
    project: null
});

export const WcpProviderComponent = (props: WcpProviderProps) => {
    const { children, project } = props;
    const value: WcpContextValue = { project };
    return <WcpContext.Provider value={value}>{children}</WcpContext.Provider>;
};

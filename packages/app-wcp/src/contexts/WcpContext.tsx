import React from "react";
import { WcpProject } from "~/types";

export interface WcpContextValue {
    project: WcpProject | null;
}

export interface WcpProviderProps {
    project: any;
}

export const WcpContext = React.createContext<WcpContextValue>({
    project: null
});

const WcpProviderComponent: React.FC<WcpProviderProps> = props => {
    const { children, project } = props;
    const value: WcpContextValue = { project };
    return <WcpContext.Provider value={value}>{children}</WcpContext.Provider>;
};

export const WcpProvider: React.FC<WcpProviderProps> = WcpProviderComponent;

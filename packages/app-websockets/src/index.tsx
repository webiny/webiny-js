import React from "react";
import { Provider } from "@webiny/app";
import { WebsocketsProvider as WebsocketsProviderComponent } from "~/WebsocketsProvider";

export interface WebsocketsProviderProps {
    children: React.ReactNode;
}

const WebsocketsHoc = (Component: React.ComponentType) => {
    return function WebsocketsProvider({ children }: WebsocketsProviderProps) {
        return (
            <Component>
                <WebsocketsProviderComponent>{children}</WebsocketsProviderComponent>
            </Component>
        );
    };
};

const WebsocketsExtension = () => {
    return (
        <>
            <Provider hoc={WebsocketsHoc} />
        </>
    );
};

export const Websockets = React.memo(WebsocketsExtension);

export * from "./types";
export * from "./hooks";

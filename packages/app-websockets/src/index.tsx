import React from "react";
import { Provider } from "@webiny/app";
import { WebsocketsContextProvider } from "~/WebsocketsContextProvider";

export interface WebsocketsProviderProps {
    children: React.ReactNode;
}

const WebsocketsHoc = (Component: React.ComponentType) => {
    return function WebsocketsProvider(props: WebsocketsProviderProps) {
        return (
            <WebsocketsContextProvider>
                <Component {...props} />
            </WebsocketsContextProvider>
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

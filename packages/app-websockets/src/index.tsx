import React from "react";
import { Provider } from "@webiny/app";
import { WebsocketsContextProvider } from "~/WebsocketsContextProvider.js";

export interface WebsocketsProviderProps {
    children: React.ReactNode;
}

const WebsocketsHoc = (Component: React.ComponentType<React.PropsWithChildren>) => {
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

export * from "./types.js";
export * from "./hooks/index.js";
export * from "./events/WebsocketEvent.js";
export * from "./events/abstractions.js";

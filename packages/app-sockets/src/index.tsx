import React from "react";
import { Provider } from "@webiny/app";
import { SocketsProvider as SocketsProviderComponent } from "~/SocketsProvider";

interface SocketsProviderProps {
    children: React.ReactNode;
}

const SocketsHoc = (Component: React.ComponentType) => {
    return function SocketsProvider({ children }: SocketsProviderProps) {
        return (
            <Component>
                <SocketsProviderComponent>{children}</SocketsProviderComponent>
            </Component>
        );
    };
};

const SocketsExtension = () => {
    return (
        <>
            <Provider hoc={SocketsHoc} />
        </>
    );
};

export const Sockets = React.memo(SocketsExtension);

export * from "./types";
export * from "./hooks";

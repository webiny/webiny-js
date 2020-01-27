import React, { useMemo } from "react";
import { getPlugins } from "@webiny/plugins";
import { useApolloClient } from "react-apollo";
import { ReactRouterOnLinkPlugin } from "../types";

export type ReactRouterContextValue = {
    onLink(link: string): void;
};

export const RouterContext = React.createContext<ReactRouterContextValue>(null);

export const RouterProvider = ({ children }) => {
    const apolloClient = useApolloClient();

    const value = useMemo(() => {
        const plugins = getPlugins<ReactRouterOnLinkPlugin>("react-router-on-link");
        return {
            onLink(link) {
                for (let i = 0; i < plugins.length; i++) {
                    const { onLink } = plugins[i];
                    if (typeof onLink === "function") {
                        onLink({ link, apolloClient });
                    }
                }
            }
        };
    }, []);
    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const RouterConsumer = ({ children }) => (
    <RouterContext.Consumer>{props => React.cloneElement(children, props)}</RouterContext.Consumer>
);

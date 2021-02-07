import React, { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { useApolloClient } from "@apollo/react-hooks";
import { ReactRouterOnLinkPlugin } from "../types";

export type ReactRouterContextValue = {
    onLink(link: string): void;
};

export const RouterContext = React.createContext<ReactRouterContextValue>(null);

export const RouterProvider = ({ children }) => {
    let apolloClient = null;
    try {
        apolloClient = useApolloClient();
    } catch {
        // If there is no ApolloProvider, apolloClient will not exist.
    }

    const value = useMemo(() => {
        const onLinkPlugins = plugins.byType<ReactRouterOnLinkPlugin>("react-router-on-link");
        return {
            onLink(link) {
                for (let i = 0; i < onLinkPlugins.length; i++) {
                    const { onLink } = onLinkPlugins[i];
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

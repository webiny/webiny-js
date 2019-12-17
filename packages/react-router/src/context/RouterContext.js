import React, { useMemo } from "react";
import { getPlugins } from "@webiny/plugins";
import { useApolloClient } from "react-apollo";

export const RouterContext = React.createContext({});

export const RouterProvider = ({ children }: Object) => {
    const apolloClient = useApolloClient();

    const value = useMemo(() => {
        const plugins = getPlugins("react-router-on-link");
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

export const RouterConsumer = ({ children }: Object) => (
    <RouterContext.Consumer>{props => React.cloneElement(children, props)}</RouterContext.Consumer>
);

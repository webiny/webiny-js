// @flow
import React from "react";
import { ApolloProvider } from "react-apollo";
import { Provider as ReduxProvider } from "react-redux";
import type ApolloClient from "apollo-client";
import { redux } from "../redux";
import { router } from "../router";
import createSecurity from "../security/createSecurity";
import { SecurityProvider } from "../security";
import { getPlugins } from "../plugins";
import type { Security } from "webiny-app/types";

type WebinyProps = { config: Object, children: Function };

const { Provider, Consumer } = React.createContext();

export const ConfigProvider = ({ config, children }: Object) => {
    return <Provider value={config}>{children}</Provider>;
};

export const ConfigConsumer = ({ children }: Object) => (
    <Consumer>{config => React.cloneElement(children, { config })}</Consumer>
);

export const app: { graphql: ApolloClient } = {
    graphql: null
};

export let apolloClient: ApolloClient;
export let security: Security;

const Webiny = ({ config, children }: WebinyProps) => {
    // Temporary monkey patch
    app.graphql = config.apolloClient;
    apolloClient = config.apolloClient;
    security = createSecurity(config.security);
    // Setup router
    router.configure(config.router);
    getPlugins("route").forEach((pl: Object) => {
        router.addRoute(pl.route);
    });

    const store = redux.initStore();

    return (
        <ApolloProvider client={apolloClient}>
            <ReduxProvider store={store}>
                <SecurityProvider security={security}>
                    <ConfigProvider config={config}>{children({ router, config })}</ConfigProvider>
                </SecurityProvider>
            </ReduxProvider>
        </ApolloProvider>
    );
};

export default Webiny;

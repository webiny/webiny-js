// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import { ApolloProvider } from "react-apollo";
import { UiProvider } from "webiny-app/context/ui";
import { ConfigProvider } from "webiny-app/context/config";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { Theme as AdminTheme } from "webiny-admin";
import { CmsProvider } from "webiny-app-cms/context";
import myTheme from "demo-theme";
import { Security } from "webiny-app-security/components";
import Login from "webiny-app-security/admin/views/Login";
import "./App.scss";
import config from "./config";
import plugins from "./plugins";

registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = () => {
    return (
        <ApolloProvider client={config.apolloClient}>
            <UiProvider>
                <ConfigProvider config={config}>
                    <CmsProvider theme={myTheme} isEditor>
                        <AdminTheme>
                            <Security>
                                {({ authenticated, notAuthenticated }) => (
                                    <React.Fragment>
                                        {authenticated(
                                            <Router basename={"/admin"}>
                                                {getPlugins("route").map((pl: Object) =>
                                                    React.cloneElement(pl.route, {
                                                        key: pl.name,
                                                        exact: true
                                                    })
                                                )}
                                                <Route
                                                    exact
                                                    path="/"
                                                    render={() => <Redirect to="/cms/pages" />}
                                                />
                                            </Router>
                                        )}
                                        {notAuthenticated(<Login />)}
                                    </React.Fragment>
                                )}
                            </Security>
                        </AdminTheme>
                    </CmsProvider>
                </ConfigProvider>
            </UiProvider>
        </ApolloProvider>
    );
};

export default hot(module)(App);

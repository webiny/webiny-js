// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { StaticRouter } from "react-router-dom";
import { ApolloProvider } from "react-apollo";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { CmsProvider } from "webiny-app-cms/context";
import { UiProvider } from "webiny-app/context/ui";
import { ConfigProvider } from "webiny-app/context/config";
import plugins from "./plugins";
import myTheme from "demo-theme";
import configFactory from "./config";
import { GenericNotFoundPage, GenericErrorPage } from "./cms";

registerPlugins(plugins);
// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = ({ url, client }) => {
    const Router = url ? StaticRouter : BrowserRouter;
    const routerProps = url ? { location: url, context: {} } : {};
    const config = configFactory();

    return (
        <ApolloProvider client={client || config.apolloClient}>
            <UiProvider>
                <ConfigProvider config={config}>
                    <CmsProvider
                        theme={myTheme}
                        defaults={{
                            pages: {
                                notFound: GenericNotFoundPage,
                                error: GenericErrorPage
                            }
                        }}
                    >
                        <Router {...routerProps}>
                            {getPlugins("route").map((pl: Object) =>
                                React.cloneElement(pl.route, { key: pl.name, exact: true })
                            )}
                        </Router>
                    </CmsProvider>
                </ConfigProvider>
            </UiProvider>
        </ApolloProvider>
    );
};

export default hot(module)(App);

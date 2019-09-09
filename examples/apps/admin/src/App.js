// @flow
import { hot } from "react-hot-loader";
import React, { Fragment } from "react";
import { UiProvider } from "@webiny/app/context/ui";
import { registerPlugins, getPlugins } from "@webiny/plugins";
import { ThemeProvider } from "@webiny/app-admin/contexts";
import { PageBuilderProvider } from "@webiny/app-page-builder/context";
import { SecurityProvider } from "@webiny/app-security/admin/context";
import { I18NProvider } from "@webiny/app-i18n/context";
import Login from "@webiny/app-security/admin/views/Login";
import { CircularProgress } from "@webiny/ui/Progress";
import myTheme from "theme";
import "./App.scss";
import plugins from "./plugins";

registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = () => {
    return (
        <UiProvider>
            <I18NProvider>
                <SecurityProvider>
                    {({ initialLoad, authenticated, notAuthenticated }) => (
                        <PageBuilderProvider theme={myTheme} isEditor>
                            <ThemeProvider>
                                {initialLoad(<CircularProgress />)}
                                {authenticated(
                                    <Fragment>
                                        {getPlugins("route").map((pl: Object) =>
                                            React.cloneElement(pl.route, {
                                                key: pl.name,
                                                exact: true
                                            })
                                        )}
                                    </Fragment>
                                )}
                                {notAuthenticated(<Login />)}
                            </ThemeProvider>
                        </PageBuilderProvider>
                    )}
                </SecurityProvider>
            </I18NProvider>
        </UiProvider>
    );
};

export default hot(module)(App);

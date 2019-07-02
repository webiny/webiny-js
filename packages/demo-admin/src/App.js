// @flow
import { hot } from "react-hot-loader";
import React, { Fragment } from "react";
import { UiProvider } from "webiny-app/context/ui";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { Theme as AdminTheme } from "webiny-admin";
import { CmsProvider } from "webiny-app-cms/context";
import { Security } from "webiny-app-security/components";
import { I18NProvider } from "webiny-app-i18n/components";
import Login from "webiny-app-security/admin/views/Login";
import { CircularProgress } from "webiny-ui/Progress";
import myTheme from "demo-theme";
import "./App.scss";
import plugins from "./plugins";

registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = () => {
    return (
        <UiProvider>
            <I18NProvider>
                <Security>
                    {({ initialLoad, authenticated, notAuthenticated }) => (
                        <CmsProvider theme={myTheme} isEditor>
                            <AdminTheme>
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
                            </AdminTheme>
                        </CmsProvider>
                    )}
                </Security>
            </I18NProvider>
        </UiProvider>
    );
};

export default hot(module)(App);

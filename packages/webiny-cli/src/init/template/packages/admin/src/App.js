import { hot } from "react-hot-loader";
import React, { cloneElement, Fragment } from "react";
import { UiProvider } from "webiny-app/context/ui";
import { registerPlugins, getPlugins } from "webiny-plugins";
import { Theme as AdminTheme } from "webiny-admin";
import { CmsProvider } from "webiny-app-cms/context";
import { CircularProgress } from "webiny-ui/Progress";
import { Security } from "webiny-app-security/components";
import Login from "webiny-app-security/admin/views/Login";
import myTheme from "theme";
import "./App.scss";
import plugins from "./plugins";

// Register all plugins
registerPlugins(plugins);

// Execute `init` plugins, they may register more plugins dynamically
getPlugins("webiny-init").forEach(plugin => plugin.callback());

const App = () => {
    return (
        /* UiProvider is a simple provider for UI state (dialogs, snackbars, dark theme, ...). */
        <UiProvider>
            {/* Security components handles user authentication. */}
            <Security>
                {({ initialLoad, authenticated, notAuthenticated }) => (
                    <CmsProvider theme={myTheme} isEditor>
                        {/* AdminTheme handles the Dark/Light theme switching and initialization. */}
                        <AdminTheme>
                            {/* Render a loader during initial load of user data */}
                            {initialLoad(<CircularProgress />)}
                            {/* If user is authenticated, get all `route` plugins and render them. */}
                            {authenticated(
                                <Fragment>
                                    {getPlugins("route").map(pl =>
                                        cloneElement(pl.route, { key: pl.name })
                                    )}
                                </Fragment>
                            )}
                            {/* If user is not authenticated, render Login component. */}
                            {notAuthenticated(<Login />)}
                        </AdminTheme>
                    </CmsProvider>
                )}
            </Security>
        </UiProvider>
    );
};

export default hot(module)(App);

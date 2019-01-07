// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { Webiny, Router } from "webiny-app";
import { registerPlugins } from "webiny-plugins";
import { Theme as AdminTheme } from "webiny-admin";
import { CmsProvider } from "webiny-app-cms/context";
import myTheme from "demo-theme";
import { Security } from "webiny-app-security/components";
import Login from "webiny-app-security/admin/views/Login";
import "./App.scss";
import config from "./config";
import plugins from "./plugins";

registerPlugins(plugins);

const App = () => {
    return (
        <Webiny config={config}>
            {({ router }) => (
                <CmsProvider theme={myTheme} isEditor>
                    <AdminTheme>
                        <Security>
                            {({ authenticated, notAuthenticated }) => (
                                <React.Fragment>
                                    {authenticated(<Router router={router} />)}
                                    {notAuthenticated(<Login />)}
                                </React.Fragment>
                            )}
                        </Security>
                    </AdminTheme>
                </CmsProvider>
            )}
        </Webiny>
    );
};

export default hot(module)(App);

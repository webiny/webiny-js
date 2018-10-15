// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { Webiny, Router } from "webiny-app";
import { addPlugin } from "webiny-app/plugins";
import { app as adminApp, Theme as AdminTheme } from "webiny-app-admin";
import { app as cmsApp } from "webiny-app-cms/admin";
import { Theme as CmsTheme } from "webiny-app-cms/theme";
import myTheme from "demo-theme";
import { Security } from "webiny-app-admin/components";
import Login from "webiny-app-admin/views/Login";
import "./App.scss";
import imagePlugin from "./plugins/imagePlugin";
import fileUploadPlugin from "./plugins/fileUploadPlugin";

addPlugin(imagePlugin);
addPlugin(fileUploadPlugin);

// Initialize apps
adminApp();
cmsApp();

const App = ({ config }) => {
    return (
        <Webiny config={config}>
            {({ router }) => (
                <CmsTheme theme={myTheme}>
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
                </CmsTheme>
            )}
        </Webiny>
    );
};

export default hot(module)(App);

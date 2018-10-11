// @flow
import { hot } from "react-hot-loader";
import React from "react";
import { Provider as StateProvider } from "react-redux";
import { app } from "webiny-app";
import { AppConfig } from "webiny-app/config";
import { router, Router } from "webiny-app/router";
import { app as adminApp, Theme as AdminTheme } from "webiny-app-admin";
import { app as cmsApp } from "webiny-app-cms/admin";
import { Theme as CmsTheme } from "webiny-app-cms/theme";
import config from "./config";
import myTheme from "demo-theme";
import "./App.scss";
import imagePlugin from "./plugins/imagePlugin";
import defaultWithFileUploadPlugin from "./plugins/withFileUploadPlugin";
import { addPlugin } from "webiny-app/plugins";

// CMS plugins

if (!app.initialized) {
    app.configure(config);
    app.use(adminApp());
    app.use(cmsApp());

    app.use((params, next) => {
        router.addRoute({
            name: "Fallback",
            path: "*",
            render() {
                return <span>Sorry, no route was matched!</span>;
            }
        });

        next();
    });

    addPlugin(imagePlugin);
    addPlugin(defaultWithFileUploadPlugin);
}

const App = ({ store }) => {
    return (
        <AppConfig config={config()}>
            <StateProvider store={store}>
                <CmsTheme theme={myTheme}>
                    <AdminTheme>
                        <Router router={router} />
                    </AdminTheme>
                </CmsTheme>
            </StateProvider>
        </AppConfig>
    );
};

export default hot(module)(App);

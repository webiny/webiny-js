import { hot } from "react-hot-loader";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { Provider as StateProvider } from "react-redux";
import { app } from "webiny-app";
import { router, Router } from "webiny-app/router";
import { app as adminApp, Theme as AdminTheme } from "webiny-app-admin";
import { app as cmsApp } from "webiny-app-cms/admin";
import { Theme as CmsTheme } from "webiny-app-cms/theme";
import config from "./config";
import myTheme from "demo-theme";
import "./App.scss";

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
}

const App = ({ store }) => {
    return (
        <ApolloProvider client={app.graphql}>
            <StateProvider store={store}>
                <CmsTheme theme={myTheme}>
                    <AdminTheme>
                        <Router router={router} />
                    </AdminTheme>
                </CmsTheme>
            </StateProvider>
        </ApolloProvider>
    );
};

export default hot(module)(App);

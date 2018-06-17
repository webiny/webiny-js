import React from "react";
import {
    app,
    resolveMiddleware,
    renderMiddleware,
    authenticationMiddleware,
    Router
} from "webiny-client";
import { app as adminApp } from "webiny-client-admin";
import { app as cmsApp } from "webiny-client-cms/lib/admin";
import userIdentity from "./userIdentity";
import apiConfig from "./apiConfig";
import "./App.scss";
import { hot } from "react-hot-loader";

if (!app.initialized) {
    app.use(adminApp());
    app.use(cmsApp());

    app.configure(() => {
        return apiConfig(app);
    });

    app.router.configure({
        basename: "/admin",
        middleware: [
            authenticationMiddleware({
                onNotAuthenticated({ route }, next) {
                    if (route.name !== "Login") {
                        app.router.goToRoute("Login");
                    }
                    next();
                }
            }),
            resolveMiddleware(),
            renderMiddleware()
        ]
    });

    app.router.addRoute({
        name: "Dashboard",
        path: "/",
        //route: "Cms.Page.List",
        render() {
            return import("./views/Page.jsx")
                .then(m => m.default)
                .then(Page => {
                    return <Page />;
                });
        }
    });

    app.security.configure({
        cookie: "webiny-token",
        // TODO: define strategies like on server side
        identities: [userIdentity],
        onLogout() {
            app.router.goToRoute("Login");
        }
    });
}

const App = () => {
    return <Router router={app.router} />;
};

export default hot(module)(App);

import React from "react";
import {
    app,
    resolveMiddleware,
    renderMiddleware,
    authenticationMiddleware,
    Router
} from "webiny-client";
import { app as adminApp, Menu } from "webiny-client-admin";
import { app as cmsAdminApp } from "webiny-client-cms/admin";
import userIdentity from "./userIdentity";
import apiConfig from "./../apiConfig";
import "./app.scss";
import { hot } from "react-hot-loader";

if (!app.initialized) {
    app.use(adminApp());
    app.use(cmsAdminApp());

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
        route: "Cms.Page.List"
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

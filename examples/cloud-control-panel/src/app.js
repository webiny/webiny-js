import React from "react";
import {
    app,
    resolveMiddleware,
    renderMiddleware,
    authenticationMiddleware,
    Router
} from "webiny-client";
import { app as adminApp } from "webiny-client-admin";
import userIdentity from "./userIdentity";
import apiConfig from "./apiConfig";
import "./app.scss";
import { hot } from "react-hot-loader";

if (!app.initialized) {
    app.use(adminApp());

    app.configure(() => {
        return apiConfig(app);
    });

    app.router.configure({
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
        exact: true,
        path: "/",
        route: "Users.List"
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

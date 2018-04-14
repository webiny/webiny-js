import React from "react";
import { app, resolveMiddleware, renderMiddleware, Router } from "webiny-app";
import { hot } from "react-hot-loader";
import { app as adminApp } from "webiny-app-admin";
import { app as securityApp, authenticationMiddleware } from "webiny-app-security";
import { app as securityAdminApp } from "webiny-app-security-admin";
//import { app as cmsAdminApp } from "webiny-app-cms/lib/admin";
import project from "./project";
import userIdentity from "./userIdentity";

if (!app.initialized) {
    app.use(adminApp());
    app.use(
        securityApp({
            authentication: {
                cookie: "webiny-token",
                // TODO: define strategies like on server side
                identities: [userIdentity],
                onLogout() {
                    app.router.goToRoute("Login");
                }
            }
        })
    );
    /*app.use(securityAdminApp());*/
    // app.use(cmsAdminApp());
    app.use(securityAdminApp());
    app.use(project());

    app.configure(() => {
        if (process.env.NODE_ENV === "development") {
            app.graphql.setConfig({
                uri: "http://localhost:9000/graphql",
                defaultOptions: {
                    watchQuery: {
                        fetchPolicy: "network-only",
                        errorPolicy: "all"
                    },
                    query: {
                        fetchPolicy: "network-only",
                        errorPolicy: "all"
                    }
                }
            });
        }
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
}

const App = () => {
    return <Router router={app.router} />;
};

export default hot(module)(App);

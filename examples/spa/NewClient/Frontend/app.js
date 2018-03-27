import React from "react";
import { app, resolveMiddleware, renderMiddleware, Router } from "webiny-client";
import { createBrowserHistory } from "history";
import axios from "axios";
import { hot } from "react-hot-loader";

import { app as skeletonApp } from "webiny-skeleton-app";
import { app as securityApp, authenticationMiddleware } from "webiny-client-security";
import selectoApp from "./selectoApp";

if (!app.initialized) {
    app.use(
        securityApp({
            authentication: {
                cookie: "webiny-token",
                identities: [
                    {
                        identity: "user",
                        authenticate: [
                            {
                                strategy: "credentials",
                                apiMethod: "/security/auth/login-user"
                            }
                        ]
                    }
                ],
                onLogout() {
                    app.router.goToRoute("Login");
                }
            }
        })
    );
    app.use(skeletonApp());
    app.use(selectoApp());

    app.configure(() => {
        if (process.env.NODE_ENV === "development") {
            axios.defaults.baseURL = "http://localhost:9000/api";
        }

        if (process.env.NODE_ENV === "production") {
            axios.defaults.baseURL =
                "https://2z2788jepi.execute-api.eu-west-1.amazonaws.com/dev/api";
        }

        return {};
    });

    app.router.configure({
        history: createBrowserHistory({ basename: "/" }),
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

export default hot(module)(() => {
    return <Router router={app.router} />;
});

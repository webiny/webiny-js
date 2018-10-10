// @flow
import { app } from "webiny-app";
import {
    router,
    resolveMiddleware,
    renderMiddleware,
    reduxMiddleware,
    authenticationMiddleware
} from "webiny-app/router";
import userIdentity from "./userIdentity";

// Plugins
import defaultWithFileUploadPlugin from "webiny-app/components/withFileUpload/defaultWithFileUploadPlugin";

export default () => {
    // TODO
    app.security.configure({
        cookie: "webiny-token",
        identities: [userIdentity],
        onLogout() {
            router.goToRoute({ name: "Login" });
        }
    });

    // Router configuration
    router.configure({
        basename: "/admin",
        defaultRoute: "Policies",
        middleware: [
            authenticationMiddleware({
                onNotAuthenticated({ route }, next) {
                    if (route.name !== "Login") {
                        router.goToRoute({ name: "Login" });
                    }
                    next();
                }
            }),
            reduxMiddleware(),
            resolveMiddleware(),
            renderMiddleware()
        ]
    });

    // API configuration
    if (process.env.NODE_ENV === "production") {
        app.graphql.setConfig({
            uri: "/graphql",
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

        return {
            withFileUpload: {
                plugin: defaultWithFileUploadPlugin({
                    uri: "/files"
                })
            }
        };
    }

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

        return {
            withFileUpload: {
                plugin: defaultWithFileUploadPlugin({
                    uri: "http://localhost:9000/files"
                })
            }
        };
    }
};

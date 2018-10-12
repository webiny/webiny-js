// @flow
import {
    router,
    resolveMiddleware,
    renderMiddleware,
    reduxMiddleware,
    authenticationMiddleware
} from "webiny-app/router";
import userIdentity from "./userIdentity";

// Plugins for "withFileUpload" HOC - used with file upload related components.
import webinyCloudStoragePlugin from "webiny-app/components/withFileUpload/webinyCloudStoragePlugin";

export default {
    security: {
        cookie: "webiny-token",
        identities: [userIdentity],
        onLogout() {
            // TODO
            router.goToRoute({ name: "Login" });
        }
    },
    router: {
        basename: "/admin",
        defaultRoute: "Policies",
        middleware: [
            authenticationMiddleware({
                onNotAuthenticated({ route }, next) {
                    // TODO
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
    },
    apolloClient: {
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
    },
    withFileUploadPlugin: webinyCloudStoragePlugin({
        siteToken: "abc123"
    })
};

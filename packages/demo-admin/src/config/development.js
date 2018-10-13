// @flow
import { renderMiddleware } from "webiny-app/router";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "webiny-app-admin/security";

// Plugins for "withFileUpload" HOC - used with file upload related components.
import localStoragePlugin from "webiny-app/components/withFileUpload/localStoragePlugin";

export default {
    router: {
        basename: "/admin",
        defaultRoute: "Policies",
        middleware: [renderMiddleware()]
    },
    apolloClient: new ApolloClient({
        link: ApolloLink.from([
            createAuthLink(),
            new HttpLink({ uri: "http://localhost:9000/graphql" })
        ]),
        cache: new InMemoryCache({
            dataIdFromObject: obj => obj.id || null
        }),
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
    }),
    withFileUploadPlugin: localStoragePlugin({
        uri: "http://localhost:9000/files"
    })
};

// @flow
import { renderMiddleware } from "webiny-app/router";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "webiny-app-admin/security";

export default {
    router: {
        basename: "/admin",
        defaultRoute: "Cms.Pages",
        middleware: [renderMiddleware()]
    },
    apolloClient: new ApolloClient({
        link: ApolloLink.from([
            createAuthLink(),
            new HttpLink({ uri: "/graphql" })
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
    components: {
        Image: {
            presets: {
                avatar: { width: 128 }
            },
            plugin: "image-component"
        },
        withFileUpload: {
            plugin: ["with-file-upload", { uri: "/files" }]
        }
    }
};

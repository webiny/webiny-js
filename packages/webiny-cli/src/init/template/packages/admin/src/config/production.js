import { renderMiddleware } from "webiny-app/router";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { BatchHttpLink } from "apollo-link-batch-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createAuthLink } from "webiny-app-security/components";
import { createOmitTypenameLink } from "webiny-app/graphql";
import { lazyLoadMiddleware } from "webiny-app-cms/admin";

export default {
    router: {
        basename: "/admin",
        defaultRoute: "Cms.Pages",
        middleware: [lazyLoadMiddleware(), renderMiddleware()]
    },
    apolloClient: new ApolloClient({
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createAuthLink(),
            new BatchHttpLink({ uri: "/function/api" })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    })
};

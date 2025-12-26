import { createFeature } from "@webiny/feature/admin";
import { ApolloClient } from "./abstraction.js";

export const ApolloClientFeature = createFeature({
    name: "ApolloClient",
    register(container, apolloClient: ApolloClient.Interface) {
        container.registerInstance(ApolloClient, apolloClient);
    }
});

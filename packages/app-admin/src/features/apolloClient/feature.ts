import { setContext } from "@apollo/client/link/context";
import { ApolloLinkPlugin } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { createFeature } from "@webiny/feature/admin";
import { ApolloClient } from "./abstraction.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";

export const ApolloClientFeature = createFeature({
    name: "ApolloClient",
    register(container, apolloClient: ApolloClient.Interface) {
        container.registerInstance(ApolloClient, apolloClient);

        plugins.register(
            new ApolloLinkPlugin(() => {
                return setContext(async (_, { headers }) => {
                    // If "Authorization" header is already set, don't overwrite it.
                    if (headers && headers.Authorization) {
                        return { headers };
                    }

                    const authContext = container.resolve(AuthenticationContext);
                    const idToken = await authContext.getIdToken();

                    if (!idToken) {
                        return { headers };
                    }

                    return {
                        headers: {
                            ...headers,
                            Authorization: `Bearer ${idToken}`
                        }
                    };
                });
            })
        );
    }
});

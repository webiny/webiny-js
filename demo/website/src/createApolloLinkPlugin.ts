import { Auth } from "aws-amplify";
import { setContext } from "apollo-link-context";
import { ApolloLinkPlugin } from "@webiny/app";

export const createApolloLinkPlugin = (): ApolloLinkPlugin => {
    return new ApolloLinkPlugin(() => {
        return setContext(async (_, { headers }) => {
            try {
                const user = await Auth.currentSession();

                const idToken = user.getIdToken();

                if (!idToken) {
                    return { headers };
                }

                // If "Authorization" header is already set, don't overwrite it.
                if (headers && headers.Authorization) {
                    return { headers };
                }

                return {
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${idToken.getJwtToken()}`
                    }
                };
            } catch (err) {
                console.log("ApolloLinkPlugin", err);
                return { headers };
            }
        });
    });
};

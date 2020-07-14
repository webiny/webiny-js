import { environmentId } from "@webiny/api-headless-cms/testing/createEnvironment";

export default {
    accessToken: {
        name: "Access Token #1",
        description: "description...",
        environments: [environmentId]
    },
    accessTokenResponse: ({ accessTokenId, token }) => ({
        id: accessTokenId,
        name: "Access Token #1",
        description: "description...",
        token,
        scopes: null,
        environments: [
            {
                id: environmentId,
                name: "Initial Environment"
            }
        ]
    })
};

import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import filesPlugins from "@webiny/api-files/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import securityAuthPlugins from "@webiny/api-security/plugins/auth";
import securityAuthJwtPlugins from "@webiny/api-security/plugins/auth/jwt";
import { JWT_TOKEN_SIGN_SECRET, createJwtToken } from "@webiny/api-security/testing";

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        neDb({ database }),
        apolloServerPlugins(),
        securityAuthPlugins(),
        securityAuthJwtPlugins({
            secret: JWT_TOKEN_SIGN_SECRET
        }),
        filesPlugins(),
        filesResolvers()
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        // Set "full-access" JWT token into the "Authorization" header.
        if (
            typeof headers.Authorization === "undefined" &&
            typeof headers.authorization === "undefined"
        ) {
            headers.Authorization = createJwtToken();
        }

        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    // With the "handler" and "invoke" function, let's also return the "database", which will enable
    // us to do some manual database updating, for example, preparing the initial test data.
    return {
        database,
        handler,
        invoke
    };
};

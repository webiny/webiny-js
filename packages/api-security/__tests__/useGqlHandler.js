import { createHandler } from "@webiny/handler";
import neDb from "@webiny/api-plugin-commodo-nedb";
import { Database } from "@commodo/fields-storage-nedb";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import filesPlugins from "@webiny/api-files/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import securityAuthenticationPlugins from "@webiny/api-security/plugins/authentication";
import securityAuthJwtPlugins from "@webiny/api-security/plugins/auth/jwt";
import securityAuthPatPlugins from "@webiny/api-security/plugins/auth/pat";
import { JWT_TOKEN_SIGN_SECRET, createJwtToken } from "@webiny/api-security/testing";

export default ({ database } = {}) => {
    if (!database) {
        database = new Database();
    }

    const handler = createHandler(
        neDb({ database }),
        apolloServerPlugins(),
        securityAuthenticationPlugins(),
        securityAuthJwtPlugins({
            secret: JWT_TOKEN_SIGN_SECRET
        }),
        securityAuthPatPlugins(),
        filesPlugins(),
        filesResolvers()
    );

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
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

        return [JSON.parse(response.body), response];
    };

    return {
        database,
        handler,
        invoke
    };
};

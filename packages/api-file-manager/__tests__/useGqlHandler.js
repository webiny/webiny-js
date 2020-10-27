import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import filesPlugins from "@webiny/api-file-manager/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import securityPlugins from "@webiny/api-security/authenticator";
import { SecurityIdentity } from "@webiny/api-security";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
// Graphql
import {
    CREATE_FILE,
    CREATE_FILES,
    UPDATE_FILE,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES,
    INSTALL,
    IS_INSTALLED,
    GET_SETTINGS,
    UPDATE_SETTINGS
} from "./graphql/file";

export default () => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "FileManager",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: "localhost:8000",
                    sslEnabled: false,
                    region: "local-env"
                })
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        { type: "security-authorization", getPermissions: () => [{ name: "*", key: "*" }] },
        // Add Cognito plugins for authentication
        {
            type: "security-authentication",
            async authenticate() {
                return new SecurityIdentity({
                    id: "2iHCWANdxpy3cu5ES7GzjVMoVNx",
                    login: "admin@webiny.com",
                    type: "admin",
                    firstName: "Admin",
                    lastName: "Test"
                });
            }
        },
        filesPlugins(),
        filesResolvers()
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
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
        handler,
        invoke,
        async createFile(variables) {
            return invoke({ body: { query: CREATE_FILE, variables } });
        },
        async updateFile(variables) {
            return invoke({ body: { query: UPDATE_FILE, variables } });
        },
        async createFiles(variables) {
            return invoke({ body: { query: CREATE_FILES, variables } });
        },
        async deleteFile(variables) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables) {
            return invoke({ body: { query: GET_FILE, variables } });
        },
        async listFiles(variables) {
            return invoke({ body: { query: LIST_FILES, variables } });
        },
        async isInstalled(variables) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getSettings(variables) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async updateSettings(variables) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        }
    };
};

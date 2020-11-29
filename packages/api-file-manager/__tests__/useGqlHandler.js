import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-graphql";
import filesPlugins from "@webiny/api-file-manager/plugins";
import securityPlugins from "@webiny/api-security/authenticator";
import dbPlugins from "@webiny/handler-db";
import i18nContext from "@webiny/api-i18n/plugins/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/testing";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SecurityIdentity } from "@webiny/api-security";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import { Client } from "@elastic/elasticsearch";
// Graphql
import {
    CREATE_FILE,
    CREATE_FILES,
    UPDATE_FILE,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES
} from "./graphql/file";
import {
    INSTALL,
    IS_INSTALLED,
    GET_SETTINGS,
    UPDATE_SETTINGS
} from "./graphql/fileManagerSettings";

export default ({ permissions, identity } = {}) => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "FileManager",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
                    sslEnabled: false,
                    region: "local"
                })
            })
        }),
        elasticSearch({ endpoint: `http://localhost:9201` }),
        apolloServerPlugins(),
        securityPlugins(),
        i18nContext,
        i18nContentPlugins(),
        mockLocalesPlugins(),
        filesPlugins(),
        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: () => permissions || [{ name: "*" }]
        },
        {
            type: "security-authentication",
            authenticate: () =>
                identity ||
                new SecurityIdentity({
                    id: "mocked",
                    displayName: "m"
                })
        }
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

    return {
        elasticSearch: new Client({
            hosts: [`http://localhost:9201`],
            node: "http://localhost:9201"
        }),
        sleep: (ms = 100) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        // Files
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
        // File Manager settings
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

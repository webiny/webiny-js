import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import filesPlugins from "@webiny/api-file-manager/plugins";
import securityPlugins from "@webiny/api-security/authenticator";
import i18nPlugins from "@webiny/api-i18n/plugins";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/testing";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Client } from "@elastic/elasticsearch";
import Mock from "@elastic/elasticsearch-mock";
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

export default ({ permissions, identity }) => {
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
        {
            type: "context",
            name: "context-elastic-search",
            apply(context) {
                const mock = new Mock();
                const client = new Client({
                    node: "http://localhost:9200",
                    Connection: mock.getConnection()
                });
                mock.add(
                    {
                        method: "POST",
                        path: "/file-manager/_doc/_search"
                    },
                    () => {
                        return { status: "ok" };
                    }
                );
                mock.add(
                    {
                        method: "PUT",
                        path: "/file-manager/_doc/:id/_create"
                    },
                    () => {
                        return { status: "ok" };
                    }
                );
                mock.add(
                    {
                        method: "POST",
                        path: "/file-manager/_doc/:id/_update"
                    },
                    () => {
                        return { status: "ok" };
                    }
                );
                mock.add(
                    {
                        method: "POST",
                        path: "/_bulk"
                    },
                    () => {
                        return { status: "ok" };
                    }
                );
                context.elasticSearch = client;
            }
        },
        securityPlugins(),
        {
            type: "security-authorization",
            getPermissions: () => permissions || [{ name: "*", key: "*" }]
        },
        {
            type: "security-authentication",
            authenticate() {
                return identity || null;
            }
        },
        i18nPlugins(),
        i18nContentPlugins(),
        mockLocalesPlugins(),
        filesPlugins()
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

import { createHandler } from "@webiny/handler-aws";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
// import dbPlugins from "@webiny/handler-db";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
// import { DynamoDbDriver } from "@webiny/db-dynamodb";
// import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { SecurityIdentity } from "@webiny/api-security";
import filesPlugins from "~/plugins";
import { Plugin } from "@webiny/plugins";

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
import { SecurityPermission } from "@webiny/api-security/types";
import { until } from "./helpers";

type UseGqlHandlerParams = {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin[];
    extraVariables?: Record<string, any>;
    skipGlobals?: boolean;
};

export default (params?: UseGqlHandlerParams) => {
    const { permissions, identity, plugins = [], extraVariables = {}, skipGlobals } = params;
    let storageOperationsPlugins = () => [];
    if (skipGlobals !== true) {
        // @ts-ignore
        if (typeof __getStorageOperationsPlugins !== "function") {
            throw new Error(`There is no global "storageOperationsPlugins" function.`);
        }
        // @ts-ignore
        storageOperationsPlugins = __getStorageOperationsPlugins();
    }
    const tenant = { id: "root", name: "Root", parent: null };

    // const documentClient = new DocumentClient({
    //     convertEmptyValues: true,
    //     endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    //     sslEnabled: false,
    //     region: "local"
    // });

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        /**
         * To make sure plugins is not undefined.
         */
        plugins || [],
        storageOperationsPlugins(),
        // dbPlugins({
        //     table: "FileManager",
        //     driver: new DynamoDbDriver({ documentClient })
        // }),
        graphqlHandlerPlugins(),
        tenancyPlugins(),
        securityPlugins(),
        {
            type: "context",
            apply(context) {
                context.tenancy.getCurrentTenant = () => {
                    return tenant;
                };
            }
        },
        i18nContext(),
        i18nContentPlugins(),
        mockLocalesPlugins(),
        filesPlugins ? filesPlugins() : [],
        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: () => permissions || [{ name: "*" }]
        },
        {
            type: "security-authentication",
            authenticate: () => {
                return (
                    identity ||
                    new SecurityIdentity({
                        id: "mocked",
                        displayName: "m",
                        type: "admin"
                    })
                );
            }
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
        tenant,
        until,
        handler,
        invoke,
        // Files
        async createFile(variables, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILE(fields), variables } });
        },
        async updateFile(variables, fields: string[] = []) {
            return invoke({ body: { query: UPDATE_FILE(fields), variables } });
        },
        async createFiles(variables, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILES(fields), variables } });
        },
        async deleteFile(variables) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables, fields: string[] = []) {
            return invoke({ body: { query: GET_FILE(fields), variables } });
        },
        async listFiles(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: LIST_FILES(fields), variables } });
        },
        // File Manager settings
        async isInstalled(variables) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async updateSettings(variables) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        },
        ...extraVariables
    };
};

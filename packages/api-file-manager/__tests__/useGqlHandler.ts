import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createHandler } from "@webiny/handler-aws/gateway";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { until } from "@webiny/project-utils/testing/helpers/until";

// Graphql
import {
    CREATE_FILE,
    CREATE_FILES,
    UPDATE_FILE,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES,
    LIST_TAGS
} from "./graphql/file";
import {
    INSTALL,
    IS_INSTALLED,
    GET_SETTINGS,
    UPDATE_SETTINGS
} from "./graphql/fileManagerSettings";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { FilePhysicalStoragePlugin } from "~/plugins/FilePhysicalStoragePlugin";
import { PluginCollection } from "@webiny/plugins/types";
import { getStorageOperations } from "~tests/storageOperations";
import { createFileManagerContext, createFileManagerGraphQL } from "~/index";

export interface UseGqlHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
    plugins?: PluginCollection;
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export default (params: UseGqlHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const { storageOperations, plugins: storagePlugins } = getStorageOperations({});

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            ...storagePlugins,
            createWcpContext(),
            createWcpGraphQL(),
            i18nDynamoDbStorageOperations(),
            graphqlHandlerPlugins(),
            ...createTenancyAndSecurity({ permissions, identity }),
            i18nContext(),
            mockLocalesPlugins(),
            createFileManagerContext({
                storageOperations
            }),
            createFileManagerGraphQL(),
            /**
             * Mock physical file storage plugin.
             */
            new FilePhysicalStoragePlugin({
                // eslint-disable-next-line
                upload: async () => {},
                // eslint-disable-next-line
                delete: async () => {}
            }),
            /**
             * Make sure we dont have undefined plugins value.
             */
            ...(plugins || [])
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as any,
            {} as any
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        until,
        handler,
        invoke,
        // Files
        async createFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILE(fields), variables } });
        },
        async updateFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: UPDATE_FILE(fields), variables } });
        },
        async createFiles(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILES(fields), variables } });
        },
        async deleteFile(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: GET_FILE(fields), variables } });
        },
        async listFiles(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: LIST_FILES(fields), variables } });
        },
        async listTags(variables = {}) {
            return invoke({ body: { query: LIST_TAGS, variables } });
        },
        // File Manager settings
        async isInstalled(variables: Record<string, any>) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        async install(variables = {}) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async updateSettings(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        }
    };
};

import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws/gateway";
import graphqlHandlerPlugins from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTenancyAndSecurity } from "./tenancySecurity";

// Graphql
import {
    CREATE_FILE,
    CREATE_FILES,
    UPDATE_FILE,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES,
    LIST_TAGS
} from "~tests/graphql/file";
import {
    INSTALL,
    IS_INSTALLED,
    GET_SETTINGS,
    UPDATE_SETTINGS
} from "~tests/graphql/fileManagerSettings";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { FilePhysicalStoragePlugin } from "~/plugins/FilePhysicalStoragePlugin";
import { PluginCollection } from "@webiny/plugins/types";
import { createFileManagerContext, createFileManagerGraphQL } from "~/index";
// import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { FileManagerStorageOperations } from "~/types";

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

    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const i18nStorage = getStorageOps<any[]>("i18n");

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            ...fileManagerStorage.plugins,
            createWcpContext(),
            createWcpGraphQL(),
            ...i18nStorage.storageOperations,
            graphqlHandlerPlugins(),
            ...createTenancyAndSecurity({ permissions, identity }),
            i18nContext(),
            mockLocalesPlugins(),
            // createHeadlessCmsContext({ storageOperations }),
            // createHeadlessCmsGraphQL(),
            createFileManagerContext({
                storageOperations: fileManagerStorage.storageOperations
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

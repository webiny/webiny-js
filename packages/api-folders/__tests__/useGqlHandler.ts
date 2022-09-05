import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createHandler } from "@webiny/handler-aws/gateway";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { PluginCollection } from "@webiny/plugins/types";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

import { createFoldersContext, createFoldersGraphQL } from "~/index";

import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";

// Graphql
import {
    CREATE_FOLDER,
    DELETE_FOLDER,
    GET_FOLDER,
    LIST_FOLDERS,
    UPDATE_FOLDER
} from "./graphql/folders";

export interface UseGqlHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
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

const defaultIdentity: SecurityIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export default (params: UseGqlHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;
    // @ts-ignore
    if (typeof __getStorageOperations !== "function") {
        throw new Error(`There is no global "__getStorageOperations" function.`);
    }
    // @ts-ignore
    const { createStorageOperations, getGlobalPlugins } = __getStorageOperations();
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperations" must be a function to initialize storage operations.`
        );
    }
    if (typeof getGlobalPlugins === "function") {
        plugins.push(...getGlobalPlugins());
    }

    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler({
        plugins: [
            ...plugins,
            createWcpContext(),
            createWcpGraphQL(),
            graphQLHandlerPlugins(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createFoldersGraphQL(),
            createFoldersContext({ storageOperations: createStorageOperations() })
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

    const folders = {
        async create(variables = {}) {
            return invoke({ body: { query: CREATE_FOLDER, variables } });
        },
        async update(variables = {}) {
            return invoke({ body: { query: UPDATE_FOLDER, variables } });
        },
        async delete(variables = {}) {
            return invoke({ body: { query: DELETE_FOLDER, variables } });
        },
        async list(variables = {}) {
            return invoke({ body: { query: LIST_FOLDERS, variables } });
        },
        async get(variables = {}) {
            return invoke({ body: { query: GET_FOLDER, variables } });
        }
    };

    return {
        handler,
        invoke,
        folders
    };
};

//import { DocumentClient } from "aws-sdk/clients/dynamodb";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createHandler } from "@webiny/handler-aws/gateway";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
/**
 * Unfortunately at we need to import the api-i18n-ddb package manually
 */
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createTenancyAndSecurity } from "./tenancySecurity";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

import {
    CREATE_FOLDER,
    DELETE_FOLDER,
    GET_FOLDER,
    LIST_FOLDERS,
    UPDATE_FOLDER
} from "./graphql/folder.gql";
import { createACO } from "~/index";

export interface CreateGQLHandlerParams {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
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

export interface PermissionsArg {
    name: string;
    locales?: string[];
    rwd?: string;
    pw?: string | null;
    own?: boolean;
}

// const documentClient = new DocumentClient({
//     convertEmptyValues: true,
//     endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
//     sslEnabled: false,
//     region: "local",
//     accessKeyId: "test",
//     secretAccessKey: "test"
// });

export const createGraphQlHandler = (params: CreateGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    // const ops = getStorageOperations({
    //     plugins: params.storageOperationPlugins || [],
    //     documentClient
    // });
    //
    // const tenant = {
    //     id: "root",
    //     name: "Root",
    //     parent: null
    // };
    //
    // /**
    //  * We're using ddb-only storageOperations here because current jest setup doesn't allow
    //  * usage of more than one storageOperations at a time with the help of --keyword flag.
    //  */
    // const headlessCmsApp = createHeadlessCmsContext({
    //     storageOperations: createHeadlessCmsStorageOperations({
    //         documentClient
    //     })
    // });

    // const handler = createHandler({
    //     plugins: [
    //         ...ops.plugins,
    //         ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
    //         apiKeyAuthentication({ identityType: "api-key" }),
    //         apiKeyAuthorization({ identityType: "api-key" }),
    //         i18nContext(),
    //         i18nDynamoDbStorageOperations(),
    //         mockLocalesPlugins(),
    //         ...headlessCmsApp,
    //         createACO(),
    //         plugins
    //     ],
    //     http: {
    //         debug: false
    //     }
    // });

    const handler = createHandler({
        plugins: [
            plugins,
            graphQLHandlerPlugins(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createACO()
        ],
        http: {
            debug: false
        }
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

    const folder = {
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
        params,
        handler,
        invoke,
        aco: {
            folder
        }
    };
};

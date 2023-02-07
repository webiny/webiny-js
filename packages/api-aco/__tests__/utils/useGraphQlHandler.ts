import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws/gateway";
import createGraphQLHandler from "@webiny/handler-graphql";
import { Plugin, PluginCollection } from "@webiny/plugins/types";

import { createTenancyAndSecurity } from "./tenancySecurity";

import {
    CREATE_FOLDER,
    DELETE_FOLDER,
    GET_FOLDER,
    LIST_FOLDERS,
    UPDATE_FOLDER
} from "../graphql/folder.gql";
import { createACO } from "~/index";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
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

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    // @ts-ignore
    if (typeof __getCreateStorageOperations !== "function") {
        throw new Error(`There is no global "__getCreateStorageOperations" function.`);
    }
    // @ts-ignore
    const { createStorageOperations, getPlugins } = __getCreateStorageOperations();
    if (typeof createStorageOperations !== "function") {
        throw new Error(
            `A product of "__getCreateStorageOperations" must be a function to initialize storage operations.`
        );
    }
    if (typeof getPlugins === "function") {
        plugins.push(...getPlugins());
    }

    const handler = createHandler({
        plugins: [
            plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: createHeadlessCmsStorageOperations({
                    documentClient
                })
            }),
            createHeadlessCmsGraphQL(),
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

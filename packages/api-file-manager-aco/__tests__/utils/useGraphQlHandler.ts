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

import { CREATE_FILE, CREATE_FILES, DELETE_FILE, UPDATE_FILE } from "~tests/graphql/file.gql";

import { GET_RECORD } from "~tests/graphql/record.gql";

import { createAcoFileManagerContext } from "~/index";
import { createStorageOperations } from "~tests/utils/storageOperations";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import { createAco } from "@webiny/api-aco";
import path from "path";
import fs from "fs";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
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
    const { permissions, identity, plugins = [], storageOperationPlugins } = params;

    const ops = createStorageOperations({
        plugins: storageOperationPlugins || []
    });

    const handler = createHandler({
        plugins: [
            ...ops.plugins,
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
            createFileManagerContext({
                storageOperations: createFileManagerStorageOperations({
                    documentClient
                })
            }),
            createFileManagerGraphQL(),
            createAco(),
            createAcoFileManagerContext(),
            {
                type: "api-file-manager-storage",
                name: "api-file-manager-storage",
                async upload(args: any) {
                    // TODO: use tmp OS directory
                    const key = path.join(__dirname, args.name);

                    fs.writeFileSync(key, args.buffer);

                    return {
                        file: {
                            key: args.name,
                            name: args.name,
                            type: args.type,
                            size: args.size
                        }
                    };
                },
                async delete() {
                    return;
                }
            },
            plugins
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

    const fileManager = {
        // Files
        async createFile(variables = {}) {
            return invoke({ body: { query: CREATE_FILE, variables } });
        },
        async createFiles(variables = {}) {
            return invoke({ body: { query: CREATE_FILES, variables } });
        },
        async updateFile(variables = {}) {
            return invoke({ body: { query: UPDATE_FILE, variables } });
        },
        async deleteFile(variables = {}) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        }
    };

    const search = {
        async getRecord(variables = {}) {
            return invoke({ body: { query: GET_RECORD, variables } });
        }
    };

    return {
        params,
        handler,
        invoke,
        fileManager,
        search
    };
};

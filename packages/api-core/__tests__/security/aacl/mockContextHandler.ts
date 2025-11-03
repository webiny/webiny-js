import { ContextPlugin } from "@webiny/handler";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { PluginCollection } from "@webiny/plugins/types";
import type { LambdaContext } from "@webiny/handler-aws/types";
import { createApiCore } from "~/index.js";
import { SecurityStorageOperations } from "~/types/security";
import { TenancyStorageOperations } from "~/types/tenancy";
import type { AdminUsersStorageOperations } from "~/types/users.js";
import type { ApiCoreContext } from "~/types/core.js";
import { authenticateUsingHttpHeader } from "~/legacy/security/plugins/authenticateUsingHttpHeader.js";
import { triggerAuthentication } from "~tests/mocks/triggerAuthentication.js";
import { customAuthenticator } from "~tests/mocks/customAuthenticator.js";
import { customAuthorizer } from "~tests/security/aacl/mocks/customAuthorizer.js";

type CreateMockContextHandlerOptions = {
    plugins?: PluginCollection;
    overrideSecurityStorage?: (storageOperations: Record<string, any>) => void;
};

export const createMockContextHandler = (opts: CreateMockContextHandlerOptions = {}) => {
    const tableName = process.env.DB_TABLE as string;
    const documentClient = getDocumentClient();

    const table = new Table({
        name: process.env.DB_TABLE as string,
        partitionKey: "PK",
        sortKey: "SK",
        DocumentClient: documentClient,
        indexes: {
            GSI1: {
                partitionKey: "GSI1_PK",
                sortKey: "GSI1_SK"
            }
        }
    });

    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const usersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    if (opts.overrideSecurityStorage) {
        opts.overrideSecurityStorage(securityStorage);
    }

    const handler = createRawHandler<any, ApiCoreContext>({
        plugins: [
            createApiCore({
                tenancyStorageOperations: tenancyStorage.storageOperations,
                securityStorageOperations: securityStorage.storageOperations,
                usersStorageOperations: usersStorage.storageOperations
            }),
            new ContextPlugin<ApiCoreContext>(async context => {
                context.tenancy = {
                    // @ts-expect-error
                    getCurrentTenant: () => {
                        return {
                            id: "root"
                        };
                    }
                };
            }),
            authenticateUsingHttpHeader(),
            triggerAuthentication(),
            customAuthenticator(),
            customAuthorizer(),

            dbPlugins({
                table: tableName,
                driver: new DynamoDbDriver({ documentClient })
            }),
            createRawEventHandler(async ({ context }) => {
                return context;
            })
        ]
    });

    return {
        handle: () => {
            return handler(
                {
                    httpMethod: "POST",
                    headers: { "x-tenant": "root" },
                    body: ""
                },
                {} as LambdaContext
            );
        },
        documentClient,
        table
    };
};

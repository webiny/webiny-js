import { ContextPlugin } from "@webiny/handler";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { LambdaContext } from "@webiny/handler-aws/types";
import { createApiCore } from "~/index.js";
import type { ApiCoreContext, ApiCoreStorageOperations } from "~/types/core.js";
import { authenticateUsingHttpHeader } from "~/legacy/security/plugins/authenticateUsingHttpHeader.js";
import { triggerAuthentication } from "~tests/mocks/triggerAuthentication.js";
import { customAuthenticator } from "~tests/mocks/customAuthenticator.js";
import { customAuthorizer } from "~tests/security/aacl/mocks/customAuthorizer.js";

export const createMockContextHandler = () => {
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

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");

    const handler = createRawHandler<any, ApiCoreContext>({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
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

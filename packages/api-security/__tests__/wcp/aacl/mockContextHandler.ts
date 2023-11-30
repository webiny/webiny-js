import { ContextPlugin } from "@webiny/handler";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { createWcpContext } from "@webiny/api-wcp";
import { Table } from "@webiny/db-dynamodb/toolbox";
import { SecurityContext, SecurityStorageOperations } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTenancyContext } from "@webiny/api-tenancy";
import { TenancyStorageOperations } from "@webiny/api-tenancy/types";
import { createSecurityContext } from "@webiny/api-security";
import { triggerAuthentication } from "~tests/wcp/aacl/mocks/triggerAuthentication";
import { customAuthenticator } from "~tests/wcp/aacl/mocks/customAuthenticator";
import { customAuthorizer } from "~tests/wcp/aacl/mocks/customAuthorizer";
import { authenticateUsingHttpHeader } from "@webiny/api-security/plugins/authenticateUsingHttpHeader";
import { PluginCollection } from "@webiny/plugins/types";
import { LambdaContext } from "@webiny/handler-aws/types";

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

    if (opts.overrideSecurityStorage) {
        opts.overrideSecurityStorage(securityStorage);
    }

    const handler = createRawHandler<any, SecurityContext>({
        plugins: [
            createWcpContext(),
            new ContextPlugin<SecurityContext>(async context => {
                // @ts-expect-error
                context.tenancy = {
                    getCurrentTenant: () => {
                        return {
                            id: "root"
                        };
                    }
                };
            }),
            createTenancyContext({
                storageOperations: tenancyStorage.storageOperations
            }),
            createSecurityContext({ storageOperations: securityStorage.storageOperations }),
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

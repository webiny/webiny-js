import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions/index.js";
import { createAuditLogsContext } from "~/context/index.js";
import { createGraphQLSchema } from "~/graphql/schema.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { AuditLogsContext } from "./abstractions.js";
import type { IStorage } from "~/storage/abstractions/Storage.js";

export type { IStorage } from "~/storage/abstractions/Storage.js";
export type {
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageStoreParams,
    IStorageStoreResult,
    IStorageListParams,
    IStorageListResult
} from "~/storage/abstractions/Storage.js";
export type { IAuditLog } from "~/storage/types.js";

export interface ICreateAuditLogsParams {
    deleteLogsAfterDays: number | undefined;
    tableName?: string;
    /**
     * @deprecated Pass `storage` instead. Backwards-compatibility shim;
     * when omitted the audit-logs context falls back to
     * `context.db.driver.getClient()` for the DDB path.
     */
    documentClient?: DynamoDBDocument;
    /**
     * Pre-built storage backend. New preferred input — supply this from
     * `@webiny/api-audit-logs-sqlite` (or another implementation) when
     * running outside the AWS / DDB stack.
     */
    storage?: IStorage;
}

export const createAuditLogs = (params?: ICreateAuditLogsParams) => {
    const subscriptionsPlugin = new ContextPlugin<AuditLogsContext.Interface>(context => {
        if (!context.wcp.canUseFeature("auditLogs")) {
            return;
        }

        context.container.registerInstance(AuditLogsContext, context);

        createSubscriptionHooks(context);
    });

    subscriptionsPlugin.name = "auditLogs.context.subscriptions";
    return [
        subscriptionsPlugin,
        createGraphQLSchema(),
        createAuditLogsContext({
            tableName: params?.tableName,
            deleteLogsAfterDays: params?.deleteLogsAfterDays,
            documentClient: params?.documentClient,
            storage: params?.storage
        })
    ];
};
export * from "~/config.js";

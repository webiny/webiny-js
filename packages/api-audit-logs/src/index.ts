import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions";
import type { AuditLogsContext } from "~/types";
import { createAcoAuditLogsContext } from "~/context/index.js";
import { createGraphQLSchema } from "~/graphql/schema.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ICreateAuditLogsParams {
    deleteLogsAfterDays: number | undefined;
    tableName?: string;
    documentClient?: DynamoDBDocument;
}

export const createAuditLogs = (params?: ICreateAuditLogsParams) => {
    const subscriptionsPlugin = new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.wcp.canUseFeature("auditLogs")) {
            return;
        }
        createSubscriptionHooks(context);
    });

    subscriptionsPlugin.name = "auditLogs.context.subscriptions";

    return [
        subscriptionsPlugin,
        createGraphQLSchema(),
        createAcoAuditLogsContext({
            tableName: params?.tableName,
            deleteLogsAfterDays: params?.deleteLogsAfterDays,
            documentClient: params?.documentClient
        })
    ];
};
export * from "~/config";
export * from "~/context/lifecycle.js";

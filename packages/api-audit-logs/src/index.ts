import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions/index.js";
import { createAuditLogsContext } from "~/context/index.js";
import { createGraphQLSchema } from "~/graphql/schema.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { AuditLogsContext } from "./abstractions.js";

export interface ICreateAuditLogsParams {
    deleteLogsAfterDays: number | undefined;
    tableName?: string;
    documentClient?: DynamoDBDocument;
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
            documentClient: params?.documentClient
        })
    ];
};
export * from "~/config.js";

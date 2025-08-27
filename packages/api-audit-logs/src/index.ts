import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions";
import type { AuditLogsContext } from "~/types";
import { createAcoAuditLogsContext } from "~/app";
import { createGraphQLSchema } from "~/graphql/schema.js";

export interface ICreateAuditLogsParams {
    deleteLogsAfterDays: number;
}

export const createAuditLogs = (params?: ICreateAuditLogsParams) => {
    const subscriptionsPlugin = new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.wcp.canUseFeature("auditLogs")) {
            return;
        }
        createSubscriptionHooks(context);
    });

    subscriptionsPlugin.name = "auditLogs.context.subscriptions";

    return [subscriptionsPlugin, createGraphQLSchema(), createAcoAuditLogsContext(params)];
};
export * from "~/config";
export * from "~/app/lifecycle.js";

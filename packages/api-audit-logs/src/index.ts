import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions/index.js";
import { createAuditLogsContext } from "~/context/index.js";
import { createGraphQLSchema } from "~/graphql/schema.js";
import { AuditLogsContext } from "./abstractions.js";

export interface ICreateAuditLogsParams {
    deleteLogsAfterDays?: number | undefined;
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
            deleteLogsAfterDays: params?.deleteLogsAfterDays
        })
    ];
};
export * from "~/config.js";
export { AuditLogsFeature } from "./AuditLogsFeature.js";
export type { AuditLogsFeatureConfig } from "./AuditLogsFeature.js";

import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions";
import { AuditLogsContext } from "~/types";
import { createAcoAuditLogsContext } from "~/app";

export const createAuditLogs = () => {
    const subscriptionsPlugin = new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.wcp.canUseFeature("auditLogs")) {
            return;
        }
        createSubscriptionHooks(context);
    });

    subscriptionsPlugin.name = "auditLogs.context.subscriptions";

    return [subscriptionsPlugin, createAcoAuditLogsContext()];
};

export * from "~/config";
export * from "~/app/createAppModifier";

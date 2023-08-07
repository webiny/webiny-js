import { ContextPlugin } from "@webiny/api";
import { createSubscriptionHooks } from "~/subscriptions";
import { AuditLogsContext } from "~/types";

export const createAuditLogs = () => {
    const subscriptionsPlugin = new ContextPlugin<AuditLogsContext>(async context => {
        createSubscriptionHooks(context);
    });

    return [subscriptionsPlugin];
};

export * from "~/config";

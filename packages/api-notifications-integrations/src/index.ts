import { ContextPlugin } from "@webiny/handler";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CollaborationNotificationsFeature } from "./collaboration/feature.js";
import { WorkflowNotificationsFeature } from "./workflows/feature.js";

/**
 * Wires the notification inbox to its sources: subscribes to Collaboration events (mentions,
 * replies) and Workflow events (approved, rejected) and creates notifications for the relevant
 * recipients. Register alongside createNotifications() in the API.
 */
export const createNotificationsIntegrations = () => {
    const plugin = new ContextPlugin(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        if (!tenantContext.getTenant()) {
            return;
        }

        CollaborationNotificationsFeature.register(context.container);
        WorkflowNotificationsFeature.register(context.container);
    });

    plugin.name = "notifications.integrations.context";

    return [plugin];
};

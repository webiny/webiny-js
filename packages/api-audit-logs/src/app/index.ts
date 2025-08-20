import { ContextPlugin } from "@webiny/api";
import { createTopic } from "@webiny/pubsub";
import type {
    AuditLogsContext,
    OnAuditLogBeforeCreateTopicParams,
    OnAuditLogBeforeUpdateTopicParams
} from "~/types.js";
import { createApp } from "./app";

export * from "./createAppModifier";

export interface ISetupContextOptions {
    deleteLogsAfterDays: number;
}

const setupContext = async (
    context: AuditLogsContext,
    options?: ISetupContextOptions
): Promise<void> => {
    const onBeforeCreate = createTopic<OnAuditLogBeforeCreateTopicParams>(
        "auditLogs.onBeforeCreate"
    );
    const onBeforeUpdate = createTopic<OnAuditLogBeforeUpdateTopicParams>(
        "auditLogs.onBeforeUpdate"
    );

    const app = await context.aco.registerApp(createApp());

    context.auditLogsAco = {
        app,
        deleteLogsAfterDays: options?.deleteLogsAfterDays,
        onBeforeCreate,
        onBeforeUpdate
    };
};

export const createAcoAuditLogsContext = (params?: ISetupContextOptions) => {
    const plugin = new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Audit Logs ACO.`
            );
            return;
        }
        await setupContext(context, params);
    });

    plugin.name = "audit-logs-aco.createContext";

    return plugin;
};

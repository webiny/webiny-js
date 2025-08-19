import { ContextPlugin } from "@webiny/api";
import { createTopic } from "@webiny/pubsub";
import type {
    AuditLogsAcoContext,
    OnAuditLogBeforeCreateTopicParams,
    OnAuditLogBeforeDeleteTopicParams,
    OnAuditLogBeforeUpdateTopicParams
} from "./types.js";
import { createApp } from "./app";

export * from "./createAppModifier";

const setupContext = async (context: AuditLogsAcoContext): Promise<void> => {
    const onBeforeCreate = createTopic<OnAuditLogBeforeCreateTopicParams>(
        "auditLogs.onBeforeCreate"
    );
    const onBeforeUpdate = createTopic<OnAuditLogBeforeUpdateTopicParams>(
        "auditLogs.onBeforeUpdate"
    );
    const onBeforeDelete = createTopic<OnAuditLogBeforeDeleteTopicParams>(
        "auditLogs.onBeforeDelete"
    );

    const app = await context.aco.registerApp(
        createApp({
            onBeforeCreate,
            onBeforeUpdate,
            onBeforeDelete
        })
    );

    context.auditLogsAco = {
        app,
        onBeforeCreate,
        onBeforeUpdate,
        onBeforeDelete
    };
};
export interface ICreateAcoAuditLogsContextParams {
    deleteLogsAfterDays: number;
}

export const createAcoAuditLogsContext = (params?: ICreateAcoAuditLogsContextParams) => {
    const plugin = new ContextPlugin<AuditLogsAcoContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Audit Logs ACO.`
            );
            return;
        }
        await setupContext(context);
    });

    plugin.name = "audit-logs-aco.createContext";

    return plugin;
};

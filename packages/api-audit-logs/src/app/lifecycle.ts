import type {
    AuditLogsContext,
    OnAuditLogBeforeCreateTopicParams,
    OnAuditLogBeforeUpdateTopicParams
} from "~/types.js";
import { ContextPlugin } from "@webiny/api";

export const attachAuditLogOnCreateEvent = <T>(
    cb: (params: OnAuditLogBeforeCreateTopicParams<T>) => Promise<void>
) => {
    return new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.auditLogsAco) {
            console.log(
                `There is no Audit Logs ACO initialized so we will not attach the "onBeforeCreate" event.`
            );
            return;
        }

        context.auditLogsAco.onBeforeCreate.subscribe(async params => {
            await cb(params);
        });
    });
};

export const attachAuditLogOnUpdateEvent = <T>(
    cb: (params: OnAuditLogBeforeUpdateTopicParams<T>) => Promise<void>
) => {
    return new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.auditLogsAco) {
            console.log(
                `There is no Audit Logs ACO initialized so we will not attach the "onBeforeUpdate" event.`
            );
            return;
        }

        context.auditLogsAco.onBeforeUpdate.subscribe(async params => {
            await cb(params);
        });
    });
};

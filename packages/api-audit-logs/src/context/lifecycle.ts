import type { AuditLogsContext, OnAuditLogBeforeCreateTopicParams } from "~/types.js";
import { ContextPlugin } from "@webiny/api";

export const attachAuditLogOnCreateEvent = (
    cb: (params: OnAuditLogBeforeCreateTopicParams) => Promise<void>
) => {
    return new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.auditLogs) {
            console.log(
                `There is no Audit Logs initialized so we will not attach the "onBeforeCreate" event.`
            );
            return;
        }

        context.auditLogs.onBeforeCreate.subscribe(async params => {
            await cb(params);
        });
    });
};

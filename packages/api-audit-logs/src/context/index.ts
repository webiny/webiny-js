import { ContextPlugin } from "@webiny/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { AuditLogsContext } from "~/types.js";
import { createAuditLogsContextValue } from "./AuditLogsContextValue.js";
import { AuditLogsStorage } from "~/abstractions.js";

export interface ISetupContextOptions {
    deleteLogsAfterDays: number | undefined;
}

const getDeleteLogsAfterDays = (days?: number): number => {
    if (days && days > 0) {
        return days;
    }
    /**
     * Default days to delete logs after.
     */
    return 60;
};

export const createAuditLogsContext = (params?: ISetupContextOptions) => {
    const plugin = new ContextPlugin<AuditLogsContext>(async context => {
        const storage = context.container.resolve(AuditLogsStorage);

        const eventPublisher = context.container.resolve(EventPublisher);

        context.auditLogs = createAuditLogsContextValue({
            getContext: () => {
                return context;
            },
            deleteLogsAfterDays: getDeleteLogsAfterDays(params?.deleteLogsAfterDays),
            storage,
            eventPublisher
        });
    });

    plugin.name = "audit-logs.createContext";

    return plugin;
};

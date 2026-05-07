import { ContextPlugin } from "@webiny/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AuditLogsContext } from "~/types.js";
import { createAuditLogsContextValue } from "./AuditLogsContextValue.js";
import { createStorage } from "~/storage/Storage.js";
import type { IStorage } from "~/storage/abstractions/Storage.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

export interface ISetupContextOptions {
    deleteLogsAfterDays: number | undefined;
    tableName: string | undefined;
    /**
     * @deprecated Pass `storage` instead. Kept for backwards compatibility —
     * when set (or omitted, in which case `context.db.driver.getClient()` is
     * used), an internal DDB-backed Storage is built. Will be removed in a
     * future major.
     */
    documentClient?: DynamoDBDocument | undefined;
    /**
     * Pre-built storage backend. New preferred input. If provided, it wins
     * over `documentClient`. Container deployments supply a SQLite-backed
     * IStorage from `@webiny/api-audit-logs-sqlite`.
     */
    storage?: IStorage;
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
        const compressionHandler = context.container.resolve(CompressionHandler);

        const storage =
            params?.storage ??
            createStorage({
                tableName: params?.tableName,
                client:
                    params?.documentClient || (context.db.driver.getClient() as DynamoDBDocument),
                compressionHandler
            });

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

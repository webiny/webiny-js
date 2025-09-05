import { ContextPlugin } from "@webiny/api";
import type { AuditLogsContext } from "~/types.js";
import { createAuditLogsContextValue } from "./AuditLogsContextValue.js";
import { createStorage } from "~/storage/Storage.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ISetupContextOptions {
    deleteLogsAfterDays: number | undefined;
    tableName: string | undefined;
    documentClient: DynamoDBDocument | undefined;
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

export const createAcoAuditLogsContext = (params?: ISetupContextOptions) => {
    const plugin = new ContextPlugin<AuditLogsContext>(async context => {
        const storage = createStorage({
            tableName: params?.tableName,
            client: params?.documentClient || (context.db.driver.getClient() as DynamoDBDocument),
            compressor: context.compressor
        });

        context.auditLogs = createAuditLogsContextValue({
            getContext: () => {
                return context;
            },
            deleteLogsAfterDays: getDeleteLogsAfterDays(params?.deleteLogsAfterDays),
            storage
        });
    });

    plugin.name = "audit-logs.createContext";

    return plugin;
};

import { ContextPlugin } from "@webiny/api";
import type { AuditLogsContext } from "~/types.js";
import { createAuditLogsContextValue } from "./AuditLogsContextValue.js";
import { createStorage } from "~/storage/Storage.js";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ISetupContextOptions {
    deleteLogsAfterDays?: number;
    tableName?: string;
    documentClient?: DynamoDBDocument;
}

export const createAcoAuditLogsContext = (params?: ISetupContextOptions) => {
    const plugin = new ContextPlugin<AuditLogsContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Audit Logs ACO.`
            );
            return;
        }

        const storage = createStorage({
            tableName: params?.tableName,
            client: params?.documentClient || (context.db.driver.getClient() as DynamoDBDocument),
            compressor: context.compressor
        });

        context.auditLogs = createAuditLogsContextValue({
            getContext: () => context,
            deleteLogsAfterDays: params?.deleteLogsAfterDays,
            storage
        });
    });

    plugin.name = "audit-logs.createContext";

    return plugin;
};

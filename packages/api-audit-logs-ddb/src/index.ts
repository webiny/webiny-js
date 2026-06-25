import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createStorage } from "~/Storage.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

interface RegisterAuditLogsDdbStorageOperationsParams {
    tableName?: string;
}

export const registerAuditLogsDdbStorageOperations = (
    params: RegisterAuditLogsDdbStorageOperationsParams = {}
) => {
    return createRegisterExtensionPlugin(context => {
        const tableFactory = context.container.resolve(DynamoDbTableFactory);
        const entityFactory = context.container.resolve(DynamoDbEntityFactory);
        const compressionHandler = context.container.resolve(CompressionHandler);
        const storage = createStorage({
            tableFactory,
            entityFactory,
            tableName: params.tableName,
            compressionHandler
        });
        context.container.registerInstance(AuditLogsStorage, storage);
    });
};

import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createStorage } from "~/Storage.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

interface RegisterAuditLogsDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
    tableName?: string;
}

export const registerAuditLogsDdbStorageOperations = (
    params: RegisterAuditLogsDdbStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const compressionHandler = context.container.resolve(CompressionHandler);
        const storage = createStorage({
            client: params.documentClient,
            tableName: params.tableName,
            compressionHandler
        });
        context.container.registerInstance(AuditLogsStorage, storage);
    });
};
export { AuditLogsDdbFeature } from "./AuditLogsDdbFeature.js";
export type { AuditLogsDdbFeatureConfig } from "./AuditLogsDdbFeature.js";

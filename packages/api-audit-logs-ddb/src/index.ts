import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { DynamoDBClientFeature } from "@webiny/db-dynamodb";
import { AuditLogsDdbConfig } from "~/abstractions/AuditLogsDdbConfig.js";
import { DdbAuditLogsStorage } from "./DdbAuditLogsStorage.js";

interface RegisterAuditLogsDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
    tableName?: string;
}

export const registerAuditLogsDdbStorageOperations = (
    params: RegisterAuditLogsDdbStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const container = context.container;
        // The storage injects `DynamoDBClient`; this one wraps the given document client.
        // `CompressionHandler` is already registered, so `AuditLogsDdbFeature` (which registers
        // the compressors again) isn't used here.
        DynamoDBClientFeature.register(container, params.documentClient);
        container.registerInstance(AuditLogsDdbConfig, { tableName: params.tableName });
        container.register(DdbAuditLogsStorage).inContainerScope();
    });
};
export { AuditLogsDdbFeature } from "./AuditLogsDdbFeature.js";
export type { AuditLogsDdbFeatureConfig } from "./AuditLogsDdbFeature.js";

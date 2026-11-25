import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createStorage } from "~/Storage.js";
import { AuditLogsStorage } from "@webiny/api-audit-logs/abstractions.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

interface RegisterAuditLogsDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
    tableName?: string;
}

export const registerAuditLogsDdbStorageOperations = (
    params: RegisterAuditLogsDdbStorageOperationsParams
) => {
    return createRegisterExtensionPlugin(context => {
        const container = context.container;
        // Built when first used, in the container that registered it (a tenant scope), with that
        // scope's tenant.
        container.registerFactory(AuditLogsStorage, () => {
            return createStorage({
                client: params.documentClient,
                tableName: params.tableName,
                compressionHandler: container.resolve(CompressionHandler),
                scopeTenant: container.resolve(ScopeTenant)
            });
        });
    });
};
export { AuditLogsDdbFeature } from "./AuditLogsDdbFeature.js";
export type { AuditLogsDdbFeatureConfig } from "./AuditLogsDdbFeature.js";

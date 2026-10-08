import WebinyError from "@webiny/error";
import { ApiKeyAfterUpdateEventHandler } from "@webiny/api-core/features/security/apiKeys/UpdateApiKey/index.js";
import { RecordAuditLogUseCase } from "~/features/RecordAuditLog/abstractions.js";
import { AUDIT } from "~/config.js";
import type { ApiKey } from "@webiny/api-core/types/security.js";

/**
 * We need to remove the token from the API Key object, as it is a security risk.
 *
 * We assign the API Key object explicitly, so we do not miss any new properties that might be added in the future - and they should not be in the log.
 */
const cleanupApiKey = (apiKey: ApiKey): Omit<ApiKey, "token"> => {
    return {
        id: apiKey.id,
        slug: apiKey.slug,
        createdBy: apiKey.createdBy,
        createdOn: apiKey.createdOn,
        description: apiKey.description,
        name: apiKey.name,
        permissions: apiKey.permissions
    };
};

class AuditLogApiKeyAfterUpdateHandlerImpl implements ApiKeyAfterUpdateEventHandler.Interface {
    constructor(private recordAuditLog: RecordAuditLogUseCase.Interface) {}

    async handle(event: ApiKeyAfterUpdateEventHandler.Event): Promise<void> {
        try {
            const { updated: initialApiKey, original: initialOriginalApiKey } = event.payload;

            const apiKey = cleanupApiKey(initialApiKey);
            const original = cleanupApiKey(initialOriginalApiKey);

            const recordResult = await this.recordAuditLog.execute({
                audit: AUDIT.SECURITY.API_KEY.UPDATE,
                message: "API key updated",
                content: {
                    before: original,
                    after: apiKey
                },
                entityId: apiKey.id
            });
            if (recordResult.isFail()) {
                throw recordResult.error;
            }
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogApiKeyAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_API_KEY_UPDATE_HANDLER"
            });
        }
    }
}

export const AuditLogApiKeyAfterUpdateHandler = ApiKeyAfterUpdateEventHandler.createImplementation({
    implementation: AuditLogApiKeyAfterUpdateHandlerImpl,
    dependencies: [RecordAuditLogUseCase]
});

import WebinyError from "@webiny/error";
import { ApiKeyAfterUpdateHandler } from "@webiny/api-core/features/UpdateApiKey";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";
import type { ApiKey } from "@webiny/api-core/types/security.js";

/**
 * We need to remove the token from the API Key object, as it is a security risk.
 *
 * We assign the API Key object explicitly, so we do not miss any new properties that might be added in the future - and they should not be in the log.
 */
const cleanupApiKey = (apiKey: ApiKey): Omit<ApiKey, "token"> => {
    return {
        id: apiKey.id,
        createdBy: apiKey.createdBy,
        createdOn: apiKey.createdOn,
        description: apiKey.description,
        name: apiKey.name,
        permissions: apiKey.permissions,
        tenant: apiKey.tenant,
        webinyVersion: apiKey.webinyVersion
    };
};

export class AuditLogApiKeyAfterUpdateHandler implements ApiKeyAfterUpdateHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: ApiKeyAfterUpdateHandler.Event): Promise<void> {
        try {
            const { updated: initialApiKey, original: initialOriginalApiKey } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.UPDATE);

            const apiKey = cleanupApiKey(initialApiKey);
            const original = cleanupApiKey(initialOriginalApiKey);

            await createAuditLog(
                "API key updated",
                {
                    before: original,
                    after: apiKey
                },
                apiKey.id,
                this.context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogApiKeyAfterUpdateHandler",
                code: "AUDIT_LOGS_AFTER_API_KEY_UPDATE_HANDLER"
            });
        }
    }
}

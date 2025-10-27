import WebinyError from "@webiny/error";
import { ApiKeyAfterDeleteHandler } from "@webiny/api-security/features/apiKeys/DeleteApiKey";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";
import type { ApiKey } from "@webiny/api-security/types.js";

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

export class AuditLogApiKeyAfterDeleteHandler implements ApiKeyAfterDeleteHandler.Interface {
    constructor(private context: AuditLogsContext) {}

    async handle(event: ApiKeyAfterDeleteHandler.Event): Promise<void> {
        try {
            const { apiKey: initialApiKey } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.DELETE);

            const apiKey = cleanupApiKey(initialApiKey);

            await createAuditLog("API key deleted", apiKey, apiKey.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogApiKeyAfterDeleteHandler",
                code: "AUDIT_LOGS_AFTER_API_KEY_DELETE_HANDLER"
            });
        }
    }
}

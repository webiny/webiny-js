import WebinyError from "@webiny/error";
import { ApiKeyAfterCreateEventHandler } from "@webiny/api-core/features/CreateApiKey";
import { AuditLogsContext } from "~/abstractions.js";
import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
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

class AuditLogApiKeyAfterCreateHandlerImpl implements ApiKeyAfterCreateEventHandler.Interface {
    constructor(private context: AuditLogsContext.Interface) {}

    async handle(event: ApiKeyAfterCreateEventHandler.Event): Promise<void> {
        try {
            const { apiKey: initialApiKey } = event.payload;
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);

            const apiKey = cleanupApiKey(initialApiKey);

            await createAuditLog("API key created", apiKey, apiKey.id, this.context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing AuditLogApiKeyAfterCreateHandler",
                code: "AUDIT_LOGS_AFTER_API_KEY_CREATE_HANDLER"
            });
        }
    }
}

export const AuditLogApiKeyAfterCreateHandler = ApiKeyAfterCreateEventHandler.createImplementation({
    implementation: AuditLogApiKeyAfterCreateHandlerImpl,
    dependencies: [AuditLogsContext]
});

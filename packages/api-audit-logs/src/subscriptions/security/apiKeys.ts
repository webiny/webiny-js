import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";
import { ApiKey } from "@webiny/api-security/types";

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

export const onApiKeyAfterCreateHook = (context: AuditLogsContext) => {
    context.security.onApiKeyAfterCreate.subscribe(async ({ apiKey: initialApiKey }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);

            const apiKey = cleanupApiKey(initialApiKey);

            await createAuditLog("API key created", apiKey, apiKey.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onApiKeyAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_API_KEY_CREATE_HOOK"
            });
        }
    });
};

export const onApiKeyAfterUpdateHook = (context: AuditLogsContext) => {
    context.security.onApiKeyAfterUpdate.subscribe(
        async ({ apiKey: initialApiKey, original: initialOriginalApiKey }) => {
            try {
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
                    context
                );
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onApiKeyAfterUpdateHook hook",
                    code: "AUDIT_LOGS_AFTER_API_KEY_UPDATE_HOOK"
                });
            }
        }
    );
};

export const onApiKeyAfterDeleteHook = (context: AuditLogsContext) => {
    context.security.onApiKeyAfterDelete.subscribe(async ({ apiKey: initialApiKey }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.DELETE);

            const apiKey = cleanupApiKey(initialApiKey);

            await createAuditLog("API key deleted", apiKey, apiKey.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onApiKeyAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_API_KEY_DELETE_HOOK"
            });
        }
    });
};

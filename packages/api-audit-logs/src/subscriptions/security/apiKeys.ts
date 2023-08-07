import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onApiKeyAfterCreateHook = (context: AuditLogsContext) => {
    context.security.onApiKeyAfterCreate.subscribe(async ({ apiKey }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.CREATE);

            createAuditLog("API key created", apiKey, apiKey.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onApiKeyAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_API_KEY_CREATE_HOOK"
            });
        }
    });
};

export const onApiKeyAfterUpdateHook = (context: AuditLogsContext) => {
    context.security.onApiKeyAfterUpdate.subscribe(async ({ apiKey, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.UPDATE);

            createAuditLog(
                "API key updated",
                { before: original, after: apiKey },
                apiKey.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onApiKeyAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_API_KEY_UPDATE_HOOK"
            });
        }
    });
};

export const onApiKeyAfterDeleteHook = (context: AuditLogsContext) => {
    context.security.onApiKeyAfterDelete.subscribe(async ({ apiKey }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.SECURITY.API_KEY.DELETE);

            createAuditLog("API key deleted", apiKey, apiKey.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onApiKeyAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_API_KEY_DELETE_HOOK"
            });
        }
    });
};

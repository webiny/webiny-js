import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onSettingsAfterUpdateHook = (context: AuditLogsContext) => {
    context.mailer.onSettingsAfterUpdate.subscribe(async ({ settings, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.MAILER.SETTINGS.UPDATE);

            createAuditLog("Settings updated", { before: original, after: settings }, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onSettingsAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_SETTINGS_UPDATE_HOOK"
            });
        }
    });
};

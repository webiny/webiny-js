import WebinyError from "@webiny/error";

import { AUDIT } from "~/config.js";
import { getAuditConfig } from "~/utils/getAuditConfig.js";
import type { AuditLogsContext } from "~/types.js";
import { SettingsAfterUpdateHandler } from "@webiny/api-file-manager/features/settings/UpdateSettings/events.js";

export const onSettingsAfterUpdateHook = (context: AuditLogsContext) => {
    context.container.registerInstance(SettingsAfterUpdateHandler, {
        handle: async event => {
            const { settings, original } = event.payload;

            try {
                const createAuditLog = getAuditConfig(AUDIT.FILE_MANAGER.SETTINGS.UPDATE);

                await createAuditLog(
                    "Settings updated",
                    { before: original, after: settings },
                    "-",
                    context
                );
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onSettingsAfterUpdateHook hook",
                    code: "AUDIT_LOGS_AFTER_SETTINGS_UPDATE_HOOK"
                });
            }
        }
    });
};

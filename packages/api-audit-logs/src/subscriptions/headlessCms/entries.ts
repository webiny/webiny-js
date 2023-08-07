import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onEntryAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterCreate.subscribe(async ({ entry }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.CREATE);

            createAuditLog("Entry created", entry, entry.entryId, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_CREATE_HOOK"
            });
        }
    });
};

export const onEntryAfterDeleteHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterDelete.subscribe(async ({ entry }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.DELETE);

            createAuditLog("Entry deleted", entry, entry.entryId, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_DELETE_HOOK"
            });
        }
    });
};

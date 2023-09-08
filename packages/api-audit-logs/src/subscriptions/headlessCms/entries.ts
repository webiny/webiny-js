import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { isSearchModelEntry } from "./utils/isSearchModelEntry";
import { AuditLogsContext } from "~/types";

export const onEntryAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterCreate.subscribe(async ({ entry }) => {
        try {
            if (isSearchModelEntry(entry.modelId)) {
                return;
            }

            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.CREATE);

            await createAuditLog("Entry created", entry, entry.entryId, context);
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
            if (isSearchModelEntry(entry.modelId)) {
                return;
            }

            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY.DELETE);

            await createAuditLog("Entry deleted", entry, entry.entryId, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_DELETE_HOOK"
            });
        }
    });
};

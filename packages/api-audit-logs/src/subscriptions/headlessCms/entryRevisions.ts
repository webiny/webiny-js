import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onEntryRevisionAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onEntryRevisionAfterCreate.subscribe(async ({ entry }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.CREATE);

            createAuditLog("Entry revision created", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_CREATE_HOOK"
            });
        }
    });
};

export const onEntryRevisionAfterUpdateHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterUpdate.subscribe(async ({ entry, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UPDATE);

            createAuditLog(
                "Entry revision updated",
                { before: original, after: entry },
                entry.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UPDATE_HOOK"
            });
        }
    });
};

export const onEntryRevisionAfterDeleteHook = (context: AuditLogsContext) => {
    context.cms.onEntryRevisionAfterDelete.subscribe(async ({ entry }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.DELETE);

            createAuditLog("Entry revision deleted", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_DELETE_HOOK"
            });
        }
    });
};

export const onEntryRevisionAfterPublishHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterPublish.subscribe(async ({ entry }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.PUBLISH);

            createAuditLog("Entry revision published", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterPublishHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_PUBLISH_HOOK"
            });
        }
    });
};

export const onEntryRevisionAfterUnpublishHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterUnpublish.subscribe(async ({ entry }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UNPUBLISH);

            createAuditLog("Entry revision unpublished", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterUnpublishHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UNPUBLISH_HOOK"
            });
        }
    });
};

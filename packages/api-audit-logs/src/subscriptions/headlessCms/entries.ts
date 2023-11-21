import WebinyError from "@webiny/error";
import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { isSearchModelEntry } from "./utils/isSearchModelEntry";
import { AuditLogsContext } from "~/types";

export const onEntryAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterCreate.subscribe(async ({ model, entry }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
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

export const onEntryAfterUpdateHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterUpdate.subscribe(async ({ model, entry, original }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UPDATE);

            await createAuditLog(
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

export const onEntryAfterDeleteHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterDelete.subscribe(async ({ model, entry }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
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

export const onEntryRevisionAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onEntryRevisionAfterCreate.subscribe(async ({ model, entry }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.CREATE);

            await createAuditLog("Entry revision created", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_CREATE_HOOK"
            });
        }
    });
};

export const onEntryRevisionAfterDeleteHook = (context: AuditLogsContext) => {
    context.cms.onEntryRevisionAfterDelete.subscribe(async ({ model, entry }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.DELETE);

            await createAuditLog("Entry revision deleted", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_DELETE_HOOK"
            });
        }
    });
};

export const onEntryAfterPublishHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterPublish.subscribe(async ({ model, entry }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.PUBLISH);

            await createAuditLog("Entry revision published", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterPublishHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_PUBLISH_HOOK"
            });
        }
    });
};

export const onEntryAfterUnpublishHook = (context: AuditLogsContext) => {
    context.cms.onEntryAfterUnpublish.subscribe(async ({ model, entry }) => {
        if (model.isPrivate || isSearchModelEntry(entry.modelId)) {
            return;
        }
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.ENTRY_REVISION.UNPUBLISH);

            await createAuditLog("Entry revision unpublished", entry, entry.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onEntryRevisionAfterUnpublishHook hook",
                code: "AUDIT_LOGS_AFTER_ENTRY_REVISION_UNPUBLISH_HOOK"
            });
        }
    });
};

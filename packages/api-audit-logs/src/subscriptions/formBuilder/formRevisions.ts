import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onFormRevisionAfterCreateHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormRevisionAfterCreate.subscribe(async ({ form }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM_REVISION.CREATE);

            await createAuditLog("Form revision created", form, form.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormRevisionAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_REVISION_CREATE_HOOK"
            });
        }
    });
};

export const onFormRevisionAfterUpdateHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormAfterUpdate.subscribe(async ({ form, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM_REVISION.UPDATE);

            await createAuditLog(
                "Form revision updated",
                { before: original, after: form },
                form.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormRevisionAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_REVISION_UPDATE_HOOK"
            });
        }
    });
};

export const onFormRevisionAfterDeleteHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormRevisionAfterDelete.subscribe(async ({ form }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM_REVISION.DELETE);

            await createAuditLog("Form revision deleted", form, form.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormRevisionAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_REVISION_DELETE_HOOK"
            });
        }
    });
};

export const onFormRevisionAfterPublishHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormAfterPublish.subscribe(async ({ form }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM_REVISION.PUBLISH);

            await createAuditLog("Form revision published", form, form.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormRevisionAfterPublishHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_REVISION_PUBLISH_HOOK"
            });
        }
    });
};

export const onFormRevisionAfterUnpublishHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormAfterUnpublish.subscribe(async ({ form }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM_REVISION.UNPUBLISH);

            await createAuditLog("Form revision unpublished", form, form.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormRevisionAfterUnpublishHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_REVISION_UNPUBLISH_HOOK"
            });
        }
    });
};

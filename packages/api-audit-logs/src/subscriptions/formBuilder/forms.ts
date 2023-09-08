import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onFormAfterCreateHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormAfterCreate.subscribe(async ({ form }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM.CREATE);

            await createAuditLog("Form created", form, form.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_CREATE_HOOK"
            });
        }
    });
};

export const onFormAfterDeleteHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormAfterDelete.subscribe(async ({ form }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM.DELETE);

            await createAuditLog("Form deleted", form, form.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_DELETE_HOOK"
            });
        }
    });
};

export const onFormsAfterExportHook = (context: AuditLogsContext) => {
    context.formBuilder.forms.onFormsAfterExport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM.EXPORT);

            await createAuditLog("Forms exported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormsAfterExportHook hook",
                code: "AUDIT_LOGS_FORMS_EXPORT_HOOK"
            });
        }
    });
};

export const onFormsAfterImportHook = (context: AuditLogsContext) => {
    context.formBuilder.forms.onFormsAfterImport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM.IMPORT);

            await createAuditLog("Forms imported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormsAfterImportHook hook",
                code: "AUDIT_LOGS_FORMS_IMPORT_HOOK"
            });
        }
    });
};

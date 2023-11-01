import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onTemplateAfterCreateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageTemplateAfterCreate.subscribe(async ({ pageTemplate }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.TEMPLATE.CREATE);

            await createAuditLog("Template created", pageTemplate, pageTemplate.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTemplateAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_TEMPLATE_CREATE_HOOK"
            });
        }
    });
};

export const onTemplateAfterUpdateHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageTemplateAfterUpdate.subscribe(async ({ pageTemplate, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.TEMPLATE.UPDATE);

            await createAuditLog(
                "Template updated",
                { before: original, after: pageTemplate },
                pageTemplate.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTemplateAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_TEMPLATE_UPDATE_HOOK"
            });
        }
    });
};

export const onTemplateAfterDeleteHook = (context: AuditLogsContext) => {
    context.pageBuilder.onPageTemplateAfterDelete.subscribe(async ({ pageTemplate }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.TEMPLATE.DELETE);

            await createAuditLog("Template deleted", pageTemplate, pageTemplate.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTemplateAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_TEMPLATE_DELETE_HOOK"
            });
        }
    });
};

export const onTemplatesAfterExportHook = (context: AuditLogsContext) => {
    context.pageBuilder.templates.onTemplatesAfterExport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.TEMPLATE.EXPORT);

            await createAuditLog("Templates exported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTemplatesAfterExportHook hook",
                code: "AUDIT_LOGS_TEMPLATES_EXPORT_HOOK"
            });
        }
    });
};

export const onTemplatesAfterImportHook = (context: AuditLogsContext) => {
    context.pageBuilder.templates.onTemplatesAfterImport.subscribe(async ({ params }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.PAGE_BUILDER.TEMPLATE.IMPORT);

            await createAuditLog("Templates imported", params, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onTemplatesAfterImportHook hook",
                code: "AUDIT_LOGS_TEMPLATES_IMPORT_HOOK"
            });
        }
    });
};

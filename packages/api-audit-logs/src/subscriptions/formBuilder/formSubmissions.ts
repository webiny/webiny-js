import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onFormSubmissionsAfterExportHook = (context: AuditLogsContext) => {
    context.formBuilder.onFormSubmissionsAfterExport.subscribe(async ({ result }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.FORM_BUILDER.FORM_SUBMISSION.EXPORT);

            await createAuditLog("Form submissions exported", result, "-", context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFormSubmissionsAfterExportHook hook",
                code: "AUDIT_LOGS_AFTER_FORM_SUBMISSION_EXPORT_HOOK"
            });
        }
    });
};

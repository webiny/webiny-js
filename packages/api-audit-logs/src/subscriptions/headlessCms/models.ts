import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onModelAfterCreateHook = (context: AuditLogsContext) => {
    context.cms.onModelAfterCreate.subscribe(async ({ model }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.CREATE);

            await createAuditLog("Model created", model, model.modelId, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onModelAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_MODEL_CREATE_HOOK"
            });
        }
    });
};

export const onModelAfterUpdateHook = (context: AuditLogsContext) => {
    context.cms.onModelAfterUpdate.subscribe(async ({ model, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.UPDATE);

            await createAuditLog(
                "Model updated",
                { before: original, after: model },
                model.modelId,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onModelAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_MODEL_UPDATE_HOOK"
            });
        }
    });
};

export const onModelAfterDeleteHook = (context: AuditLogsContext) => {
    context.cms.onModelAfterDelete.subscribe(async ({ model }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.HEADLESS_CMS.MODEL.DELETE);

            await createAuditLog("Model deleted", model, model.modelId, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onModelAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_MODEL_DELETE_HOOK"
            });
        }
    });
};

import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onWorkflowAfterCreateHook = (context: AuditLogsContext) => {
    context.apw.workflow.onWorkflowAfterCreate.subscribe(async ({ workflow }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.WORKFLOW.CREATE);

            await createAuditLog("Workflow created", workflow, workflow.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onWorkflowAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_WORKFLOW_CREATE_HOOK"
            });
        }
    });
};

export const onWorkflowAfterUpdateHook = (context: AuditLogsContext) => {
    context.apw.workflow.onWorkflowAfterUpdate.subscribe(async ({ workflow, original }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.WORKFLOW.UPDATE);

            await createAuditLog(
                "Workflow updated",
                { before: original, after: workflow },
                workflow.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onWorkflowAfterUpdateHook hook",
                code: "AUDIT_LOGS_AFTER_WORKFLOW_UPDATE_HOOK"
            });
        }
    });
};

export const onWorkflowAfterDeleteHook = (context: AuditLogsContext) => {
    context.apw.workflow.onWorkflowAfterDelete.subscribe(async ({ workflow }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.WORKFLOW.DELETE);

            await createAuditLog("Workflow deleted", workflow, workflow.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onWorkflowAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_WORKFLOW_DELETE_HOOK"
            });
        }
    });
};

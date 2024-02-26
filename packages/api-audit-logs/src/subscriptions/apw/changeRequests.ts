import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onChangeRequestAfterCreateHook = (context: AuditLogsContext) => {
    context.apw.changeRequest.onChangeRequestAfterCreate.subscribe(async ({ changeRequest }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.CHANGE_REQUEST.CREATE);

            await createAuditLog(
                "Change request created",
                changeRequest,
                changeRequest.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onChangeRequestAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_CHANGE_REQUEST_CREATE_HOOK"
            });
        }
    });
};

export const onChangeRequestAfterUpdateHook = (context: AuditLogsContext) => {
    context.apw.changeRequest.onChangeRequestAfterUpdate.subscribe(
        async ({ changeRequest, original, input }) => {
            try {
                const resolved = input.data?.resolved;

                if (resolved === true) {
                    const createAuditLog = getAuditConfig(AUDIT.APW.CHANGE_REQUEST.MARK_RESOLVED);

                    await createAuditLog(
                        "Change request marked as resolved",
                        { before: original, after: changeRequest },
                        changeRequest.id,
                        context
                    );
                } else if (typeof resolved === "boolean" && resolved === false) {
                    const createAuditLog = getAuditConfig(AUDIT.APW.CHANGE_REQUEST.MARK_UNRESOLVED);

                    await createAuditLog(
                        "Change request marked as unresolved",
                        { before: original, after: changeRequest },
                        changeRequest.id,
                        context
                    );
                } else {
                    const createAuditLog = getAuditConfig(AUDIT.APW.CHANGE_REQUEST.UPDATE);

                    await createAuditLog(
                        "Change request updated",
                        { before: original, after: changeRequest },
                        changeRequest.id,
                        context
                    );
                }
            } catch (error) {
                throw WebinyError.from(error, {
                    message: "Error while executing onChangeRequestAfterUpdateHook hook",
                    code: "AUDIT_LOGS_AFTER_CHANGE_REQUEST_UPDATE_HOOK"
                });
            }
        }
    );
};

export const onChangeRequestAfterDeleteHook = (context: AuditLogsContext) => {
    context.apw.changeRequest.onChangeRequestAfterDelete.subscribe(async ({ changeRequest }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.CHANGE_REQUEST.DELETE);

            await createAuditLog(
                "Change request deleted",
                changeRequest,
                changeRequest.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onChangeRequestAfterDeleteHook hook",
                code: "AUDIT_LOGS_AFTER_CHANGE_REQUEST_DELETE_HOOK"
            });
        }
    });
};

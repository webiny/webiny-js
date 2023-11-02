import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onCommentAfterCreateHook = (context: AuditLogsContext) => {
    context.apw.comment.onCommentAfterCreate.subscribe(async ({ comment }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.COMMENT.CREATE);

            await createAuditLog("Comment created", comment, comment.id, context);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onCommentAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_COMMENT_CREATE_HOOK"
            });
        }
    });
};

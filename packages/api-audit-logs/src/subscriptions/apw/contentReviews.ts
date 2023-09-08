import WebinyError from "@webiny/error";

import { AUDIT } from "~/config";
import { getAuditConfig } from "~/utils/getAuditConfig";
import { AuditLogsContext } from "~/types";

export const onContentReviewAfterCreateHook = (context: AuditLogsContext) => {
    context.apw.contentReview.onContentReviewAfterCreate.subscribe(async ({ contentReview }) => {
        try {
            const createAuditLog = getAuditConfig(AUDIT.APW.CONTENT_REVIEW.CREATE);

            await createAuditLog(
                "Content review created",
                contentReview,
                contentReview.id,
                context
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onContentReviewAfterCreateHook hook",
                code: "AUDIT_LOGS_AFTER_CONTENT_REVIEW_CREATE_HOOK"
            });
        }
    });
};

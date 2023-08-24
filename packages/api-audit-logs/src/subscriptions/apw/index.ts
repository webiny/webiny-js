import {
    onChangeRequestAfterCreateHook,
    onChangeRequestAfterUpdateHook,
    onChangeRequestAfterDeleteHook
} from "./changeRequests";
import { onCommentAfterCreateHook } from "./comments";
import { onContentReviewAfterCreateHook } from "./contentReviews";
import {
    onWorkflowAfterCreateHook,
    onWorkflowAfterUpdateHook,
    onWorkflowAfterDeleteHook
} from "./workflows";

import { AuditLogsContext } from "~/types";

export const createApwHooks = (context: AuditLogsContext) => {
    if (!context.apw) {
        return;
    }
    onChangeRequestAfterCreateHook(context);
    onChangeRequestAfterUpdateHook(context);
    onChangeRequestAfterDeleteHook(context);
    onCommentAfterCreateHook(context);
    onContentReviewAfterCreateHook(context);
    onWorkflowAfterCreateHook(context);
    onWorkflowAfterUpdateHook(context);
    onWorkflowAfterDeleteHook(context);
};

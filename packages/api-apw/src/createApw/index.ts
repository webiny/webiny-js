import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import { createWorkflowMethods } from "./createWorkflowMethods";
import { createReviewerMethods } from "./createReviewerMethods";
import { createCommentMethods } from "./createCommentMethods";
import { createChangeRequestMethods } from "./createChangeRequestMethods";
import { createContentReviewMethods } from "./createContentReviewMethods";

export const createAdvancedPublishingWorkflow = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.apw = {
            workflow: createWorkflowMethods(context),
            reviewer: createReviewerMethods(context),
            comment: createCommentMethods(context),
            changeRequest: createChangeRequestMethods(context),
            contentReview: createContentReviewMethods(context)
        };
    });

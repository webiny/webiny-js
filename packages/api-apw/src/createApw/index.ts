import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";
import { createWorkflowMethods } from "./createWorkflowMethods";
import { createReviewerMethods } from "./createReviewerMethods";

export const createAdvancedPublishingWorkflow = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.advancedPublishingWorkflow = {
            workflow: createWorkflowMethods(context),
            reviewer: createReviewerMethods(context)
        };
    });

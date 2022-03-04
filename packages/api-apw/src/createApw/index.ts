import { createWorkflowMethods } from "./createWorkflowMethods";
import { createReviewerMethods } from "./createReviewerMethods";
import { createCommentMethods } from "./createCommentMethods";
import { createChangeRequestMethods } from "./createChangeRequestMethods";
import { createContentReviewMethods } from "./createContentReviewMethods";
import {
    AdvancedPublishingWorkflow,
    ApwContentTypes,
    CreateApwParams,
    WorkflowGetter
} from "~/types";

export const createApw = (params: CreateApwParams): AdvancedPublishingWorkflow => {
    const workflowGetters = new Map<ApwContentTypes, WorkflowGetter>();

    const workflowMethods = createWorkflowMethods(params);
    const reviewerMethods = createReviewerMethods(params);
    const changeRequestMethods = createChangeRequestMethods(params);

    return {
        addWorkflowGetter(type, func) {
            workflowGetters.set(type, func);
        },
        getWorkflowGetter(type) {
            const getter = workflowGetters.get(type);
            if (!getter) {
                throw new Error(`No loader found for type: "${type}". You must define a loader.`);
            }
            return getter;
        },
        workflow: workflowMethods,
        reviewer: reviewerMethods,
        changeRequest: changeRequestMethods,
        comment: createCommentMethods(params),
        contentReview: createContentReviewMethods({
            ...params,
            getReviewer: reviewerMethods.get.bind(reviewerMethods)
        })
    };
};

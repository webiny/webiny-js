import { createWorkflowMethods } from "./createWorkflowMethods";
import { createReviewerMethods } from "./createReviewerMethods";
import { createCommentMethods } from "./createCommentMethods";
import { createChangeRequestMethods } from "./createChangeRequestMethods";
import { createContentReviewMethods } from "./createContentReviewMethods";
import {
    AdvancedPublishingWorkflow,
    ApwContentTypes,
    ContentGetter,
    CreateApwParams
} from "~/types";

export const createApw = (params: CreateApwParams): AdvancedPublishingWorkflow => {
    const contentGetters = new Map<ApwContentTypes, ContentGetter>();

    const workflowMethods = createWorkflowMethods(params);
    const reviewerMethods = createReviewerMethods(params);
    const changeRequestMethods = createChangeRequestMethods(params);

    return {
        addContentGetter(type, func) {
            contentGetters.set(type, func);
        },
        getContentGetter(type) {
            if (!contentGetters.has(type)) {
                throw new Error(
                    `No "ContentGetter" loader found for type: "${type}". You must define a loader.`
                );
            }
            return contentGetters.get(type);
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

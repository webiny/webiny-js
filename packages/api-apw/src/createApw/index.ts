import { createWorkflowMethods } from "./createWorkflowMethods";
import { createReviewerMethods } from "./createReviewerMethods";
import { createCommentMethods } from "./createCommentMethods";
import { createChangeRequestMethods } from "./createChangeRequestMethods";
import { createContentReviewMethods } from "./createContentReviewMethods";
import {
    AdvancedPublishingWorkflow,
    ApwContentTypes,
    ContentGetter,
    ContentPublisher,
    ContentUnPublisher,
    CreateApwParams
} from "~/types";

export const createApw = (params: CreateApwParams): AdvancedPublishingWorkflow => {
    const contentGetters = new Map<ApwContentTypes, ContentGetter>();
    const contentPublisher = new Map<ApwContentTypes, ContentPublisher>();
    const contentUnPublisher = new Map<ApwContentTypes, ContentUnPublisher>();

    const workflowMethods = createWorkflowMethods(params);
    const reviewerMethods = createReviewerMethods(params);
    const changeRequestMethods = createChangeRequestMethods(params);

    const getContentGetter = type => {
        if (!contentGetters.has(type)) {
            throw new Error(
                `No "ContentGetter" loader found for type: "${type}". You must define a loader.`
            );
        }
        return contentGetters.get(type);
    };

    const getContentPublisher = type => {
        if (!contentPublisher.has(type)) {
            throw new Error(
                `No "ContentPublisher" loader found for type: "${type}". You must define a loader.`
            );
        }
        return contentPublisher.get(type);
    };

    const getContentUnPublisher = type => {
        if (!contentUnPublisher.has(type)) {
            throw new Error(
                `No "Content UnPublisher" loader found for type: "${type}". You must define a loader.`
            );
        }
        return contentUnPublisher.get(type);
    };

    return {
        addContentPublisher(type, func) {
            contentPublisher.set(type, func);
        },
        getContentPublisher,
        addContentGetter(type, func) {
            contentGetters.set(type, func);
        },
        getContentGetter,
        addContentUnPublisher(type, func) {
            contentUnPublisher.set(type, func);
        },
        getContentUnPublisher,
        workflow: workflowMethods,
        reviewer: reviewerMethods,
        changeRequest: changeRequestMethods,
        comment: createCommentMethods(params),
        contentReview: createContentReviewMethods({
            ...params,
            getReviewer: reviewerMethods.get.bind(reviewerMethods),
            getContentGetter,
            getContentPublisher,
            getContentUnPublisher
        })
    };
};

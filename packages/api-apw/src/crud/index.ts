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

    function getContentGetter(type: ApwContentTypes) {
        const getter = contentGetters.get(type);
        if (!getter) {
            throw new Error(
                `No "ContentGetter" loader found for type: "${type}". You must define a loader.`
            );
        }
        return getter;
    }

    function getContentUnPublisher(type: ApwContentTypes) {
        const getter = contentUnPublisher.get(type);
        if (!getter) {
            throw new Error(
                `No "Content UnPublisher" loader found for type: "${type}". You must define a loader.`
            );
        }
        return getter;
    }

    function getContentPublisher(type: ApwContentTypes) {
        const getter = contentPublisher.get(type);
        if (!getter) {
            throw new Error(
                `No "ContentPublisher" loader found for type: "${type}". You must define a loader.`
            );
        }
        return getter;
    }

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
        }),
        /**
         * Add scheduler to context so that we can access it later. For example, during testing.
         */
        scheduleAction: params.scheduler
    };
};

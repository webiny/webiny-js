import Error from "@webiny/error";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import {
    ApwContentReview,
    ApwContentReviewListParams,
    ApwContentReviewStatus,
    ApwContentReviewStep,
    ApwContentReviewStepStatus,
    ApwWorkflowStepTypes,
    ListMeta
} from "~/types";
import { CreateContentReviewMethodsParams } from "./createContentReviewMethods";

dayjs.extend(utc);

export function checkValidDateTime(datetime: string | undefined): void {
    if (typeof datetime !== "string") {
        return;
    }

    if (!dayjs(datetime).isValid()) {
        throw new Error({
            message: `Invalid input "datetime" should be an ISO string.`,
            code: "INVALID_DATETIME_FORMAT",
            data: {
                datetime
            }
        });
    }
    const today = dayjs.utc();

    if (dayjs(datetime).isBefore(today)) {
        throw new Error({
            message: `Cannot schedule for a past "datetime".`,
            code: "PAST_DATETIME",
            data: {
                datetime
            }
        });
    }
}

export interface GetPendingRequiredSteps {
    (
        steps: ApwContentReviewStep[],
        predicate: (step: ApwContentReviewStep) => boolean
    ): ApwContentReviewStep[];
}

export const getPendingRequiredSteps: GetPendingRequiredSteps = (steps, predicate) => {
    return steps.filter(step => {
        const isRequiredStep = [
            ApwWorkflowStepTypes.MANDATORY_BLOCKING,
            ApwWorkflowStepTypes.MANDATORY_NON_BLOCKING
        ].includes(step.type);

        if (!isRequiredStep) {
            return false;
        }

        return predicate(step);
    });
};

export const INITIAL_CONTENT_REVIEW_CONTENT_SCHEDULE_META = {
    scheduledOn: null,
    scheduledBy: null,
    scheduledActionId: null
};

export interface FilterContentReviewsParams
    extends Pick<CreateContentReviewMethodsParams, "getReviewer" | "getIdentity"> {
    listParams: ApwContentReviewListParams;
    listContentReviews: CreateContentReviewMethodsParams["storageOperations"]["listContentReviews"];
}

/**
 * Filter "content reviews" that are "underReview" and current user is a reviewer for the active step.
 * That is the user is able to provide sign-off or comment.
 */
export const filterContentReviewsByRequiresMyAttention = async (
    params: FilterContentReviewsParams
): Promise<[ApwContentReview[], ListMeta]> => {
    const { listContentReviews, listParams, getIdentity, getReviewer } = params;
    /**
     * Get all "content reviews" with status "underReview"
     */
    const newListParams = set(
        cloneDeep(listParams),
        "where.status",
        ApwContentReviewStatus.UNDER_REVIEW
    );
    const [contentReviews, meta] = await listContentReviews(newListParams);

    const identity = getIdentity();
    const filteredItems = [];
    /**
     * Filter items where current user is a reviewer for the active step.
     */
    for (let i = 0; i < contentReviews.length; i++) {
        const contentReview = contentReviews[i];

        const activeStep = contentReview.steps.find(
            step => step.status === ApwContentReviewStepStatus.ACTIVE
        );

        if (!activeStep) {
            continue;
        }

        let requiresMyAttention = false;

        for (let j = 0; j < activeStep.reviewers.length; j++) {
            const { id } = activeStep.reviewers[j];
            /**
             * Load reviewer
             */
            const reviewer = await getReviewer(id);
            /**
             * Check if the current logged in user is the reviewer.
             */
            if (reviewer.identityId === identity.id) {
                requiresMyAttention = true;
                break;
            }
        }

        if (requiresMyAttention) {
            filteredItems.push(contentReview);
        }
    }

    return [
        filteredItems,
        {
            ...meta,
            totalCount: filteredItems.length
        }
    ];
};

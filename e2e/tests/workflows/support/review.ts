import type { ApiSession } from "../../../support/apiSession.ts";
import { callGraphql, requireData } from "../../../support/callGraphql.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import type { TestEntry } from "../../../support/entry.ts";

/**
 * Who holds a step. `displayName` is the name the API stored for the owner: what the identity
 * provider calls them, which is not always the name on their user profile.
 */
export interface ReviewStepOwner {
    id: string;
    displayName: string;
}

/** A step of a review as the API returns it. */
export interface ReviewStep {
    id: string;
    title: string;
    state: string;
    comment: string | null;
    owner: ReviewStepOwner | null;
}

/** A review as the API returns it. */
export interface Review {
    id: string;
    title: string;
    state: string;
    isActive: boolean;
    currentStepId: string | null;
    currentOwnerId: string | null;
    steps: ReviewStep[];
}

/** What the API answered to a review operation: the review, or the error code it refused with. */
export interface ReviewAttempt {
    review: Review | null;
    errorCode: string | null;
    errorMessage: string | null;
}

/** The step a review operation acts on. */
export interface ReviewStepRef {
    reviewId: string;
    stepId: string;
}

interface WorkflowsError {
    code: string | null;
    message: string | null;
}

interface ReviewResponse {
    data: Review | null;
    error: WorkflowsError | null;
}

interface ReviewWithFlagsResponse {
    data: { review: Review } | null;
    error: WorkflowsError | null;
}

interface ReviewMutationData {
    cms: {
        operation: ReviewResponse;
    };
}

interface TargetReviewData {
    cms: {
        getCmsEntryTargetReview: ReviewWithFlagsResponse;
    };
}

const REVIEW_FIELDS = /* GraphQL */ `
    id
    title
    state
    isActive
    currentStepId
    currentOwnerId
    steps {
        id
        title
        state
        comment
        owner {
            id
            displayName
        }
    }
`;

const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview($modelId: ID!, $revisionId: ID!, $title: String) {
        cms {
            operation: requestCmsEntryReview(
                modelId: $modelId
                revisionId: $revisionId
                title: $title
            ) {
                data { ${REVIEW_FIELDS} }
                error { code message }
            }
        }
    }
`;

const START_STEP = /* GraphQL */ `
    mutation StartStep($reviewId: ID!, $stepId: ID!) {
        cms {
            operation: startCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW_FIELDS} }
                error { code message }
            }
        }
    }
`;

const APPROVE_STEP = /* GraphQL */ `
    mutation ApproveStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            operation: approveCmsEntryReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
            ) {
                data { ${REVIEW_FIELDS} }
                error { code message }
            }
        }
    }
`;

const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($modelId: ID!, $revisionId: ID!) {
        cms {
            getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId) {
                data {
                    review { ${REVIEW_FIELDS} }
                }
                error { code message }
            }
        }
    }
`;

const runReviewMutation = async (
    session: ApiSession,
    query: string,
    variables: Record<string, unknown>
): Promise<ReviewAttempt> => {
    const result = await callGraphql<ReviewMutationData>(session, "graphql", query, variables);
    const response = requireData(result, "review operation").cms.operation;
    return {
        review: response.data,
        errorCode: response.error?.code ?? null,
        errorMessage: response.error?.message ?? null
    };
};

/** Requests a review of the entry revision, as the session's user. */
export const requestReview = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry,
    title: string
): Promise<ReviewAttempt> => {
    return runReviewMutation(session, REQUEST_REVIEW, {
        modelId: model.modelId,
        revisionId: entry.id,
        title
    });
};

/** Starts the step, as the session's user: they become its owner. */
export const startStep = async (
    session: ApiSession,
    step: ReviewStepRef
): Promise<ReviewAttempt> => {
    return runReviewMutation(session, START_STEP, { ...step });
};

/** Approves the step, as the session's user. */
export const approveStep = async (
    session: ApiSession,
    step: ReviewStepRef,
    comment: string | null = null
): Promise<ReviewAttempt> => {
    return runReviewMutation(session, APPROVE_STEP, { ...step, comment });
};

/** The review of the entry revision, as the session's user sees it; null when it has none. */
export const getTargetReview = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<Review | null> => {
    const result = await callGraphql<TargetReviewData>(session, "graphql", GET_TARGET_REVIEW, {
        modelId: model.modelId,
        revisionId: entry.id
    });
    const response = requireData(result, "getCmsEntryTargetReview").cms.getCmsEntryTargetReview;
    if (response.error) {
        throw new Error(`getCmsEntryTargetReview failed: ${response.error.message}`);
    }
    return response.data?.review ?? null;
};

interface CancelForDeleteData {
    cms: {
        cancelCmsEntryReviewsForDelete: {
            error: WorkflowsError | null;
        };
    };
}

const CANCEL_FOR_DELETE = /* GraphQL */ `
    mutation CancelForDelete($modelId: ID!, $entryId: ID!) {
        cms {
            cancelCmsEntryReviewsForDelete(modelId: $modelId, entryId: $entryId, action: delete) {
                error {
                    code
                    message
                }
            }
        }
    }
`;

/**
 * Cancels the reviews that would block deleting the entry, as the admin's delete dialog does.
 * Returns the error message, or null.
 */
export const cancelReviewsForDelete = async (
    session: ApiSession,
    model: TestModel,
    entry: TestEntry
): Promise<string | null> => {
    const result = await callGraphql<CancelForDeleteData>(session, "graphql", CANCEL_FOR_DELETE, {
        modelId: model.modelId,
        entryId: entry.entryId
    });
    return (
        result.errors?.[0]?.message ??
        result.data?.cms.cancelCmsEntryReviewsForDelete.error?.message ??
        null
    );
};

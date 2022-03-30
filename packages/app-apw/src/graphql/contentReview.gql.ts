import gql from "graphql-tag";
import { ApwContentReview, ApwContentReviewContent } from "~/types";

const ERROR_FIELDS = `{
    message
    code
    data
}`;

const META_FIELDS = `{
    totalCount
    hasMoreItems
    cursor
}`;

const getDataFields = (fields = "") => `{
    id
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    status
    title
    content {
        id
        type
        version
        publishedOn
        publishedBy {
            displayName
        }
        scheduledBy {
            displayName
        }
        scheduledOn
    }
    steps {
        status
        id
        title
        pendingChangeRequests
        signOffProvidedOn
        signOffProvidedBy {
            id
            displayName
        }
    }
    ${fields}
}`;

/**
 * ##################
 * Get "ContentReview" Query Response
 */
export interface GetContentReviewQueryResponse {
    apw: {
        getContentReview: {
            data: ApwContentReview;
            error?: Error | null;
        };
    };
}

export interface GetContentReviewQueryVariables {
    id: string;
}

export const GET_CONTENT_REVIEW_QUERY = /* GraphQL */ gql`
    query GetContentReview($id: ID!) {
        apw {
            getContentReview(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * List "ContentReview" Query Response
 */
export interface ListContentReviewsResponse {
    data: ApwContentReview[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}

export interface ListContentReviewsQueryResponse {
    apw: {
        listContentReviews: ListContentReviewsResponse;
    };
}

export interface ListContentReviewsQueryVariables {
    where?: Record<string, any>;
    limit?: number;
    after?: string;
    sort?: string[];
}

export const LIST_CONTENT_REVIEWS_QUERY = /* GraphQL */ gql`
    query ListContentReviews(
        $where: ApwListContentReviewsWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListContentReviewsSort!]
    ) {
        apw {
            listContentReviews(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort
            ) {
                data ${getDataFields(`
                activeStep {
                    title
                    id
                }
                totalComments
                latestCommentId
                reviewers
                `)}
                error ${ERROR_FIELDS}
                meta ${META_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Create "ContentReview" Mutation Response
 */
export interface CreateContentReviewMutationResponse {
    apw: {
        contentReview: {
            data: ApwContentReview;
            error?: Error | null;
        };
    };
}

export interface CreateApwContentReviewMutationVariables {
    data: {
        content: Pick<ApwContentReviewContent, "id" | "type">;
    };
}

export const CREATE_CONTENT_REVIEW_MUTATION = /* GraphQL */ gql`
    mutation CreateContentReviewMutation($data: ApwCreateContentReviewInput!) {
        apw {
            contentReview: createContentReview(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Create "ContentReview" Mutation Response
 */
export interface DeleteContentReviewMutationResponse {
    apw: {
        deleteContentReview: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface DeleteApwContentReviewMutationVariables {
    id: string;
}

export const DELETE_CONTENT_REVIEW_MUTATION = /* GraphQL */ gql`
    mutation DeleteContentReviewMutation($id: ID!) {
        apw {
            deleteContentReview(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Provide Sign off Mutation Response
 */
export interface ProvideSignOffMutationResponse {
    apw: {
        provideSignOff: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface ProvideSignOffMutationVariables {
    id: string;
    step: string;
}

export const PROVIDE_SIGN_OFF_MUTATION = /* GraphQL */ gql`
    mutation ProvideSignOffMutation($id: ID!, $step: String!) {
        apw {
            provideSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Retract Sign off Mutation Response
 */
export interface RetractSignOffMutationResponse {
    apw: {
        retractSignOff: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface RetractSignOffMutationVariables {
    id: string;
    step: string;
}

export const RETRACT_SIGN_OFF_MUTATION = /* GraphQL */ gql`
    mutation RetractSignOffMutation($id: ID!, $step: String!) {
        apw {
            retractSignOff(id: $id, step: $step) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Publish content Mutation Response
 */
export interface PublishContentMutationResponse {
    apw: {
        publishContent: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface PublishContentMutationVariables {
    id: string;
    datetime?: string;
}

export const PUBLISH_CONTENT_MUTATION = /* GraphQL */ gql`
    mutation PublishContentMutation($id: ID!, $datetime: String) {
        apw {
            publishContent(id: $id, datetime: $datetime) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * UnPublish content Mutation Response
 */
export interface UnPublishContentMutationResponse {
    apw: {
        unpublishContent: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface UnPublishContentMutationVariables {
    id: string;
    datetime?: string;
}

export const UNPUBLISH_CONTENT_MUTATION = /* GraphQL */ gql`
    mutation UnpublishContentMutation($id: ID!, $datetime: String) {
        apw {
            unpublishContent(id: $id, datetime: $datetime) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Delete Scheduled Action Mutation Response
 */
export interface DeleteScheduledActionMutationResponse {
    apw: {
        deleteScheduledAction: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface DeleteScheduledActionMutationVariables {
    id: string;
}

export const DELETE_SCHEDULED_ACTION_MUTATION = /* GraphQL */ gql`
    mutation DeleteScheduledActionMutation($id: ID!) {
        apw {
            deleteScheduledAction(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

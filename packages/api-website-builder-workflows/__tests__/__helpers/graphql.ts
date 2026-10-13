import { createUserHandler, type UserContextParams } from "./userContext.js";

/** A user that sends GraphQL requests to `/graphql`; `run` returns the response body. */
export const asGraphQLUser = (params: UserContextParams = {}) => {
    const handler = createUserHandler(params);
    return {
        context: handler.context,
        run: async (query: string, variables: Record<string, unknown> = {}) => {
            const [body] = await handler.invoke({ body: { query, variables } });
            return body;
        }
    };
};

const ERROR_FIELDS = /* GraphQL */ `
    error {
        code
        message
        data
    }
`;

const WORKFLOW_FIELDS = /* GraphQL */ `
    id
    name
    models
    savedOn
    steps {
        id
        title
        type
        config
    }
`;

const REVIEW_FIELDS = /* GraphQL */ `
    id
    model
    targetId
    targetRevisionId
    title
    isActive
    state
    currentStepId
    currentStepState
    currentStepType
    createdBy {
        id
        displayName
    }
    steps {
        id
        state
        owner {
            id
        }
        comment
    }
`;

const FLAGS_FIELDS = /* GraphQL */ `
    flags {
        canStart
        canTakeOver
        canApprove
        canReject
        canCancel
        canReassign
        canRestart
    }
`;

/** A review read: steps carry their assignment-log entries (R96). */
const REVIEW_DETAIL_FIELDS = /* GraphQL */ `
    review {
        ${REVIEW_FIELDS}
        steps {
            id
            description
            assignments {
                id
                kind
                source
                userId
                reason
            }
        }
    }
    ${FLAGS_FIELDS}
`;

export const LIST_WORKFLOWS = /* GraphQL */ `
    query ListWorkflows {
        websiteBuilder {
            listWebsiteBuilderPageWorkflows {
                data { ${WORKFLOW_FIELDS} }
                meta {
                    cursor
                    hasMoreItems
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_WORKFLOW = /* GraphQL */ `
    query GetWorkflow($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageWorkflow(id: $id) {
                data { ${WORKFLOW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const STORE_WORKFLOW = /* GraphQL */ `
    mutation StoreWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        websiteBuilder {
            storeWebsiteBuilderPageWorkflow(data: $data, savedOn: $savedOn) {
                data { ${WORKFLOW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_WORKFLOW = /* GraphQL */ `
    mutation DeleteWorkflow($id: ID!) {
        websiteBuilder {
            deleteWebsiteBuilderPageWorkflow(id: $id) {
                data { id }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
                data { ${REVIEW_DETAIL_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($revisionId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageTargetReview(revisionId: $revisionId) {
                data { ${REVIEW_DETAIL_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_REVIEWS = /* GraphQL */ `
    query ListReviews(
        $list: WorkflowsReviewListKind!
        $where: WbPageReviewListWhere
        $sort: WorkflowsReviewListSort
        $limit: Int
        $after: String
    ) {
        websiteBuilder {
            listWebsiteBuilderPageReviews(
                list: $list
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    review { ${REVIEW_FIELDS} }
                    ${FLAGS_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview($revisionId: ID!, $title: String, $picks: [WorkflowsReviewPickInput!]) {
        websiteBuilder {
            requestWebsiteBuilderPageReview(revisionId: $revisionId, title: $title, picks: $picks) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const START_STEP = /* GraphQL */ `
    mutation StartStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            startWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const TAKE_OVER_STEP = /* GraphQL */ `
    mutation TakeOverStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            takeOverWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const APPROVE_STEP = /* GraphQL */ `
    mutation ApproveStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            approveWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const REJECT_STEP = /* GraphQL */ `
    mutation RejectStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            rejectWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
            ) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReview(reviewId: $reviewId) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete($pageId: ID!, $action: WorkflowsReviewsForDeleteAction!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(pageId: $pageId, action: $action) {
                data { ${REVIEW_FIELDS} }
                ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_PAGE_SYSTEM = /* GraphQL */ `
    query GetPageSystem($id: ID!) {
        websiteBuilder {
            getPageById(id: $id) {
                data {
                    id
                    system {
                        workflow {
                            workflowId
                            reviewState
                            stepId
                            stepName
                            stepState
                        }
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const TYPE_FIELDS = /* GraphQL */ `
    query TypeFields($name: String!) {
        __type(name: $name) {
            fields {
                name
            }
        }
    }
`;

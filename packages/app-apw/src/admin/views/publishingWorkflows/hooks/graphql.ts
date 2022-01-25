import gql from "graphql-tag";

const ERROR_FIELDS = `{
    message
    code
    data
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
    app
    title
    scope {
        type
        data
    }
    steps {
        title
        id
        type
        reviewers
    }
    ${fields}
}`;

export const GET_WORKFLOW_QUERY = /* GraphQL */ gql`
    query GetWorkflow($id: ID!) {
        apw {
            getWorkflow(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_WORKFLOWS_QUERY = /* GraphQL */ gql`
    query ListWorkflows(
        $where: ApwListWorkflowsWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListWorkflowsSort!],
        $search: ApwListWorkflowsSearchInput
    ) {
        apw {
            listWorkflows(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort,
                search: $search
            ) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
                meta {
                    hasMoreItems
                    totalCount
                    cursor
                }
            }
        }
    }
`;

export const CREATE_WORKFLOW_MUTATION = /* GraphQL */ gql`
    mutation CreateWorkflowMutation($data: ApwCreateWorkflowInput!) {
        apw {
            workflow: createWorkflow(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_WORKFLOW_MUTATION = /* GraphQL */ gql`
    mutation UpdateWorkflowMutation($id: ID!, $data: ApwUpdateWorkflowInput!) {
        apw {
            workflow: updateWorkflow(id: $id, data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_WORKFLOW_MUTATION = /* GraphQL */ gql`
    mutation DeleteWorkflowMutation($id: ID!) {
        apw {
            deleteWorkflow(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

const REVIEWER_DATA_FIELDS = `{
    id
    createdOn
    savedOn
    createdBy {
        id
        displayName
        type
    }
    identityId
    displayName
    type
}`;

export const GET_REVIEWER_QUERY = /* GraphQL */ gql`
    query GetReviewer($id: ID!) {
        apw {
            getWorkflow(id: $id) {
                data ${REVIEWER_DATA_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_REVIEWS_QUERY = /* GraphQL */ gql`
    query ListReviewers(
        $where: ApwListReviewersWhereInput
        $limit: Int
        $after: String
        $sort: [ApwListReviewersSort!]
        $search: ApwListReviewersSearchInput
    ) {
        apw {
            listReviewers(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort,
                search: $search
            ) {
                data ${REVIEWER_DATA_FIELDS}
                error ${ERROR_FIELDS}
                meta {
                    hasMoreItems
                    totalCount
                    cursor
                }
            }
        }
    }
`;

import gql from "graphql-tag";
import { ApwWorkflow } from "~/types";

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

/**
 * ##################
 * Get "Workflow" Query Response
 */
export interface GetWorkflowQueryResponse {
    apw: {
        getWorkflow: {
            data: ApwWorkflow;
            error?: Error | null;
        };
    };
}

export interface GetWorkflowQueryVariables {
    id: string;
}

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

/**
 * ##################
 * List "Workflow Query Response
 */
export interface ListWorkflowResponse {
    data: ApwWorkflow[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}

export interface ListWorkflowQueryResponse {
    apw: {
        listWorkflows: ListWorkflowResponse;
    };
}

export interface ListWorkflowQueryVariables {
    where?: Record<string, any>;
    limit?: number;
    after?: string;
    sort?: string[];
    search?: string;
}

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

/**
 * ##################
 * Create "Workflow" Mutation Response
 */
export interface CreateWorkflowMutationResponse {
    apw: {
        workflow: {
            data: ApwWorkflow;
            error?: Error | null;
        };
    };
}

export interface CreateWorkflowMutationVariables {
    data: Partial<ApwWorkflow>;
}

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

/**
 * ##################
 * Update "Workflow" Mutation Response
 */
export interface UpdateWorkflowMutationResponse {
    apw: {
        workflow: {
            data: ApwWorkflow;
            error?: Error | null;
        };
    };
}

export interface UpdateWorkflowMutationVariables {
    id: string;
    data: Partial<ApwWorkflow>;
}

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

/**
 * ##################
 * Delete "Workflow" Mutation Response
 */
export interface DeleteWorkflowMutationResponse {
    apw: {
        deleteWorkflow: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface DeleteWorkflowMutationVariables {
    id: string;
}

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

const CATEGORIES_BASE_FIELDS = `
    {
        slug
        name
        layout
        url
        createdOn
        createdBy {
            id
            displayName
        }
    }
`;

export const LIST_CATEGORIES = gql`
    query ListCategories {
        pageBuilder {
            listCategories {
                data ${CATEGORIES_BASE_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_PAGES_DATA_FIELDS = `
    id
    pid
    status
    title
    version
    savedOn
    category {
        name
        slug
    }
    createdBy {
        id
        displayName
    }
`;

export const LIST_PAGES = gql`
    query PbListPages(
        $where: PbListPagesWhereInput
        $sort: [PbListPagesSort!]
        $search: PbListPagesSearchInput
        $limit: Int
        $after: String
    ) {
        pageBuilder {
            listPages(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data {
                    ${LIST_PAGES_DATA_FIELDS}
                }
                meta ${META_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

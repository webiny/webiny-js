import gql from "graphql-tag";
import { ApwChangeRequest } from "~/types";

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
    step
    title
    body
    resolved
    media
    ${fields}
}`;
/**
 * ##################
 * Get "ChangeRequest" Query Response
 */
export interface GetChangeRequestQueryResponse {
    apw: {
        getChangeRequest: {
            data: ApwChangeRequest;
            error?: Error | null;
        };
    };
}

export interface GetChangeRequestQueryVariables {
    id: string;
}

export const GET_CHANGE_REQUEST_QUERY = /* GraphQL */ gql`
    query GetChangeRequest($id: ID!) {
        apw {
            getChangeRequest(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * List "ChangeRequest" Query Response
 */
export interface ListChangeRequestsResponse {
    data: ApwChangeRequest[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}
export interface ListChangeRequestsQueryResponse {
    apw: {
        listChangeRequests: ListChangeRequestsResponse;
    };
}
export interface ListChangeRequestsQueryVariables {
    where?: Record<string, any>;
    sort?: string[];
    limit?: number;
    search?: string;
    after?: string;
}

export const LIST_CHANGE_REQUESTS_QUERY = /* GraphQL */ gql`
    query ListChangeRequests(
        $where: ApwListChangeRequestWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListChangeRequestSort!],
        $search: ApwListChangeRequestSearchInput
    ) {
        apw {
            listChangeRequests(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort,
                search: $search
            ) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
                meta ${META_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Create "ChangeRequest" Mutation Response
 */
export interface CreateChangeRequestMutationResponse {
    apw: {
        changeRequest: {
            data: ApwChangeRequest;
            error?: Error | null;
        };
    };
}

export interface CreateChangeRequestMutationVariables {
    data: Partial<ApwChangeRequest>;
}

export const CREATE_CHANGE_REQUEST_MUTATION = /* GraphQL */ gql`
    mutation CreateChangeRequestMutation($data: ApwCreateChangeRequestInput!) {
        apw {
            changeRequest: createChangeRequest(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Update "ChangeRequest" Mutation Response
 */
export interface UpdateChangeRequestMutationResponse {
    apw: {
        changeRequest: {
            data: ApwChangeRequest;
            error?: Error | null;
        };
    };
}

export interface UpdateChangeRequestMutationVariables {
    id: string;
    data: Partial<ApwChangeRequest>;
}

export const UPDATE_CHANGE_REQUEST_MUTATION = /* GraphQL */ gql`
    mutation UpdateChangeRequestMutation($id: ID!, $data: ApwUpdateChangeRequestInput!) {
        apw {
            changeRequest: updateChangeRequest(id: $id, data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

/**
 * ##################
 * Delete "ChangeRequest" Mutation Response
 */
export interface DeleteChangeRequestMutationResponse {
    apw: {
        deleteChangeRequest: {
            data: boolean;
            error?: Error | null;
        };
    };
}

export interface DeleteChangeRequestMutationVariables {
    id: string;
}

export const DELETE_CHANGE_REQUEST_MUTATION = /* GraphQL */ gql`
    mutation DeleteChangeRequestMutation($id: ID!) {
        apw {
            deleteChangeRequest(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

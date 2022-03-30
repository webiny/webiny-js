import gql from "graphql-tag";

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

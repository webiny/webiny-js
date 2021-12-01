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
    body
    title
    media
    resolved
    ${fields}
}`;

export const GET_CHANGE_REQUESTED_QUERY = /* GraphQL */ `
    query GetChangeRequested($id: ID!) {
        advancedPublishingWorkflow {
            getChangeRequested(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_CHANGES_REQUESTED_QUERY = /* GraphQL */ `
    query ListChangeRequesteds(
        $where: ApwListChangeRequestedWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListChangeRequestedSort!],
        $search: ApwListChangeRequestedSearchInput
    ) {
        advancedPublishingWorkflow {
            listChangesRequested(
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

export const CREATE_CHANGE_REQUESTED_MUTATION = /* GraphQL */ `
    mutation CreateChangeRequestedMutation($data: ApwCreateChangeRequestedInput!) {
        advancedPublishingWorkflow {
            createChangeRequested(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_CHANGE_REQUESTED_MUTATION = /* GraphQL */ `
    mutation UpdateChangeRequestedMutation($id: ID!, $data: ApwUpdateChangeRequestedInput!) {
        advancedPublishingWorkflow {
            updateChangeRequested(id: $id, data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_CHANGE_REQUESTED_MUTATION = /* GraphQL */ `
    mutation DeleteChangeRequestedMutation($id: ID!) {
        advancedPublishingWorkflow {
            deleteChangeRequested(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

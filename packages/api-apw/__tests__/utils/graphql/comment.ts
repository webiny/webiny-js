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
    ${fields}
}`;

export const GET_COMMENT_QUERY = /* GraphQL */ `
    query GetComment($id: ID!) {
        advancedPublishingWorkflow {
            getComment(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_COMMENTS_QUERY = /* GraphQL */ `
    query ListComments(
        $where: ApwListCommentsWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListCommentsSort!],
        $search: ApwListCommentsSearchInput
    ) {
        advancedPublishingWorkflow {
            listComments(
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

export const CREATE_COMMENT_MUTATION = /* GraphQL */ `
    mutation CreateCommentMutation($data: ApwCreateCommentInput!) {
        advancedPublishingWorkflow {
            createComment(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_COMMENT_MUTATION = /* GraphQL */ `
    mutation UpdateCommentMutation($id: ID!, $data: ApwUpdateCommentInput!) {
        advancedPublishingWorkflow {
            updateComment(id: $id, data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_COMMENT_MUTATION = /* GraphQL */ `
    mutation DeleteCommentMutation($id: ID!) {
        advancedPublishingWorkflow {
            deleteComment(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

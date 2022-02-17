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
    changeRequest
    media
    ${fields}
}`;

export const GET_COMMENT_QUERY = /* GraphQL */ `
    query GetComment($id: ID!) {
        apw {
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
        $sort: [ApwListCommentsSort!]
    ) {
        apw {
            listComments(
                where: $where,
                limit: $limit,
                after: $after,
                sort: $sort
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
        apw {
            createComment(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_COMMENT_MUTATION = /* GraphQL */ `
    mutation UpdateCommentMutation($id: ID!, $data: ApwUpdateCommentInput!) {
        apw {
            updateComment(id: $id, data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_COMMENT_MUTATION = /* GraphQL */ `
    mutation DeleteCommentMutation($id: ID!) {
        apw {
            deleteComment(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

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
    body
    changeRequest
    media
    ${fields}
}`;

export const GET_COMMENT_QUERY = /* GraphQL */ gql`
    query GetComment($id: ID!) {
        apw {
            getComment(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_COMMENTS_QUERY = /* GraphQL */ gql`
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
                meta ${META_FIELDS}
            }
        }
    }
`;

export const CREATE_COMMENT_MUTATION = /* GraphQL */ gql`
    mutation CreateCommentMutation($data: ApwCreateCommentInput!) {
        apw {
            comment: createComment(data: $data) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_COMMENT_MUTATION = /* GraphQL */ gql`
    mutation DeleteCommentMutation($id: ID!) {
        apw {
            deleteComment(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

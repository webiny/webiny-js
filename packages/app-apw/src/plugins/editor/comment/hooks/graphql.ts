import gql from "graphql-tag";

const ERROR_FIELDS = `{
    message
    code
    data
}`;

// const META_FIELDS = `{
//     totalCount
//     hasMoreItems
//     cursor
// }`;

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

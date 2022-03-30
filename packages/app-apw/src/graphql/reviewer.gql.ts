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

const DATA_FIELDS = `{
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
                data ${DATA_FIELDS}
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
                data ${DATA_FIELDS}
                error ${ERROR_FIELDS}
                meta ${META_FIELDS}
            }
        }
    }
`;

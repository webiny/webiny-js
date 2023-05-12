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
    identityId
    displayName
    type
    email
    ${fields}
}`;

export const GET_REVIEWER_QUERY = /* GraphQL */ `
    query GetReviewer($id: ID!) {
        apw {
            getReviewer(id: $id) {
                data ${getDataFields()}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const LIST_REVIEWERS_QUERY = /* GraphQL */ `
    query ListReviewers(
        $where: ApwListReviewersWhereInput,
        $limit: Int,
        $after: String,
        $sort: [ApwListReviewersSort!],
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

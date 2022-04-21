import gql from "graphql-tag";

const ERROR_FIELDS = `{
    message
    code
    data
}`;

export const IS_REVIEW_REQUIRED_QUERY = /* GraphQL */ gql`
    query IsReviewRequired($data: ApwContentReviewContentInput!) {
        apw {
            isReviewRequired(data: $data) {
                data {
                    isReviewRequired
                    contentReviewId
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

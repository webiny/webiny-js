import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";

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

export const useContentReviewId = (id: string): string | null => {
    const { data } = useQuery(IS_REVIEW_REQUIRED_QUERY, {
        variables: {
            data: {
                id,
                type: "page"
            }
        },
        skip: !id
    });

    return get(data, "apw.isReviewRequired.data.contentReviewId", null);
};

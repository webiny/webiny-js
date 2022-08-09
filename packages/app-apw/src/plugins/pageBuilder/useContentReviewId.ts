import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { IS_REVIEW_REQUIRED_QUERY } from "~/plugins/graphql";

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

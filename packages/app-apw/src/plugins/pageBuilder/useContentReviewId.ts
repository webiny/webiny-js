import { useQuery } from "@apollo/react-hooks";
import dotPropImmutable from "dot-prop-immutable";
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

    return dotPropImmutable.get(data, "apw.isReviewRequired.data.contentReviewId", null);
};

import { useQuery } from "@apollo/react-hooks";
import dotPropImmutable from "dot-prop-immutable";
import { CmsModel } from "~/types";
import { IS_REVIEW_REQUIRED_QUERY } from "~/plugins/graphql";

export const useContentReviewId = (id: string, model: CmsModel): string | null => {
    const { data } = useQuery(IS_REVIEW_REQUIRED_QUERY, {
        variables: {
            data: {
                id,
                type: "cms_entry",
                settings: {
                    modelId: model.modelId
                }
            }
        },
        skip: !id,
        fetchPolicy: "network-only"
    });

    return dotPropImmutable.get(data, "apw.isReviewRequired.data.contentReviewId", null);
};

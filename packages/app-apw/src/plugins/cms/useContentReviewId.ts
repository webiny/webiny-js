import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
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
        skip: !id
    });

    return get(data, "apw.isReviewRequired.data.contentReviewId", null);
};

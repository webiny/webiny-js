import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_REVIEWS = /* GraphQL */ `
    query ListCmsEntryReviews(
        $list: WorkflowsReviewListKind!
        $where: WorkflowsReviewListWhere
        $sort: WorkflowsReviewListSort
        $limit: Int
        $after: String
    ) {
        cms {
            listCmsEntryReviews(
                list: $list
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    ${REVIEW_WITH_FLAGS_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

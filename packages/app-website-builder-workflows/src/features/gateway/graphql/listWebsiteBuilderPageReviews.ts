import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_REVIEWS = /* GraphQL */ `
    query ListWebsiteBuilderPageReviews(
        $list: WorkflowsReviewListKind!
        $where: WbPageReviewListWhere
        $sort: WorkflowsReviewListSort
        $limit: Int
        $after: String
    ) {
        websiteBuilder {
            listWebsiteBuilderPageReviews(
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

import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_WEBSITE_BUILDER_PAGE_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelWebsiteBuilderPageReviewsForDelete(
        $pageId: ID!
        $revisionId: ID
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(
                pageId: $pageId
                revisionId: $revisionId
                action: $action
            ) {
                data {
                    ${REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

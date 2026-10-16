import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const APPROVE_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation ApproveWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        websiteBuilder {
            approveWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                comment: $comment
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

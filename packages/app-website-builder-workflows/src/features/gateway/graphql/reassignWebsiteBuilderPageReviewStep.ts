import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REASSIGN_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation ReassignWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!, $userId: ID!) {
        websiteBuilder {
            reassignWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                userId: $userId
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

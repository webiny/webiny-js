import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const START_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation StartWebsiteBuilderPageReviewStep($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            startWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId) {
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

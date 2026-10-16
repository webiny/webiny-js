import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_REVIEW_STEP_CANDIDATES = /* GraphQL */ `
    query ListWebsiteBuilderPageReviewStepCandidates($reviewId: ID!, $stepId: ID!) {
        websiteBuilder {
            listWebsiteBuilderPageReviewStepCandidates(reviewId: $reviewId, stepId: $stepId) {
                data {
                    ${STEP_CANDIDATE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

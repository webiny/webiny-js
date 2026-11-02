import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const START_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation StartCmsEntryReviewStep($reviewId: ID!, $stepId: ID!) {
        cms {
            startCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
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

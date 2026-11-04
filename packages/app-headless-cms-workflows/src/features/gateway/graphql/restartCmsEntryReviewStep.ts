import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const RESTART_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation RestartCmsEntryReviewStep($reviewId: ID!, $stepId: ID!) {
        cms {
            restartCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId) {
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

import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REASSIGN_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation ReassignCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $userId: ID!) {
        cms {
            reassignCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, userId: $userId) {
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

import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const APPROVE_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation ApproveCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            approveCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
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

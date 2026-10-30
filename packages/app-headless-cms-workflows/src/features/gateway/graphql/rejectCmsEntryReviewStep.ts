import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REJECT_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation RejectCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $comment: String) {
        cms {
            rejectCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId, comment: $comment) {
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

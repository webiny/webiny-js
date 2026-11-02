import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const TAKE_OVER_CMS_ENTRY_REVIEW_STEP = /* GraphQL */ `
    mutation TakeOverCmsEntryReviewStep($reviewId: ID!, $stepId: ID!, $notifyPreviousOwner: Boolean) {
        cms {
            takeOverCmsEntryReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                notifyPreviousOwner: $notifyPreviousOwner
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

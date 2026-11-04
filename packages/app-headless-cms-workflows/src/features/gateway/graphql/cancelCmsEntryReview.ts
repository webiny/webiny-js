import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_CMS_ENTRY_REVIEW = /* GraphQL */ `
    mutation CancelCmsEntryReview($reviewId: ID!) {
        cms {
            cancelCmsEntryReview(reviewId: $reviewId) {
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

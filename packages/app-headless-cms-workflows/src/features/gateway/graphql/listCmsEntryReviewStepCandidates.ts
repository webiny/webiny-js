import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_REVIEW_STEP_CANDIDATES = /* GraphQL */ `
    query ListCmsEntryReviewStepCandidates($reviewId: ID!, $stepId: ID!) {
        cms {
            listCmsEntryReviewStepCandidates(reviewId: $reviewId, stepId: $stepId) {
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

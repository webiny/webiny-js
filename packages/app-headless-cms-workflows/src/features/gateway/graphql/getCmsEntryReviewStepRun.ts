import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_REVIEW_STEP_RUN = /* GraphQL */ `
    query GetCmsEntryReviewStepRun($reviewId: ID!, $stepId: ID!, $taskId: ID!) {
        cms {
            getCmsEntryReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId) {
                data {
                    ${STEP_RUN_INFO_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

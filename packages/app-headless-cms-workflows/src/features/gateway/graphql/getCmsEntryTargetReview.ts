import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_TARGET_REVIEW = /* GraphQL */ `
    query GetCmsEntryTargetReview($modelId: ID!, $revisionId: ID!) {
        cms {
            getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId) {
                data {
                    ${REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

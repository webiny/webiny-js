import { BLOCKING_REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_BLOCKING_REVIEWS = /* GraphQL */ `
    query ListCmsEntryBlockingReviews($modelId: ID!, $entryIds: [ID!]!) {
        cms {
            listCmsEntryBlockingReviews(modelId: $modelId, entryIds: $entryIds) {
                data {
                    ${BLOCKING_REVIEW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

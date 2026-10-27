import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REQUEST_CMS_ENTRY_REVIEW = /* GraphQL */ `
    mutation RequestCmsEntryReview(
        $modelId: ID!
        $revisionId: ID!
        $title: String
        $picks: [WorkflowsReviewPickInput!]
    ) {
        cms {
            requestCmsEntryReview(
                modelId: $modelId
                revisionId: $revisionId
                title: $title
                picks: $picks
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

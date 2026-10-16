import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_CMS_ENTRY_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelCmsEntryReviewsForDelete(
        $modelId: ID!
        $entryId: ID!
        $revisionId: ID
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        cms {
            cancelCmsEntryReviewsForDelete(
                modelId: $modelId
                entryId: $entryId
                revisionId: $revisionId
                action: $action
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

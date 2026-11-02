import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_CMS_ENTRY_REVIEW = /* GraphQL */ `
    query GetCmsEntryReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
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

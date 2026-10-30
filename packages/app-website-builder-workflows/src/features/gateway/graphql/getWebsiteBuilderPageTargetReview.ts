import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_TARGET_REVIEW = /* GraphQL */ `
    query GetWebsiteBuilderPageTargetReview($revisionId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageTargetReview(revisionId: $revisionId) {
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

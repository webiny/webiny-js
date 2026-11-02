import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const REQUEST_WEBSITE_BUILDER_PAGE_REVIEW = /* GraphQL */ `
    mutation RequestWebsiteBuilderPageReview(
        $revisionId: ID!
        $title: String
        $picks: [WorkflowsReviewPickInput!]
    ) {
        websiteBuilder {
            requestWebsiteBuilderPageReview(
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

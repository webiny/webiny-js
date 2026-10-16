import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CANCEL_WEBSITE_BUILDER_PAGE_REVIEW = /* GraphQL */ `
    mutation CancelWebsiteBuilderPageReview($reviewId: ID!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReview(reviewId: $reviewId) {
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

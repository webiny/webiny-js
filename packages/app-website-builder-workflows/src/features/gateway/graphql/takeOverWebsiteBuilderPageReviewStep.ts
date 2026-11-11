import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const TAKE_OVER_WEBSITE_BUILDER_PAGE_REVIEW_STEP = /* GraphQL */ `
    mutation TakeOverWebsiteBuilderPageReviewStep(
        $reviewId: ID!
        $stepId: ID!
        $notifyPreviousOwner: Boolean
    ) {
        websiteBuilder {
            takeOverWebsiteBuilderPageReviewStep(
                reviewId: $reviewId
                stepId: $stepId
                notifyPreviousOwner: $notifyPreviousOwner
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

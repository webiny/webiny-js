import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const GET_WEBSITE_BUILDER_PAGE_REVIEW = /* GraphQL */ `
    query GetWebsiteBuilderPageReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
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

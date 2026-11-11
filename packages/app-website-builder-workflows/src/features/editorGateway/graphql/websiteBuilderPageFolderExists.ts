import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const WEBSITE_BUILDER_PAGE_FOLDER_EXISTS = /* GraphQL */ `
    query WebsiteBuilderPageFolderExists($id: ID!) {
        websiteBuilder {
            websiteBuilderPageFolderExists(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

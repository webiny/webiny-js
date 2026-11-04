import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const CMS_ENTRY_FOLDER_EXISTS = /* GraphQL */ `
    query CmsEntryFolderExists($id: ID!, $type: String!) {
        cms {
            cmsEntryFolderExists(id: $id, type: $type) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

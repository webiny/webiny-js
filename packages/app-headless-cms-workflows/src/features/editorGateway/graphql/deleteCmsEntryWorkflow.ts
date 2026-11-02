import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const DELETE_CMS_ENTRY_WORKFLOW = /* GraphQL */ `
    mutation DeleteCmsEntryWorkflow($id: ID!) {
        cms {
            deleteCmsEntryWorkflow(id: $id) {
                data {
                    ${EDITOR_WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

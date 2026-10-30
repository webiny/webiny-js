import { EDITOR_WORKFLOW_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const STORE_CMS_ENTRY_WORKFLOW = /* GraphQL */ `
    mutation StoreCmsEntryWorkflow($data: WorkflowsWorkflowInput!, $savedOn: String) {
        cms {
            storeCmsEntryWorkflow(data: $data, savedOn: $savedOn) {
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

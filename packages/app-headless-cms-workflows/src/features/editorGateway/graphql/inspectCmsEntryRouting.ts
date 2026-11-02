import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const INSPECT_CMS_ENTRY_ROUTING = /* GraphQL */ `
    query InspectCmsEntryRouting($stepConfig: JSON!, $modelId: ID!, $requesterId: ID!, $folderId: ID) {
        cms {
            inspectCmsEntryRouting(stepConfig: $stepConfig, modelId: $modelId, requesterId: $requesterId, folderId: $folderId) {
                data {
                    ${EDITOR_ROUTING_INSPECTION_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

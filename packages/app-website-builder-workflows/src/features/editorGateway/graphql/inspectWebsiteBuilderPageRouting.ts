import { EDITOR_ROUTING_INSPECTION_FIELDS } from "@webiny/app-workflows/editor/gateway/editorFields.js";
import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const INSPECT_WEBSITE_BUILDER_PAGE_ROUTING = /* GraphQL */ `
    query InspectWebsiteBuilderPageRouting($stepConfig: JSON!, $requesterId: ID!, $folderId: ID) {
        websiteBuilder {
            inspectWebsiteBuilderPageRouting(stepConfig: $stepConfig, requesterId: $requesterId, folderId: $folderId) {
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

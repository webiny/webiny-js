import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_WORKFLOWS = /* GraphQL */ `
    query ListCmsEntryWorkflows {
        cms {
            listCmsEntryWorkflows {
                data {
                    ${WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

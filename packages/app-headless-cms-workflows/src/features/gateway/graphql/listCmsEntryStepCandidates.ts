import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_CMS_ENTRY_STEP_CANDIDATES = /* GraphQL */ `
    query ListCmsEntryStepCandidates(
        $workflowId: ID!
        $stepId: ID!
        $modelId: ID!
        $revisionId: ID!
    ) {
        cms {
            listCmsEntryStepCandidates(
                workflowId: $workflowId
                stepId: $stepId
                modelId: $modelId
                revisionId: $revisionId
            ) {
                data {
                    ${STEP_CANDIDATE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

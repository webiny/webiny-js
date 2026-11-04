import { ERROR_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const LIST_WEBSITE_BUILDER_PAGE_STEP_CANDIDATES = /* GraphQL */ `
    query ListWebsiteBuilderPageStepCandidates($workflowId: ID!, $stepId: ID!, $revisionId: ID!) {
        websiteBuilder {
            listWebsiteBuilderPageStepCandidates(
                workflowId: $workflowId
                stepId: $stepId
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

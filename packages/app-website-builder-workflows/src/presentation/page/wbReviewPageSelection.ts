import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";

export const WB_REVIEW_PAGE_SELECTION = `system {
    workflow {
        ${REVIEW_SYSTEM_WORKFLOW_SELECTION}
    }
}`;

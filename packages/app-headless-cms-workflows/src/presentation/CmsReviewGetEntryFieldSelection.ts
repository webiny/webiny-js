import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";

class CmsReviewGetEntryFieldSelectionImpl implements GetEntryGraphQLFieldSelection.Interface {
    getSelection(): string[] {
        return [`meta { system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } } }`];
    }
}

export const CmsReviewGetEntryFieldSelection = GetEntryGraphQLFieldSelection.createImplementation({
    dependencies: [],
    implementation: CmsReviewGetEntryFieldSelectionImpl
});

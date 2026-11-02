import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { ReviewFieldLabels } from "@webiny/app-workflows/review/presentation/reviewDetails/abstractions.js";

// Field id → label of the model, so Review details names the fields of AI issues as the form does.
export const getModelFieldLabels = (model: CmsModel): ReviewFieldLabels => {
    const labels: ReviewFieldLabels = {};
    for (const field of model.fields ?? []) {
        labels[field.fieldId] = field.label;
    }
    return labels;
};

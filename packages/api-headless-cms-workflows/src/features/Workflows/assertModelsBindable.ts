import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";

const MODEL_NOT_FOUND = "Cms/Model/NotFound";

/**
 * Spec 4.1, D41: a workflow can only bind an existing, publishable CMS model. Throws
 * `WorkflowValidationError`, which `StoreWorkflowUseCase` returns as a failed result. Non-CMS
 * namespaces (`wb.page`) are skipped; the namespace format itself is checked by
 * `WorkflowValidator` before any event is published. Other model read errors propagate.
 */
export const assertModelsBindable = async (
    getModel: GetModelUseCase.Interface,
    models: string[]
): Promise<void> => {
    for (const namespaceId of models) {
        const modelId = getModelIdFromAppName(namespaceId);
        if (!modelId) {
            continue;
        }
        const model = await getModel.execute(modelId);
        if (model.isFail()) {
            if (model.error.code === MODEL_NOT_FOUND) {
                throw new WorkflowValidationError(`The model "${modelId}" does not exist.`);
            }
            throw model.error;
        }
        const tags = model.value.tags || [];
        if (!tags.includes("$publishing:false")) {
            continue;
        }
        throw new WorkflowValidationError(
            `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`
        );
    }
};

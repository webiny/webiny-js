import { WorkflowBeforeCreateEventHandler } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { UNPUBLISHABLE_MODEL_TAG } from "~/utils/isBindableModel.js";

const MODEL_NOT_FOUND = "Cms/Model/NotFound";
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";

/**
 * Spec 4.1, D41: a workflow can only bind an existing, public, publishable CMS model. Throws
 * `WorkflowValidationError`, which `StoreWorkflowUseCase` returns as a failed result. Non-CMS
 * namespaces (`wb.page`) are skipped; the namespace format itself is checked by
 * `WorkflowValidator` before any event is published. Other model read errors propagate.
 *
 * Binding requires read access to the model (R38): a model the caller cannot access fails
 * validation instead of throwing `Cms/Model/NotAuthorized` out of `StoreWorkflowUseCase`. The CMS
 * hides code-defined models the caller cannot access, so those report as not found. The read stays
 * access-controlled on purpose: `GetModelRepository` or an elevated identity would fill the CMS
 * tenant-keyed model cache with a list other callers must not see.
 */
class DisallowUnpublishableModelsOnBeforeCreateImpl
    implements WorkflowBeforeCreateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeCreateEventHandler.Event): Promise<void> {
        for (const namespaceId of event.payload.workflow.models) {
            const modelId = getModelIdFromAppName(namespaceId);
            if (!modelId) {
                continue;
            }
            // oxlint-disable-next-line no-await-in-loop -- per-request cached model read, one per bound model.
            const model = await this.getModel.execute(modelId);
            if (model.isFail()) {
                if (model.error.code === MODEL_NOT_FOUND) {
                    throw new WorkflowValidationError(`The model "${modelId}" does not exist.`, {
                        field: "models"
                    });
                }
                if (model.error.code === MODEL_NOT_AUTHORIZED) {
                    throw new WorkflowValidationError(
                        `You don't have access to the model "${modelId}".`,
                        { field: "models" }
                    );
                }
                throw model.error;
            }
            if (model.value.isPrivate) {
                throw new WorkflowValidationError(
                    `Cannot bind a workflow to the model "${modelId}" because it is a private model.`,
                    { field: "models" }
                );
            }
            const tags = model.value.tags || [];
            if (!tags.includes(UNPUBLISHABLE_MODEL_TAG)) {
                continue;
            }
            throw new WorkflowValidationError(
                `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`,
                { field: "models" }
            );
        }
    }
}

export const DisallowUnpublishableModelsOnBeforeCreate =
    WorkflowBeforeCreateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeCreateImpl,
        dependencies: [GetModelUseCase]
    });

import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowNotFoundError,
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { belongsToWb, isWbWorkflow, WB_PAGES_ONLY } from "../shared/wbWorkflows.js";
import { StoreWebsiteBuilderPageWorkflowUseCase as UseCase } from "./abstractions.js";

class StoreWebsiteBuilderPageWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private storeWorkflow: StoreWorkflowUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "manage workflows" }));
        }
        if (!belongsToWb(input.workflow.models)) {
            return Result.fail(new WorkflowValidationError(WB_PAGES_ONLY, { field: "models" }));
        }

        // Never overwrite another app's workflow under the same id (R46).
        const existing = await this.getWorkflow.execute({ id: input.workflow.id });
        if (existing.isFail() && !(existing.error instanceof WorkflowNotFoundError)) {
            return Result.fail(existing.error);
        }
        if (existing.isOk() && !isWbWorkflow(existing.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflow.id }));
        }

        return this.storeWorkflow.execute({
            workflow: input.workflow,
            savedOn: input.savedOn,
            actor: actor.value
        });
    }
}

export const StoreWebsiteBuilderPageWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWebsiteBuilderPageWorkflowUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        GetWorkflowUseCase,
        StoreWorkflowUseCase
    ]
});

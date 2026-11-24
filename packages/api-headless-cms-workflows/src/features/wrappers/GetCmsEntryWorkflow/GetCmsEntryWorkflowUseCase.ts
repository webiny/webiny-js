import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import {
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { createCmsWorkflowReadCheck } from "../shared/canReadCmsWorkflow.js";
import { GetCmsEntryWorkflowUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const workflow = await this.getWorkflow.execute({ id: input.id });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        if (!isCmsWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }
        // Security: workflow editors, or identities that can read entries of a bound model.
        let canRead: boolean;
        try {
            canRead = await createCmsWorkflowReadCheck({
                permissions: this.permissions,
                getModel: this.getModel,
                accessControl: this.accessControl
            })(workflow.value);
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canRead) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "read workflows" }));
        }
        return Result.ok(workflow.value);
    }
}

export const GetCmsEntryWorkflowUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryWorkflowUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        GetWorkflowUseCase,
        WorkflowsPermissions,
        GetModelUseCase,
        AccessControl
    ]
});

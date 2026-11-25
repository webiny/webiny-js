import { Result } from "@webiny/feature/api";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { canReadWbWorkflows } from "../shared/canReadWbWorkflows.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import {
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { GetWebsiteBuilderPageWorkflowUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private workflowsPermissions: WorkflowsPermissions.Interface,
        private wbPermissions: WbPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canRead: boolean;
        try {
            canRead = await canReadWbWorkflows(this.workflowsPermissions, this.wbPermissions);
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

        const workflow = await this.getWorkflow.execute({ id: input.id });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        if (!isWbWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }
        return Result.ok(workflow.value);
    }
}

export const GetWebsiteBuilderPageWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageWorkflowUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, WbPermissions, GetWorkflowUseCase]
});

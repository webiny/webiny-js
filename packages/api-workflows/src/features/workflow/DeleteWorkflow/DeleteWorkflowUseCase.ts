import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GetWorkflowUseCase } from "../GetWorkflow/index.js";
import { DeleteWorkflowRepository, DeleteWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowBeforeDeleteEvent, WorkflowAfterDeleteEvent } from "./events.js";
import { WorkflowNotFoundError, WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type {
    IWorkflowsSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private repository: DeleteWorkflowRepository.Interface
    ) {}

    async execute(input: UseCase.Params): UseCase.Return {
        // NOTE: Authorization check - ensure manage access
        // Original implementation: line 78
        const hasAccess = await this.ensureManageAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        // NOTE: Get workflow to verify it exists and get full data for events
        // Original implementation: line 79-85
        const workflowResult = await this.getWorkflow.execute(input);
        if (workflowResult.isFail()) {
            return Result.fail(
                new WorkflowNotFoundError({
                    id: input.id,
                    app: input.app
                })
            );
        }

        const workflow = workflowResult.value;

        // NOTE: Publish before delete event
        await this.eventPublisher.publish(
            new WorkflowBeforeDeleteEvent({
                workflow
            })
        );

        // NOTE: Delete via repository
        // Original implementation: line 86-93
        const result = await this.repository.execute(input);
        if (result.isFail()) {
            return result;
        }

        // NOTE: Publish after delete event
        await this.eventPublisher.publish(
            new WorkflowAfterDeleteEvent({
                workflow
            })
        );

        return Result.ok();
    }

    private async ensureManageAccess(): Promise<Result<void, WorkflowNotAuthorizedError>> {
        // NOTE: Check permissions
        // Original implementation: line 154-167
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );

        for (const permission of permissions) {
            if (permission.name === "*") {
                return Result.ok();
            } else if (permission.editor === ("yes" as WorkflowsSecurityPermissionAccessLevel)) {
                return Result.ok();
            }
        }

        return Result.fail(new WorkflowNotAuthorizedError("You cannot manage workflows."));
    }
}

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, GetWorkflowUseCase, DeleteWorkflowRepository]
});

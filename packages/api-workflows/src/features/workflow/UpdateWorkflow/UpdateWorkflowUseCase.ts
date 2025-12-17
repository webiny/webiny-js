import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { UpdateWorkflowRepository, UpdateWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowBeforeUpdateEvent, WorkflowAfterUpdateEvent } from "./events.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type {
    IWorkflowsSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";

class UpdateWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateWorkflowRepository.Interface
    ) {}

    async execute(input: UseCase.Input, original: UseCase.Input): UseCase.Return {
        // NOTE: Authorization check - ensure manage access
        // Original implementation: line 154-167
        const hasAccess = await this.ensureManageAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        // NOTE: Prepare workflow for events
        const workflow = {
            id: input.id,
            app: input.app,
            name: input.name,
            steps: input.steps
        };

        // NOTE: Publish before update event
        await this.eventPublisher.publish(
            new WorkflowBeforeUpdateEvent({
                workflow,
                original,
                input
            })
        );

        // NOTE: Update via repository
        // Original implementation: line 187-206
        const result = await this.repository.execute(input);
        if (result.isFail()) {
            return result;
        }

        // NOTE: Publish after update event
        await this.eventPublisher.publish(
            new WorkflowAfterUpdateEvent({
                workflow: result.value,
                original,
                input
            })
        );

        return Result.ok(result.value);
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

export const UpdateWorkflowUseCase = UseCase.createImplementation({
    implementation: UpdateWorkflowUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, UpdateWorkflowRepository]
});

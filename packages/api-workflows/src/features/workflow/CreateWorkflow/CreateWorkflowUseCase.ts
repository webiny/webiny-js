import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { CreateWorkflowRepository, CreateWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowAfterCreateEvent, WorkflowBeforeCreateEvent } from "./events.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import { WorkflowsSecurityPermissionAccessLevel } from "~/types.js";

class CreateWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateWorkflowRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const hasAccess = await this.ensureManageAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        const workflow = {
            id: input.id,
            app: input.app,
            name: input.name,
            steps: input.steps
        };

        await this.eventPublisher.publish(
            new WorkflowBeforeCreateEvent({
                workflow,
                input
            })
        );

        const result = await this.repository.execute(input);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new WorkflowAfterCreateEvent({
                workflow: result.value,
                input
            })
        );

        return Result.ok(result.value);
    }

    private async ensureManageAccess(): Promise<Result<void, WorkflowNotAuthorizedError>> {
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );

        for (const permission of permissions) {
            if (permission.name === "*") {
                return Result.ok();
            } else if (permission.editor === WorkflowsSecurityPermissionAccessLevel.YES) {
                return Result.ok();
            }
        }

        return Result.fail(new WorkflowNotAuthorizedError("You cannot manage workflows."));
    }
}

export const CreateWorkflowUseCase = UseCase.createImplementation({
    implementation: CreateWorkflowUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, CreateWorkflowRepository]
});

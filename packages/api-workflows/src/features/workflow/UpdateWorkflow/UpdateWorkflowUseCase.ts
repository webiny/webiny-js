import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateWorkflowRepository, UpdateWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowAfterUpdateEvent, WorkflowBeforeUpdateEvent } from "./events.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";

class UpdateWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateWorkflowRepository.Interface
    ) {}

    async execute(input: UseCase.Input, original: UseCase.Input): UseCase.Return {
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
            new WorkflowBeforeUpdateEvent({
                workflow,
                original,
                input
            })
        );

        const result = await this.repository.execute(input);
        if (result.isFail()) {
            return result;
        }

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
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );

        for (const permission of permissions) {
            if (permission.name === "*") {
                return Result.ok();
            } else if (permission.editor) {
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

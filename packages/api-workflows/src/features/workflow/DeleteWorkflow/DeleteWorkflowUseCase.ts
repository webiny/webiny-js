import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GetWorkflowUseCase } from "../GetWorkflow/index.js";
import { DeleteWorkflowRepository, DeleteWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowAfterDeleteEvent, WorkflowBeforeDeleteEvent } from "./events.js";
import { WorkflowNotAuthorizedError, WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private repository: DeleteWorkflowRepository.Interface
    ) {}

    async execute(input: UseCase.Params): UseCase.Return {
        const hasAccess = await this.ensureManageAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

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

        await this.eventPublisher.publish(
            new WorkflowBeforeDeleteEvent({
                workflow
            })
        );

        const result = await this.repository.execute(input);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new WorkflowAfterDeleteEvent({
                workflow
            })
        );

        return Result.ok();
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

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [IdentityContext, EventPublisher, GetWorkflowUseCase, DeleteWorkflowRepository]
});

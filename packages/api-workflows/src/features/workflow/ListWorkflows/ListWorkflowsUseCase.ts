import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListWorkflowsRepository, ListWorkflowsUseCase as UseCase } from "./abstractions.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { WorkflowAppAccess } from "~/features/workflow/WorkflowAppAccess/index.js";
import { canManageWorkflows } from "~/features/shared/canManageWorkflows.js";

class ListWorkflowsUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private appAccess: WorkflowAppAccess.Interface,
        private repository: ListWorkflowsRepository.Interface
    ) {}

    async execute(input: UseCase.Params): UseCase.Return {
        const hasAccess = await this.ensureHasAccess(input);
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }

    /**
     * Workflows are listed by those who manage them, or (the review UI of content editors) by
     * those who can read every app the list is narrowed to. Background work (tasks, scheduler)
     * runs without authorization and keeps access.
     */
    private async ensureHasAccess(
        input: UseCase.Params
    ): Promise<Result<void, WorkflowNotAuthorizedError>> {
        if (!this.identityContext.isAuthorizationEnabled()) {
            return Result.ok();
        }
        const notAuthorized = new WorkflowNotAuthorizedError(
            "You do not have access to workflows."
        );
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(notAuthorized);
        }
        if (await canManageWorkflows(this.identityContext)) {
            return Result.ok();
        }

        const apps = [input?.where?.app, ...(input?.where?.app_in || [])].filter(
            (app): app is string => !!app
        );
        // Without an app filter the list would span apps the identity may not read.
        if (apps.length === 0) {
            return Result.fail(notAuthorized);
        }
        for (const app of apps) {
            if (!(await this.appAccess.canRead(app))) {
                return Result.fail(notAuthorized);
            }
        }
        return Result.ok();
    }
}

export const ListWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [IdentityContext, WorkflowAppAccess, ListWorkflowsRepository]
});

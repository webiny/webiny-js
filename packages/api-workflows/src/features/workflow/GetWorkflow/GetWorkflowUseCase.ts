import { Result } from "@webiny/feature/api";
import { GetWorkflowRepository, GetWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WorkflowAppAccess } from "~/features/workflow/WorkflowAppAccess/index.js";
import { canManageWorkflows } from "~/features/shared/canManageWorkflows.js";

class GetWorkflowUseCaseImpl implements UseCase.Interface {
    private readonly repository;
    private readonly identityContext;
    private readonly appAccess;

    constructor(
        repository: GetWorkflowRepository.Interface,
        identityContext: IdentityContext.Interface,
        appAccess: WorkflowAppAccess.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
        this.appAccess = appAccess;
    }

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
     * Only those who manage workflows or can read the workflow's app may read it. The repository
     * refuses a workflow whose app differs from `input.app`. Background work (tasks, scheduler)
     * runs without authorization and keeps access.
     */
    private async ensureHasAccess(
        input: UseCase.Params
    ): Promise<Result<void, WorkflowNotAuthorizedError>> {
        if (!this.identityContext.isAuthorizationEnabled()) {
            return Result.ok();
        }
        const identity = this.identityContext.getIdentity();
        if (!identity.isAnonymous()) {
            if (await canManageWorkflows(this.identityContext)) {
                return Result.ok();
            }
            if (await this.appAccess.canRead(input.app)) {
                return Result.ok();
            }
        }
        return Result.fail(new WorkflowNotAuthorizedError("You do not have access to workflows."));
    }
}

export const GetWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [GetWorkflowRepository, IdentityContext, WorkflowAppAccess]
});

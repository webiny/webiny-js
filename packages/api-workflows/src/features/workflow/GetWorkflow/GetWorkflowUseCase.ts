import { Result } from "@webiny/feature/api";
import { GetWorkflowRepository, GetWorkflowUseCase as UseCase } from "./abstractions.js";
import { WorkflowNotAuthorizedError } from "~/domain/workflow/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class GetWorkflowUseCaseImpl implements UseCase.Interface {
    private readonly repository;
    private readonly identityContext;

    constructor(
        repository: GetWorkflowRepository.Interface,
        identityContext: IdentityContext.Interface
    ) {
        this.repository = repository;
        this.identityContext = identityContext;
    }

    async execute(input: UseCase.Params): UseCase.Return {
        const hasAccess = await this.ensureHasAccess();
        if (hasAccess.isFail()) {
            return Result.fail(hasAccess.error);
        }

        const result = await this.repository.execute(input);

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }

    private async ensureHasAccess(): Promise<Result<void, WorkflowNotAuthorizedError>> {
        const identity = this.identityContext.getIdentity();
        if (!identity.isAnonymous()) {
            return Result.ok();
        }
        return Result.fail(new WorkflowNotAuthorizedError("You do not have access to workflows."));
    }
}

export const GetWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [GetWorkflowRepository, IdentityContext]
});
